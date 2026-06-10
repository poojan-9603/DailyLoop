import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Arriving in {phase}.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This area is scaffolded but not yet built. The foundation (auth, data, shell) is in place.
        </CardContent>
      </Card>
    </div>
  );
}
