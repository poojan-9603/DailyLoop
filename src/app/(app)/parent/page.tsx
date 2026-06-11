import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ParentDayView } from "@/features/parent/components/ParentDayView";

export default async function ParentTodayPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT") redirect("/sign-in");

  const links = await db.parentStudent.findMany({
    where: { parentUserId: user.id },
    include: { student: { include: { user: { select: { name: true } } } } },
  });

  const children = links.map((l) => ({
    id: l.student.id,
    name: l.student.user.name ?? "Student",
  }));

  if (children.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Parent View</h1>
        <p className="text-muted-foreground">
          No students are linked to your account yet. Contact your school&apos;s admin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 pb-20 md:pb-6">
      <ParentDayView initialStudentId={children[0]!.id} students={children} />
    </div>
  );
}
