"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import type { SmartLogOutput } from "@/ai/schemas";
import { trackEvent } from "@/lib/posthog";

const METRIC_LABELS = { TIME: "Time", REPS: "Reps", WEIGHT: "Weight", DISTANCE: "Distance" };

interface Props {
  onSaved?: () => void;
}

export function SmartLogInput({ onSaved }: Props) {
  const { toast } = useToast();
  const [rawInput, setRawInput] = useState("");
  const [parsed, setParsed] = useState<SmartLogOutput | null>(null);
  const [parsing, setParsing] = useState(false);
  const [editedValue, setEditedValue] = useState("");
  const [editedNotes, setEditedNotes] = useState("");

  const saveMutation = api.coach.saveSession.useMutation({
    onSuccess: () => {
      toast({ title: "Session saved" });
      setParsed(null);
      setRawInput("");
      onSaved?.();
      trackEvent("session_logged");
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  async function handleParse() {
    if (!rawInput.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/ai/smart-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as SmartLogOutput;
      setParsed(data);
      setEditedValue(String(data.value));
      setEditedNotes(data.notes ?? "");
      trackEvent("smart_log_used");
    } catch (err) {
      toast({ title: "Parse failed", description: String(err), variant: "destructive" });
    } finally {
      setParsing(false);
    }
  }

  function handleConfirm() {
    if (!parsed) return;
    saveMutation.mutate({
      studentId: parsed.matchedStudentId ?? "",
      drill: parsed.drill,
      metricType: parsed.metricType,
      value: parseFloat(editedValue) || parsed.value,
      unit: parsed.unit,
      notes: editedNotes || undefined,
      rawInput,
    });
  }

  if (parsed) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Confirm Session</p>
          <Badge variant={parsed.confidence === "high" ? "default" : parsed.confidence === "medium" ? "secondary" : "outline"}>
            {parsed.confidence} confidence
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Athlete</span>
            <p className="font-medium">{parsed.studentName}</p>
            {parsed.confidence === "low" && (
              <p className="text-xs text-destructive">Low confidence — verify manually</p>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Drill</span>
            <p className="font-medium">{parsed.drill}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Type</span>
            <p className="font-medium">{METRIC_LABELS[parsed.metricType]}</p>
          </div>
          <div>
            <Label className="text-muted-foreground" htmlFor="smart-log-value">Value ({parsed.unit})</Label>
            <Input
              id="smart-log-value"
              type="number"
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              className="mt-1 h-8 text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="smart-log-notes" className="text-muted-foreground text-sm">Notes</Label>
          <Input
            id="smart-log-notes"
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Optional coaching notes"
            className="mt-1"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleConfirm}
            disabled={!parsed.matchedStudentId || saveMutation.isPending}
            className="flex-1 min-h-[44px]"
            aria-label="Save training session"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Session"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setParsed(null)}
            className="min-h-[44px]"
            aria-label="Edit log entry"
          >
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold">Smart Log</p>
      </div>
      <Textarea
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
        placeholder="e.g. marcus 40yd 4.92, slight knee drop on start"
        rows={3}
        className="resize-none"
        aria-label="Training log entry"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.metaKey) handleParse();
        }}
      />
      <Button
        onClick={handleParse}
        disabled={!rawInput.trim() || parsing}
        className="w-full min-h-[44px]"
        aria-label="Parse log with AI"
      >
        {parsing ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Parsing…</>
        ) : (
          <><Wand2 className="h-4 w-4 mr-2" /> Parse with AI</>
        )}
      </Button>
    </div>
  );
}
