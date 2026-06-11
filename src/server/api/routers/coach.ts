import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { MetricType, InsightType } from "@prisma/client";
import { createTRPCRouter, coachProcedure } from "@/server/api/trpc";
import { audit } from "@/server/audit";
import { callAI } from "@/ai/call";
import { InsightPhraseSchema } from "@/ai/schemas";

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function requireCoach(db: typeof import("@/server/db").db, userId: string) {
  const coach = await db.coach.findUnique({
    where: { userId },
    include: { user: { select: { orgId: true } } },
  });
  if (!coach) throw new TRPCError({ code: "NOT_FOUND", message: "Coach record not found." });
  return coach;
}

// ---------------------------------------------------------------------------
// Insight engine — TypeScript rule-based math
// ---------------------------------------------------------------------------

interface SessionDataPoint {
  date: Date;
  drill: string;
  metricType: MetricType;
  value: number;
  studyCompletionPct?: number;
}

function detectPlateau(sessions: SessionDataPoint[], drill: string): boolean {
  const ds = sessions.filter((s) => s.drill === drill).sort((a, b) => a.date.getTime() - b.date.getTime());
  if (ds.length < 6) return false;
  const first = ds[0]!.value;
  const last = ds[ds.length - 1]!.value;
  const mt = ds[0]!.metricType;
  const improvement = mt === "TIME" ? (first - last) / first : (last - first) / first;
  return improvement < 0.05;
}

function detectImprovement(sessions: SessionDataPoint[], drill: string): boolean {
  const ds = sessions.filter((s) => s.drill === drill).sort((a, b) => a.date.getTime() - b.date.getTime());
  if (ds.length < 3) return false;
  const last = ds[ds.length - 1]!;
  const vals = ds.map((s) => s.value);
  const isPR = last.metricType === "TIME" ? last.value === Math.min(...vals) : last.value === Math.max(...vals);
  if (!isPR) return false;
  const mid = Math.floor(ds.length / 2);
  const firstHalfAvg = ds.slice(0, mid).reduce((s, x) => s + x.value, 0) / mid;
  const secondHalfAvg = ds.slice(mid).reduce((s, x) => s + x.value, 0) / (ds.length - mid);
  return last.metricType === "TIME" ? secondHalfAvg < firstHalfAvg : secondHalfAvg > firstHalfAvg;
}

