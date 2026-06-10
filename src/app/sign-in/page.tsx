import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { signIn } from "@/server/auth";

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const callbackUrl = searchParams.callbackUrl ?? "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            T
          </div>
          <CardTitle className="text-2xl">Welcome to TSA OS</CardTitle>
          <CardDescription>The operating system for the student-athlete&apos;s day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchParams.error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Sign-in failed. Please try again or contact your admin.
            </p>
          ) : null}

          {googleConfigured ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: callbackUrl });
              }}
            >
              <Button type="submit" className="w-full" size="lg">
                Continue with Google
              </Button>
            </form>
          ) : (
            <p className="rounded-md border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
              Google sign-in isn&apos;t configured yet. Set <code>GOOGLE_CLIENT_ID</code> and{" "}
              <code>GOOGLE_CLIENT_SECRET</code> to enable it — or explore the product right now in
              demo mode.
            </p>
          )}

          <div className="relative py-1 text-center">
            <span className="bg-card px-2 text-xs uppercase tracking-wide text-muted-foreground">
              or
            </span>
          </div>

          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/demo">Try the demo (no account needed)</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
