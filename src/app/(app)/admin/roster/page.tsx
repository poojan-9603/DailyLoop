"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { RosterTable } from "@/features/admin/components/RosterTable";
import { StudentDetailSheet } from "@/features/admin/components/StudentDetailSheet";

function RosterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("student");

  function handleSelect(id: string) {
    const params = new URLSearchParams(searchParams);
    params.set("student", id);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleClose() {
    const params = new URLSearchParams(searchParams);
    params.delete("student");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <RosterTable onSelect={handleSelect} />
      <StudentDetailSheet studentId={selectedId} onClose={handleClose} />
    </>
  );
}

export default function AdminRosterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Roster</h1>
      <Suspense fallback={<div className="h-32 rounded-xl bg-secondary/40 animate-pulse" />}>
        <RosterContent />
      </Suspense>
    </div>
  );
}
