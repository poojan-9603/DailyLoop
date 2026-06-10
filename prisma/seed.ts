/**
 * TSA OS seed — produces ~3 weeks of REALISTIC, internally-consistent data.
 *
 * Highlights the demo intentionally needs (see CLAUDE.md Phase 1 §6):
 *  - 1 org, 1 admin, 3 coaches (sprint/strength/endurance), 12 students (g6–11),
 *    8 parents (one student shares parents with a sibling; one student has 2 parents)
 *  - 8 subjects per grade
 *  - 21 days of StudyPlans/StudyTasks: most students 70–95% completion; TWO trending
 *    down (45–60%) so admin attention flags fire later; THREE students whose math
 *    actualMinutes routinely exceed planned
 *  - 21 days of TrainingSessions: 3–4/week with plausible progressions; ONE student
 *    plateaued on the 40-yard dash for 3 weeks; ONE with a clear PR last week; rawInput
 *    on ~half the sessions; sessions logged by the right-specialization coach
 *  - A few historical Insights and Digests
 *
 * Run: npm run db:seed  (requires a reachable DATABASE_URL).
 */
import { InsightType, MetricType, PrismaClient, Role } from "@prisma/client";

const db = new PrismaClient();

// ---- deterministic RNG so reseeds are stable ----
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260610);
const rand = () => rng();
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]!;
const jitter = (base: number, spread: number) => base + (rand() * 2 - 1) * spread;
const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

// ---- date helpers (date-only, UTC midnight) ----
const DAYS = 21;
function dayOffset(daysAgo: number): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}
/** offsets 20..0 (oldest -> today) */
const SEED_DAYS = Array.from({ length: DAYS }, (_, i) => DAYS - 1 - i);
const isWeekday = (d: Date) => {
  const wd = d.getUTCDay();
  return wd >= 1 && wd <= 5;
};

const DEMO = {
  STUDENT: "demo-student@tsa.demo",
  COACH: "demo-coach@tsa.demo",
  PARENT: "demo-parent@tsa.demo",
  ADMIN: "demo-admin@tsa.demo",
};

// ---- subjects per grade ----
const SUBJECT_NAMES = [
  "Algebra",
  "Geometry",
  "English",
  "Biology",
  "World History",
  "Spanish",
  "Computer Science",
  "Physical Science",
];
const MATH_SUBJECTS = new Set(["Algebra", "Geometry"]);

// ---- drills per specialization ----
const DRILLS = {
  sprint: [
    { drill: "40-yard dash", metricType: MetricType.TIME, unit: "s", base: 5.2, better: -1 },
    { drill: "Shuttle run", metricType: MetricType.TIME, unit: "s", base: 4.6, better: -1 },
  ],
  strength: [
    { drill: "Back squat", metricType: MetricType.WEIGHT, unit: "lb", base: 135, better: 1 },
    { drill: "Bench press", metricType: MetricType.WEIGHT, unit: "lb", base: 95, better: 1 },
  ],
  endurance: [
    { drill: "1-mile run", metricType: MetricType.TIME, unit: "s", base: 420, better: -1 },
    { drill: "2-mile run", metricType: MetricType.DISTANCE, unit: "mi", base: 2, better: 1 },
  ],
} as const;
type Spec = keyof typeof DRILLS;

interface StudentSpec {
  name: string;
  email: string;
  grade: number;
  sports: string[];
  spec: Spec; // which coach trains them
  completionBase: number; // 0..1 baseline completion
  mathOverachiever?: boolean;
  plateau?: boolean; // plateaued 40-yard dash
  pr?: boolean; // clear PR last week
}

