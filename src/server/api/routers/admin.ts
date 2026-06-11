import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { audit } from "@/server/audit";
import { callAI } from "@/ai/call";
import { DigestOutputSchema } from "@/ai/schemas";
import { buildDigestPrompt } from "@/ai/prompts/digest";
import { env } from "@/env";

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function requireAdminOrg(db: typeof import("@/server/db").db, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { orgId: true } });
  if (!user) throw new TRPCError({ code: "NOT_FOUND" });
  return user.orgId;
}

export const adminRouter = createTRPCRouter({
  /** Attention-first items: students needing follow-up. */
  attentionList: adminProcedure.query(async ({ ctx }) => {
    const orgId = await requireAdminOrg(ctx.db, ctx.user.id);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const students = await ctx.db.student.findMany({
      where: { user: { orgId } },
      include: {
        user: { select: { name: true } },
        studyPlans: {
          where: { date: { gte: threeDaysAgo } },
          include: { tasks: { select: { completed: true } } },
        },
        trainingSessions: {
          where: { date: { gte: fiveDaysAgo } },
          select: { id: true },
        },
        insights: {
          where: { dismissedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const attention: Array<{
      studentId: string;
      name: string;
      reason: string;
      severity: "high" | "medium";
    }> = [];

    for (const s of students) {
      // Low academic completion 3+ days
      const lowCompDays = s.studyPlans.filter((plan) => {
        const total = plan.tasks.length;
        const done = plan.tasks.filter((t) => t.completed).length;
        return total > 0 && done / total < 0.6;
      });
      if (lowCompDays.length >= 3) {
        attention.push({
          studentId: s.id,
          name: s.user.name ?? "Unknown",
          reason: `Academic completion below 60% for ${lowCompDays.length} consecutive days`,
          severity: "high",
        });
        continue;
      }

      // No training in 5+ days
      if (s.trainingSessions.length === 0) {
        attention.push({
          studentId: s.id,
          name: s.user.name ?? "Unknown",
          reason: "No training sessions in the last 5 days",
          severity: "medium",
        });
        continue;
      }

      // Negative insight (plateau or cross-domain)
      const negInsight = s.insights[0];
      if (negInsight && (negInsight.type === "PLATEAU" || negInsight.type === "CROSS_DOMAIN")) {
        attention.push({
          studentId: s.id,
          name: s.user.name ?? "Unknown",
          reason: negInsight.content,
          severity: "medium",
        });
      }
    }

    return attention;
  }),

  /** Full roster with per-student stats. */
  roster: adminProcedure.query(async ({ ctx }) => {
    const orgId = await requireAdminOrg(ctx.db, ctx.user.id);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const students = await ctx.db.student.findMany({
      where: { user: { orgId } },
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        studyPlans: {
          where: { date: { gte: sevenDaysAgo } },
          include: { tasks: { select: { completed: true } } },
        },
        trainingSessions: {
          where: { date: { gte: sevenDaysAgo } },
          select: { date: true, drill: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return students.map((s) => {
      const weekCompletion = s.studyPlans.map((plan) => {
        const total = plan.tasks.length;
        const done = plan.tasks.filter((t) => t.completed).length;
        return total > 0 ? Math.round((done / total) * 100) : 0;
      });

      const avgCompletion =
        weekCompletion.length > 0
          ? Math.round(weekCompletion.reduce((a, b) => a + b, 0) / weekCompletion.length)
          : null;

      return {
        id: s.id,
        userId: s.userId,
        name: s.user.name ?? "Unknown",
        email: s.user.email,
        gradeLevel: s.gradeLevel,
        sports: s.sports,
        avgCompletion7d: avgCompletion,
        sessionCount7d: s.trainingSessions.length,
        weekSparkline: weekCompletion,
      };
    });
  }),

  /** Send the nightly digest for a specific student. */
  sendDigest: adminProcedure
    .input(z.object({ studentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = await requireAdminOrg(ctx.db, ctx.user.id);

      const student = await ctx.db.student.findFirst({
        where: { id: input.studentId, user: { orgId } },
        include: { user: { select: { name: true, email: true } } },
      });
      if (!student) throw new TRPCError({ code: "NOT_FOUND" });

      const today = todayDate();

      // Gather data
      const plan = await ctx.db.studyPlan.findUnique({
        where: { studentId_date: { studentId: input.studentId, date: today } },
        include: { tasks: { select: { completed: true } } },
      });

      const sessions = await ctx.db.trainingSession.findMany({
        where: { studentId: input.studentId, date: today },
        include: { coach: { include: { user: { select: { name: true } } } } },
      });

      const total = plan?.tasks.length ?? 0;
      const done = plan?.tasks.filter((t) => t.completed).length ?? 0;
      const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

      // AI writes digest
      const digestResult = await callAI(
        DigestOutputSchema,
        buildDigestPrompt({
          studentName: student.user.name ?? "Student",
          completionPct,
          totalTasks: total,
          completedTasks: done,
          sessions: sessions.map((s) => ({
            drill: s.drill,
            value: s.value,
            unit: s.unit,
            coach: s.coach.user.name ?? "Coach",
          })),
          date: today.toISOString().split("T")[0]!,
        }),
      );

      const content = digestResult.success
        ? digestResult.data.content
        : `${student.user.name ?? "Your child"} completed ${completionPct}% of their academic tasks today and had ${sessions.length} training session(s).`;

      // Save to DB
      const existing = await ctx.db.digest.findFirst({
        where: { studentId: input.studentId, date: today },
      });
      const digest = existing
        ? await ctx.db.digest.update({ where: { id: existing.id }, data: { content } })
        : await ctx.db.digest.create({ data: { studentId: input.studentId, date: today, content } });

      // Find parent emails
      const parents = await ctx.db.parentStudent.findMany({
        where: { studentId: input.studentId },
        include: { parentUser: { select: { email: true, name: true } } },
      });

      let emailsSent = 0;
      let previewHtml: string | null = null;

      // Build magic link for the first parent
      if (parents.length > 0) {
        const { signMagic } = await import("@/lib/magic-token");
        const secret = env.MAGIC_LINK_SECRET ?? env.AUTH_SECRET;
        const appUrl = env.NEXT_PUBLIC_APP_URL;
        const magicToken = await signMagic(
          {
            userId: parents[0]!.parentUserId,
            role: "PARENT",
            name: parents[0]!.parentUser.name ?? "Parent",
            exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
          },
          secret,
        );
        const magicUrl = `${appUrl}/api/auth/magic/${magicToken}`;

        if (env.RESEND_API_KEY) {
          const { Resend } = await import("resend");
          const { render } = await import("@react-email/render");
          const { DigestEmail } = await import("@/emails/DigestEmail");
          const resend = new Resend(env.RESEND_API_KEY);
          const pixelUrl = `${appUrl}/api/digest/${digest.id}/pixel.png`;

          for (const parent of parents) {
            const html = await render(
              DigestEmail({
                studentName: student.user.name ?? "Student",
                content,
                magicUrl,
                pixelUrl,
                date: today.toISOString().split("T")[0]!,
              }),
            );
            await resend.emails.send({
              from: "TSA OS <noreply@tsa.demo>",
              to: parent.parentUser.email,
              subject: `${student.user.name ?? "Your child"}'s day at Texas Sports Academy`,
              html,
            });
            emailsSent++;
          }

          await ctx.db.digest.update({
            where: { id: digest.id },
            data: { emailedAt: new Date() },
          });
        } else {
          // Preview mode when no Resend key
          previewHtml = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2>TSA Daily Digest — ${today.toISOString().split("T")[0]!}</h2>
            <p><strong>To:</strong> ${parents.map((p) => p.parentUser.email).join(", ")}</p>
            <p><strong>Subject:</strong> ${student.user.name ?? "Student"}'s day at Texas Sports Academy</p>
            <hr/>
            <p>${content}</p>
            <p><a href="${magicUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">View Full Day</a></p>
            <p style="color:#888;font-size:12px;margin-top:24px">Magic link (preview only): ${magicUrl}</p>
          </div>`;
        }
      }

      await audit(ctx.user.id, "digest_sent", "Digest", digest.id);
      return { digest, emailsSent, previewHtml };
    }),

  /** Update org integration settings. */
  updateOrgSettings: adminProcedure
    .input(
      z.object({
        slackWebhookUrl: z.string().url().optional().or(z.literal("")),
        notionToken: z.string().optional(),
        notionDatabaseId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = await requireAdminOrg(ctx.db, ctx.user.id);
      const org = await ctx.db.organization.update({
        where: { id: orgId },
        data: {
          slackWebhookUrl: input.slackWebhookUrl || null,
          notionToken: input.notionToken || null,
          notionDatabaseId: input.notionDatabaseId || null,
        },
      });
      await audit(ctx.user.id, "org_settings_updated", "Organization", orgId);
      return org;
    }),

  /** Get current org settings. */
  orgSettings: adminProcedure.query(async ({ ctx }) => {
    const orgId = await requireAdminOrg(ctx.db, ctx.user.id);
    const org = await ctx.db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slackWebhookUrl: true, notionToken: true, notionDatabaseId: true },
    });
    if (!org) throw new TRPCError({ code: "NOT_FOUND" });
    return org;
  }),

  /** Test the Slack webhook by posting a test message. */
  testSlack: adminProcedure.mutation(async ({ ctx }) => {
    const orgId = await requireAdminOrg(ctx.db, ctx.user.id);
    const org = await ctx.db.organization.findUnique({
      where: { id: orgId },
      select: { slackWebhookUrl: true },
    });
    if (!org?.slackWebhookUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "No Slack webhook configured." });

    const res = await fetch(org.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "✅ TSA OS Slack integration is working!" }),
    });
    if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Slack returned an error." });
    return { ok: true };
  }),

  /** Sync Notion curriculum (pull rows → upsert Subjects). */
  syncNotion: adminProcedure.mutation(async ({ ctx }) => {
    const orgId = await requireAdminOrg(ctx.db, ctx.user.id);
    const org = await ctx.db.organization.findUnique({
      where: { id: orgId },
      select: { notionToken: true, notionDatabaseId: true },
    });
    if (!org?.notionToken || !org.notionDatabaseId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Notion credentials not configured." });
    }

    const res = await fetch(`https://api.notion.com/v1/databases/${org.notionDatabaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${org.notionToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Notion error: ${err}` });
    }

    const data = (await res.json()) as { results: Array<{ id: string; properties: Record<string, unknown> }> };
    let upserted = 0;

    for (const page of data.results) {
      const props = page.properties as Record<string, { title?: Array<{ plain_text: string }>; number?: number }>;
      const name = props["Name"]?.title?.[0]?.plain_text ?? "";
      const gradeLevel = props["Grade Level"]?.number ?? 9;
      if (!name) continue;

      await ctx.db.subject.upsert({
        where: { id: page.id },
        create: { id: page.id, orgId, name, gradeLevel },
        update: { name, gradeLevel },
      });
      upserted++;
    }

    await audit(ctx.user.id, "notion_sync", "Organization", orgId);
    return { upserted };
  }),
});