function detectCrossDomain(sessions: SessionDataPoint[], drill: string): boolean {
  const ds = sessions.filter((s) => s.drill === drill);
  if (ds.length === 0) return false;
  const avg = ds.reduce((s, x) => s + x.value, 0) / ds.length;
  const mt = ds[0]!.metricType;
  const lowComp = ds.filter((s) => s.studyCompletionPct !== undefined && s.studyCompletionPct < 0.6);
  if (lowComp.length < 4) return false;
  return lowComp.every((s) => (mt === "TIME" ? s.value > avg : s.value < avg));
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const coachRouter = createTRPCRouter({
  /** Athletes this coach has recently worked with. */
  myAthletes: coachProcedure.query(async ({ ctx }) => {
    const coach = await requireCoach(ctx.db, ctx.user.id);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const sessions = await ctx.db.trainingSession.findMany({
      where: { coachId: coach.id, date: { gte: fourWeeksAgo } },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            studyPlans: {
              where: { date: todayDate() },
              include: { tasks: { select: { completed: true } } },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Deduplicate students, keep latest session per student
    const seen = new Map<string, (typeof sessions)[0]>();
    for (const s of sessions) {
      if (!seen.has(s.studentId)) seen.set(s.studentId, s);
    }

    return [...seen.values()].map((s) => {
      const plan = s.student.studyPlans[0];
      const total = plan?.tasks.length ?? 0;
      const done = plan?.tasks.filter((t) => t.completed).length ?? 0;
      return {
        id: s.student.id,
        name: s.student.user.name ?? "Unknown",
        drill: s.drill,
        value: s.value,
        unit: s.unit,
        date: s.date,
        todayCompletionPct: total > 0 ? Math.round((done / total) * 100) : null,
      };
    });
  }),

  /** Full roster for smart-log name matching. */
  roster: coachProcedure.query(async ({ ctx }) => {
    const coach = await requireCoach(ctx.db, ctx.user.id);
    const students = await ctx.db.student.findMany({
      where: { user: { orgId: coach.user.orgId } },
      include: { user: { select: { name: true } } },
    });
    return students.map((s) => ({ id: s.id, name: s.user.name ?? "Unknown" }));
  }),

  /** Save a training session after smart-log confirmation. */
  saveSession: coachProcedure
    .input(
      z.object({
        studentId: z.string(),
        drill: z.string().min(1).max(100),
        metricType: z.enum(["TIME", "REPS", "WEIGHT", "DISTANCE"]),
        value: z.number(),
        unit: z.string().min(1).max(20),
        notes: z.string().optional(),
        rawInput: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const coach = await requireCoach(ctx.db, ctx.user.id);

      // Verify student is in the same org
      const student = await ctx.db.student.findFirst({
        where: { id: input.studentId, user: { orgId: coach.user.orgId } },
      });
      if (!student) throw new TRPCError({ code: "FORBIDDEN", message: "Student not in your org." });

      const date = input.date ? new Date(input.date) : todayDate();

      const session = await ctx.db.trainingSession.create({
        data: {
          coachId: coach.id,
          studentId: input.studentId,
          date,
          drill: input.drill,
          metricType: input.metricType as MetricType,
          value: input.value,
          unit: input.unit,
          notes: input.notes,
          rawInput: input.rawInput,
        },
      });

      await audit(ctx.user.id, "session_logged", "TrainingSession", session.id);
      return session;
    }),

  /** Per-athlete detail: drill history + insights. */
  athleteDetail: coachProcedure
    .input(z.object({ studentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const coach = await requireCoach(ctx.db, ctx.user.id);

      const student = await ctx.db.student.findFirst({
        where: { id: input.studentId, user: { orgId: coach.user.orgId } },
        include: { user: { select: { name: true, email: true } } },
      });
      if (!student) throw new TRPCError({ code: "NOT_FOUND" });

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const sessions = await ctx.db.trainingSession.findMany({
        where: { studentId: input.studentId, date: { gte: fourteenDaysAgo } },
        orderBy: { date: "asc" },
      });

      const insights = await ctx.db.insight.findMany({
        where: { studentId: input.studentId, dismissedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      // Group sessions by drill for chart
      const drillMap = new Map<string, { date: string; value: number; unit: string }[]>();
      for (const s of sessions) {
        const key = s.drill;
        if (!drillMap.has(key)) drillMap.set(key, []);
        drillMap.get(key)!.push({
          date: s.date.toISOString().split("T")[0]!,
          value: s.value,
          unit: s.unit,
        });
      }

      return {
        student: { id: student.id, name: student.user.name ?? "Unknown" },
        drills: [...drillMap.entries()].map(([drill, points]) => ({ drill, points })),
        sessions: sessions.map((s) => ({
          id: s.id,
          date: s.date.toISOString().split("T")[0]!,
          drill: s.drill,
          metricType: s.metricType,
          value: s.value,
          unit: s.unit,
          notes: s.notes,
        })),
        insights: insights.map((i) => ({
          id: i.id,
          type: i.type,
          content: i.content,
          createdAt: i.createdAt,
        })),
      };
    }),

  /**
   * Cross-domain correlation (the product thesis, visualized): for each day in
   * the last 21 days, pair that day's academic study-completion % with the
   * athlete's performance on a chosen drill, and compute the Pearson
   * correlation. Proves "academics and athletics feed each other".
   */
  crossDomain: coachProcedure
    .input(z.object({ studentId: z.string(), drill: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const coach = await requireCoach(ctx.db, ctx.user.id);
      const student = await ctx.db.student.findFirst({
        where: { id: input.studentId, user: { orgId: coach.user.orgId } },
      });
      if (!student) throw new TRPCError({ code: "NOT_FOUND" });

      const since = new Date();
      since.setDate(since.getDate() - 21);
      since.setHours(0, 0, 0, 0);

      const [plans, sessions] = await Promise.all([
        ctx.db.studyPlan.findMany({
          where: { studentId: input.studentId, date: { gte: since } },
          include: { tasks: { select: { completed: true } } },
        }),
        ctx.db.trainingSession.findMany({
          where: { studentId: input.studentId, date: { gte: since } },
          orderBy: { date: "asc" },
        }),
      ]);

      // Available drills, sorted by frequency (most-logged first).
      const drillCounts = new Map<string, number>();
      for (const s of sessions) drillCounts.set(s.drill, (drillCounts.get(s.drill) ?? 0) + 1);
      const drills = [...drillCounts.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d);
      const selectedDrill = input.drill && drills.includes(input.drill) ? input.drill : drills[0];

      // Map ISO date -> study completion %.
      const completionByDate = new Map<string, number>();
      for (const plan of plans) {
        const key = plan.date.toISOString().split("T")[0]!;
        const total = plan.tasks.length;
        const done = plan.tasks.filter((t) => t.completed).length;
        completionByDate.set(key, total > 0 ? Math.round((done / total) * 100) : 0);
      }

      // Pair each session of the selected drill with that day's completion %.
      let unit = "";
      let metricType = "TIME";
      const points: Array<{ date: string; completionPct: number; metricValue: number }> = [];
      for (const s of sessions) {
        if (selectedDrill && s.drill !== selectedDrill) continue;
        const key = s.date.toISOString().split("T")[0]!;
        const completionPct = completionByDate.get(key);
        if (completionPct === undefined) continue;
        unit = s.unit;
        metricType = s.metricType;
        points.push({ date: key, completionPct, metricValue: s.value });
      }

      // Pearson correlation coefficient.
      const n = points.length;
      let r: number | null = null;
      if (n >= 3) {
        const xs = points.map((p) => p.completionPct);
        const ys = points.map((p) => p.metricValue);
        const mx = xs.reduce((a, b) => a + b, 0) / n;
        const my = ys.reduce((a, b) => a + b, 0) / n;
        let num = 0;
        let dx = 0;
        let dy = 0;
        for (let i = 0; i < n; i++) {
          const a = xs[i]! - mx;
          const b = ys[i]! - my;
          num += a * b;
          dx += a * a;
          dy += b * b;
        }
        const denom = Math.sqrt(dx * dy);
        r = denom === 0 ? 0 : num / denom;
      }

      // For TIME metrics a lower value is better, so a negative r (slower when
      // study drops) is the "good academics → good athletics" signal.
      const lowerIsBetter = metricType === "TIME";

      return {
        drill: selectedDrill ?? null,
        drills,
        unit,
        metricType,
        lowerIsBetter,
        points,
        correlation: r,
      };
    }),

  /** Dismiss an insight. */
  dismissInsight: coachProcedure
    .input(z.object({ insightId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insight.update({
        where: { id: input.insightId },
        data: { dismissedAt: new Date() },
      });
      return { ok: true };
    }),

  /** Run the insight engine for a student on demand. */
  generateInsight: coachProcedure
    .input(z.object({ studentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const coach = await requireCoach(ctx.db, ctx.user.id);

      const student = await ctx.db.student.findFirst({
        where: { id: input.studentId, user: { orgId: coach.user.orgId } },
      });
      if (!student) throw new TRPCError({ code: "NOT_FOUND" });

      // 1 insight per student per day max
      const todayStart = todayDate();
      const alreadyToday = await ctx.db.insight.findFirst({
        where: { studentId: input.studentId, createdAt: { gte: todayStart } },
      });
      if (alreadyToday) return { skipped: true, reason: "Already generated today", insight: null };

      // Load 14 days of sessions + daily study completion
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const sessions = await ctx.db.trainingSession.findMany({
        where: { studentId: input.studentId, date: { gte: fourteenDaysAgo } },
        orderBy: { date: "asc" },
      });

      const plans = await ctx.db.studyPlan.findMany({
        where: { studentId: input.studentId, date: { gte: fourteenDaysAgo } },
        include: { tasks: { select: { completed: true } } },
      });

      // Build completion map by ISO date
      const completionByDate = new Map<string, number>();
      for (const plan of plans) {
        const dateKey = plan.date.toISOString().split("T")[0]!;
        const total = plan.tasks.length;
        const done = plan.tasks.filter((t) => t.completed).length;
        completionByDate.set(dateKey, total > 0 ? done / total : 0);
      }

      // Enrich sessions with study completion
      const dataPoints: SessionDataPoint[] = sessions.map((s) => ({
        date: s.date,
        drill: s.drill,
        metricType: s.metricType,
        value: s.value,
        studyCompletionPct: completionByDate.get(s.date.toISOString().split("T")[0]!),
      }));

      const drills = [...new Set(sessions.map((s) => s.drill))];

      // Find best candidate
      let candidateType: InsightType | null = null;
      let candidateDrill = "";
      let candidateContext = "";

      for (const drill of drills) {
        if (detectCrossDomain(dataPoints, drill)) {
          candidateType = "CROSS_DOMAIN";
          candidateDrill = drill;
          const avg = dataPoints.filter((d) => d.drill === drill).reduce((s, x) => s + x.value, 0) / dataPoints.filter((d) => d.drill === drill).length;
          candidateContext = `Student's ${drill} performance is worse on days with study completion under 60%. Average: ${avg.toFixed(2)}`;
          break;
        }
      }

      if (!candidateType) {
        for (const drill of drills) {
          if (detectImprovement(dataPoints, drill)) {
            candidateType = "IMPROVEMENT";
            candidateDrill = drill;
            const ds = dataPoints.filter((d) => d.drill === drill);
            const best = ds[ds.length - 1]!;
            candidateContext = `Student just set a personal record on ${drill}: ${best.value} ${sessions.find((s) => s.drill === drill)?.unit ?? ""}`;
            break;
          }
        }
      }

      if (!candidateType) {
        for (const drill of drills) {
          if (detectPlateau(dataPoints, drill)) {
            candidateType = "PLATEAU";
            candidateDrill = drill;
            candidateContext = `Student's ${drill} performance has plateaued — less than 5% improvement over 14 days`;
            break;
          }
        }
      }

      if (!candidateType) return { skipped: true, reason: "No insight pattern detected", insight: null };

      // Skip if undismissed insight of same type exists
      const similar = await ctx.db.insight.findFirst({
        where: { studentId: input.studentId, type: candidateType, dismissedAt: null },
      });
      if (similar) return { skipped: true, reason: "Similar undismissed insight exists", insight: null };

      // AI writes one-liner phrasing
      const studentName = (await ctx.db.user.findUnique({ where: { id: student.userId }, select: { name: true } }))?.name ?? "this student";
      const phraseResult = await callAI(
        InsightPhraseSchema,
        `Write a one-sentence coaching insight (max 140 chars) for the coach about ${studentName}.\nType: ${candidateType}\nDrill: ${candidateDrill}\nContext: ${candidateContext}\nBe specific with numbers. Address the coach directly (e.g. "Marcus's sprint times...").`,
      );

      const content = phraseResult.success ? phraseResult.data.insight : candidateContext;

      const insight = await ctx.db.insight.create({
        data: { studentId: input.studentId, type: candidateType, content },
      });

      await audit(ctx.user.id, "insight_generated", "Insight", insight.id);
      return { skipped: false, reason: null, insight };
    }),
});
