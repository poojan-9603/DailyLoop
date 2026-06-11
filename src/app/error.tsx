"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
          )}
          <Button onClick={reset}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