const STUDENTS: StudentSpec[] = [
  // demo student — strong, sprint, used for the hero walkthrough
  { name: "Marcus Hill", email: DEMO.STUDENT, grade: 9, sports: ["Football", "Track"], spec: "sprint", completionBase: 0.86, pr: true },
  { name: "Jordan Pace", email: "jordan.pace@tsa.demo", grade: 10, sports: ["Track"], spec: "sprint", completionBase: 0.82, plateau: true },
  { name: "Ava Reyes", email: "ava.reyes@tsa.demo", grade: 8, sports: ["Soccer"], spec: "endurance", completionBase: 0.91 },
  { name: "Liam Carter", email: "liam.carter@tsa.demo", grade: 11, sports: ["Football"], spec: "strength", completionBase: 0.78, mathOverachiever: true },
  // declining #1 — sprinter so cross-domain correlation can surface later
  { name: "Noah Brooks", email: "noah.brooks@tsa.demo", grade: 9, sports: ["Track"], spec: "sprint", completionBase: 0.52 },
  { name: "Sofia Nguyen", email: "sofia.nguyen@tsa.demo", grade: 7, sports: ["Volleyball"], spec: "endurance", completionBase: 0.88 },
  { name: "Ethan Ward", email: "ethan.ward@tsa.demo", grade: 6, sports: ["Basketball"], spec: "strength", completionBase: 0.84, mathOverachiever: true },
  // declining #2
  { name: "Mia Foster", email: "mia.foster@tsa.demo", grade: 10, sports: ["Soccer"], spec: "endurance", completionBase: 0.48 },
  { name: "Lucas Kim", email: "lucas.kim@tsa.demo", grade: 11, sports: ["Track", "Football"], spec: "sprint", completionBase: 0.9 },
  { name: "Emma Davis", email: "emma.davis@tsa.demo", grade: 8, sports: ["Basketball"], spec: "strength", completionBase: 0.8, mathOverachiever: true },
  { name: "Caleb Ortiz", email: "caleb.ortiz@tsa.demo", grade: 7, sports: ["Wrestling"], spec: "strength", completionBase: 0.83 },
  { name: "Zoe Bennett", email: "zoe.bennett@tsa.demo", grade: 9, sports: ["Track"], spec: "endurance", completionBase: 0.87 },
];

const COACHES: Array<{ name: string; email: string; spec: Spec; specialization: string }> = [
  { name: "Coach Reyes", email: DEMO.COACH, spec: "sprint", specialization: "Speed & Sprint" },
  { name: "Coach Boone", email: "coach.boone@tsa.demo", spec: "strength", specialization: "Strength & Conditioning" },
  { name: "Coach Diaz", email: "coach.diaz@tsa.demo", spec: "endurance", specialization: "Endurance" },
];

