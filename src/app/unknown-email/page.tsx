import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnknownEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">We don&apos;t recognize that account</CardTitle>
          <CardDescription>
            Your Google account isn&apos;t on the TSA OS roster yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ask your admin to add your email, then sign in again. If you just want to look around,
            you can explore the product in demo mode.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/demo">Explore the demo</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/sign-in">Back to sign-in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
