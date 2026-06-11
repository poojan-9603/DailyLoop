import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { env } from "@/env";

const WorkablePayloadSchema = z.object({
  event_type: z.string(),
  data: z.object({
    candidate: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    job: z.object({
      title: z.string().optional(),
    }).optional(),
  }),
});

export async function POST(req: Request) {
  // Shared-secret validation
  const secret = env.WORKABLE_WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get("x-workable-signature") ?? req.headers.get("authorization") ?? "";
    if (!header.includes(secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = WorkablePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { data } = parsed.data;
  if (parsed.data.event_type !== "candidate_hired") {
    return NextResponse.json({ ok: true, message: "Event ignored" });
  }

  // Find or create user as COACH
  const existing = await db.user.findUnique({ where: { email: data.candidate.email } });
  if (existing) {
    return NextResponse.json({ ok: true, message: "User already exists", userId: existing.id });
  }

  // Find the default org (first org)
  const org = await db.organization.findFirst();
  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 500 });
  }

  const user = await db.user.create({
    data: {
      orgId: org.id,
      name: data.candidate.name,
      email: data.candidate.email,
      role: "COACH",
      coach: { create: { specialization: data.job?.title ?? "General" } },
    },
  });

  return NextResponse.json({ ok: true, userId: user.id, message: "Coach account created" });
}
