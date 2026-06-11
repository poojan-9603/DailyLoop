"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { api } from "@/trpc/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Props {
  studentId: string | null;
  onClose: () => void;
}

export function StudentDetailSheet({ studentId, onClose }: Props) {
  const { toast } = useToast();
  const open = studentId !== null;

  const rosterQuery = api.admin.roster.useQuery(undefined, { enabled: open });
  const student = rosterQuery.data?.find((s) => s.id === studentId);

  const digestMutation = api.admin.sendDigest.useMutation({
    onSuccess: (result) => {
      if (result.previewHtml) {
        setPreview(result.previewHtml);
        toast({ title: "Preview ready (no Resend key configured)" });
      } else {
        toast({ title: `Digest sent to ${result.emailsSent} parent(s)` });
      }
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const [preview, setPreview] = useState<string | null>(null);

  if (!studentId) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent aria-label={`${student?.name ?? "Student"} detail`}>
        <SheetHeader>
          <SheetTitle>{student?.name ?? "Student"}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {student && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Grade</p>
                  <p className="font-medium">{student.gradeLevel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">7d Completion</p>
                  <p className="font-medium">{student.avgCompletion7d !== null ? `${student.avgCompletion7d}%` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sessions (7d)</p>
                  <p className="font-medium">{student.sessionCount7d}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sports</p>
                  <div className="flex flex-wrap gap-1">
                    {student.sports.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => digestMutation.mutate({ studentId })}
                disabled={digestMutation.isPending}
                className="w-full"
                variant="outline"
              >
                {digestMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" />Send Digest Now</>
                )}
              </Button>

              {preview && (
                <div className="rounded-lg border overflow-hidden">
                  <p className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-2">Email Preview</p>
                  <iframe
                    srcDoc={preview}
                    className="w-full h-64 border-0"
                    title="Digest email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
