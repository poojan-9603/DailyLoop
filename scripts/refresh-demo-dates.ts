/**
 * Shifts all demo org data so "today" always has a study plan and recent sessions.
 * Idempotent — safe to run multiple times.
 *
 * Usage: npx tsx --env-file=.env.local scripts/refresh-demo-dates.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const org = await db.organization.findFirst({ where: { name: "Texas Sports Academy Demo" } });
  if (!org) {
    console.error("No demo org found. Run db:seed first.");
    process.exit(1);
  }

  // Find the most recent StudyPlan date for demo students
  const students = await db.student.findMany({
    where: { user: { orgId: org.id } },
    select: { id: true, userId: true },
  });
  if (students.length === 0) {
    console.log("No demo students found.");
    process.exit(0);
  }

  const recentPlan = await db.studyPlan.findFirst({
    where: { studentId: { in: students.map((s) => s.id) } },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (!recentPlan) {
    console.log("No plans to shift.");
    process.exit(0);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(recentPlan.date);
  lastDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    console.log("Demo dates already current.");
    process.exit(0);
  }

  console.log(`Shifting demo data by ${diffDays} day(s)…`);

  // Shift StudyPlan dates
  const plans = await db.studyPlan.findMany({
    where: { studentId: { in: students.map((s) => s.id) } },
  });
  for (const plan of plans) {
    const newDate = new Date(plan.date);
    newDate.setDate(newDate.getDate() + diffDays);
    await db.studyPlan.update({ where: { id: plan.id }, data: { date: newDate } });
  }

  // Shift TrainingSession dates
  const sessions = await db.trainingSession.findMany({
    where: { studentId: { in: students.map((s) => s.id) } },
  });
  for (const session of sessions) {
    const newDate = new Date(session.date);
    newDate.setDate(newDate.getDate() + diffDays);
    await db.trainingSession.update({ where: { id: session.id }, data: { date: newDate } });
  }

  // Shift Digest dates
  const digests = await db.digest.findMany({
    where: { studentId: { in: students.map((s) => s.id) } },
  });
  for (const digest of digests) {
    const newDate = new Date(digest.date);
    newDate.setDate(newDate.getDate() + diffDays);
    await db.digest.update({ where: { id: digest.id }, data: { date: newDate } });
  }

  console.log(
    `Done. Shifted ${plans.length} plans, ${sessions.length} sessions, ${digests.length} digests by ${diffDays} days.`,
  );
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.$disconnect());
