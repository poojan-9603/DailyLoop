import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Phase 1 placeholder for a role's "Today" surface. Renders the session user's
 * name and previews what the real feature (built in a later phase) will do.
 */
export function RolePlaceholder({
  name,
  title,
  preview,
}: {
  name: string;
  title: string;
  preview: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground">{greeting()},</p>
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Coming together across the build phases.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {preview.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-accent">•</span>
                {p}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
