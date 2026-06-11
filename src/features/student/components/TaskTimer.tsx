"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskTimerProps {
  initialSeconds?: number;
  onStop?: (totalSeconds: number) => void;
  disabled?: boolean;
}

export function TaskTimer({ initialSeconds = 0, onStop, disabled }: TaskTimerProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function toggle() {
    if (running) {
      setRunning(false);
      onStop?.(elapsed);
    } else {
      setRunning(true);
    }
  }

  const mins = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-sm tabular-nums text-muted-foreground">
        {mins}:{secs}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={toggle}
        disabled={disabled}
        aria-label={running ? "Stop timer" : "Start timer"}
      >
        {running ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
      </Button>
    </div>
  );
}
