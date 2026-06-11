import { SmartLogInput } from "@/features/coach/components/SmartLogInput";
import { AthleteListWrapper } from "@/features/coach/components/AthleteListWrapper";
import { getSessionUser } from "@/server/auth/session";
import { format } from "date-fns";

export default async function CoachTodayPage() {
  const user = await getSessionUser();
  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6 pb-20 md:pb-6">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-2xl font-bold mt-0.5">
          Good {getGreeting()}, {user?.name?.split(" ")[0] ?? "Coach"}
        </h1>
      </div>

      <SmartLogInput />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Your Athletes Today
        </h2>
        <AthleteListWrapper />
      </section>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