async function main() {
  console.log("Resetting demo data…");
  // TRUNCATE CASCADE is atomic and respects FK order automatically.
  // Using raw SQL avoids the sequential-deleteMany FK races that happen when
  // a prior seed run is still holding connections on the pooler.
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog", "Digest", "Insight", "TrainingSession",
      "StudyTask", "StudyPlan", "ParentStudent", "Subject",
      "Student", "Coach", "Session", "Account", "VerificationToken",
      "User", "Organization"
    RESTART IDENTITY CASCADE
  `);

  const org = await db.organization.create({
    data: { name: "Texas Sports Academy — Demo" },
  });

  // ---- subjects per grade (6..11) ----
  const grades = [6, 7, 8, 9, 10, 11];
  const subjectByGradeName = new Map<string, string>(); // `${grade}:${name}` -> subjectId
  for (const grade of grades) {
    for (const name of SUBJECT_NAMES) {
      const s = await db.subject.create({ data: { orgId: org.id, name, gradeLevel: grade } });
      subjectByGradeName.set(`${grade}:${name}`, s.id);
    }
  }

  // ---- admin ----
  await db.user.create({
    data: { orgId: org.id, name: "Dana Whitfield", email: DEMO.ADMIN, role: Role.ADMIN },
  });

  // ---- coaches ----
  const coachBySpec = new Map<Spec, string>(); // spec -> coach.id
  for (const c of COACHES) {
    const u = await db.user.create({
      data: { orgId: org.id, name: c.name, email: c.email, role: Role.COACH },
    });
    const coach = await db.coach.create({
      data: { userId: u.id, specialization: c.specialization },
    });
    coachBySpec.set(c.spec, coach.id);
  }

  // ---- students ----
  const studentRecords: Array<{ spec: StudentSpec; studentId: string }> = [];
  for (const s of STUDENTS) {
    const u = await db.user.create({
      data: { orgId: org.id, name: s.name, email: s.email, role: Role.STUDENT },
    });
    const student = await db.student.create({
      data: { userId: u.id, gradeLevel: s.grade, sports: s.sports },
    });
    studentRecords.push({ spec: s, studentId: student.id });
  }

  // ---- parents (8) + ParentStudent links ----
  // Sibling pair shares two parents; one other student also has two parents.
  const parents = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      db.user.create({
        data: {
          orgId: org.id,
          name: `Parent ${i + 1}`,
          email: i === 0 ? DEMO.PARENT : `parent${i + 1}@tsa.demo`,
          role: Role.PARENT,
        },
      }),
    ),
  );

  const link = (parentUserId: string, studentId: string) =>
    db.parentStudent.create({ data: { parentUserId, studentId } });

  // demo parent (parents[0]) is linked to demo student (Marcus, index 0) AND to a
  // sibling (Lucas Kim, index 8) -> two kids sharing a parent.
  await link(parents[0]!.id, studentRecords[0]!.studentId);
  await link(parents[0]!.id, studentRecords[8]!.studentId);
  // Marcus also has a second parent (parents[1]) -> a kid with two parents.
  await link(parents[1]!.id, studentRecords[0]!.studentId);
  // Lucas's second parent is shared via parents[1] too (sibling pair shares both).
  await link(parents[1]!.id, studentRecords[8]!.studentId);
  // remaining students each get one of parents[2..7]
  let p = 2;
  for (let i = 1; i < studentRecords.length; i++) {
    if (i === 8) continue; // Lucas already linked
    await link(parents[p]!.id, studentRecords[i]!.studentId);
    p = p + 1 >= parents.length ? 2 : p + 1;
  }

  // ---- study plans + tasks, training sessions ----
  let planCount = 0;
  let taskCount = 0;
  let sessionCount = 0;

  for (const { spec, studentId } of studentRecords) {
    const gradeSubjects = SUBJECT_NAMES;

    // daily completion record for cross-domain alignment with sessions
    const completionByOffset = new Map<number, number>();

    for (const offset of SEED_DAYS) {
      const date = dayOffset(offset);
      // plan size + minutes
      const taskN = randInt(3, 6);
      const chosen = [...gradeSubjects].sort(() => rand() - 0.5).slice(0, taskN);
      const total = randInt(105, 120);
      const per = Math.floor(total / taskN);
      const minutes = chosen.map((_, i) =>
        i === taskN - 1 ? total - per * (taskN - 1) : per,
      );

      // completion fraction for the day
      const frac = Math.max(0.2, Math.min(1, jitter(spec.completionBase, 0.12)));
      const completedN = Math.round(frac * taskN);
      completionByOffset.set(offset, completedN / taskN);

      const plan = await db.studyPlan.create({
        data: {
          studentId,
          date,
          totalMinutes: total,
          aiModel: "seed",
          promptVersion: "seed-v1",
          createdAt: date,
        },
      });
      planCount++;

      for (let i = 0; i < taskN; i++) {
        const name = chosen[i]!;
        const subjectId = subjectByGradeName.get(`${spec.grade}:${name}`)!;
        const completed = i < completedN;
        const planned = minutes[i]!;
        let actual: number | null = null;
        if (completed) {
          if (spec.mathOverachiever && MATH_SUBJECTS.has(name)) {
            actual = Math.round(planned * jitter(1.4, 0.2)); // routinely over
          } else {
            actual = Math.round(planned * jitter(1.0, 0.18));
          }
        }
        await db.studyTask.create({
          data: {
            planId: plan.id,
            subjectId,
            title: `${name} — ${pick(["practice set", "reading", "review", "problem set", "quiz prep"])}`,
            plannedMinutes: planned,
            actualMinutes: actual,
            completed,
            completedAt: completed ? date : null,
            reason: `Targeted ${name} based on recent pace.`,
            sortOrder: i,
          },
        });
        taskCount++;
      }
    }

    // ---- training sessions (3–4/week) ----
    const coachId = coachBySpec.get(spec.spec)!;
    const drills = DRILLS[spec.spec];
    const primary = drills[0]!; // the trend drill (40-yard dash for sprinters)
    const weekdays = SEED_DAYS.filter((o) => isWeekday(dayOffset(o)));
    // ~3–4 sessions/week -> sample roughly every other weekday
    const sessionOffsets = weekdays.filter((_, idx) => idx % 2 === 0);

    sessionOffsets.forEach((offset, idx) => {
      // progression: index 0 oldest. value moves "better" over time.
      const progress = idx / Math.max(1, sessionOffsets.length - 1); // 0..1
      let value: number;

      if (primary.metricType === MetricType.TIME) {
        // improving = decreasing time
        let v = primary.base - progress * 0.3; // up to 0.3s/units faster
        if (spec.plateau) v = primary.base - 0.2 + jitter(0, 0.02); // stuck ~3 weeks
        if (spec.pr && idx === sessionOffsets.length - 1) v -= 0.18; // PR last week
        // cross-domain: slower on low-completion days
        const comp = completionByOffset.get(offset) ?? 1;
        if (comp < 0.6) v += 0.12;
        value = round(jitter(v, 0.03), 2);
      } else {
        // weight / distance: increasing
        let v = primary.base + progress * (primary.base * 0.15);
        if (spec.pr && idx === sessionOffsets.length - 1) v += primary.base * 0.08;
        // primary drill for non-TIME specs is always a WEIGHT metric -> whole numbers
        value = round(jitter(v, primary.base * 0.02), 0);
      }

      const noteOptions = [
        "good knee drive",
        "slight knee drop on start",
        "strong finish",
        "tired late in set",
        "clean form",
        "needs hip extension",
      ];
      const note = pick(noteOptions);
      const withRaw = idx % 2 === 0; // ~half preserve coach's original text
      const rawInput = withRaw
        ? `${spec.name.split(" ")[0]!.toLowerCase()} ${primary.drill.toLowerCase()} ${value}${primary.unit}, ${note}`
        : null;

      // store synchronously-ish; collected below
      pendingSessions.push({
        coachId,
        studentId,
        date: dayOffset(offset),
        drill: primary.drill,
        metricType: primary.metricType,
        value,
        unit: primary.unit,
        notes: note,
        rawInput,
        createdAt: dayOffset(offset),
      });
    });
  }

  // batch insert sessions
  for (const s of pendingSessions) {
    await db.trainingSession.create({ data: s });
    sessionCount++;
  }

  // ---- a few historical insights + digests ----
  const marcus = studentRecords[0]!.studentId;
  const jordan = studentRecords[1]!.studentId; // plateaued
  const noah = studentRecords[4]!.studentId; // declining sprinter
  await db.insight.createMany({
    data: [
      {
        studentId: jordan,
        type: InsightType.PLATEAU,
        content: "Jordan's 40-yard dash has held flat for three weeks — time to vary the stimulus.",
        createdAt: dayOffset(2),
      },
      {
        studentId: marcus,
        type: InsightType.IMPROVEMENT,
        content: "Marcus set a personal best in the 40-yard dash this week. Momentum is real.",
        createdAt: dayOffset(1),
      },
      {
        studentId: noah,
        type: InsightType.CROSS_DOMAIN,
        content: "Noah's sprint times dip on days his study completion is under 60%.",
        createdAt: dayOffset(3),
      },
    ],
  });

  await db.digest.createMany({
    data: [
      {
        studentId: marcus,
        date: dayOffset(1),
        content:
          "<p>Marcus finished 86% of his plan today and shaved his 40 time to 4.92s. He mentioned the start felt smoother.</p>",
        emailedAt: dayOffset(1),
        openedAt: dayOffset(1),
      },
      {
        studentId: noah,
        date: dayOffset(1),
        content:
          "<p>Noah completed about half of today's plan. Coach Reyes noted he looked a step slow off the line — a good night's sleep should help.</p>",
        emailedAt: dayOffset(1),
      },
    ],
  });

  console.log(
    `Seed complete: org=1, students=${studentRecords.length}, coaches=${COACHES.length}, ` +
      `plans=${planCount}, tasks=${taskCount}, sessions=${sessionCount}`,
  );
}

const pendingSessions: Array<{
  coachId: string;
  studentId: string;
  date: Date;
  drill: string;
  metricType: MetricType;
  value: number;
  unit: string;
  notes: string;
  rawInput: string | null;
  createdAt: Date;
}> = [];

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
