import { SmartLogInput } from "@/features/coach/components/SmartLogInput";
import { AthleteListWrapper } from "@/features/coach/components/AthleteListWrapper";
import { getSessionUser } from "@/server/auth/session";
import { format } from "date-fns";

export default async function CoachTodayPage() {
  const user = await getSessionUser();
  return (
    <div className="mx-auto flex max-w-xl flex-col px-4 py-6 pb-20 md:pb-6">
      <div className="order-1 mb-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-2xl font-bold mt-0.5">
          Good {getGreeting()}, {user?.name?.split(" ")[0] ?? "Coach"}
        </h1>
      </div>

      {/* On mobile the Smart Log sits last (thumb-reachable, sticky to the
          bottom of the viewport); on desktop it returns just under the header. */}
      <div className="sticky bottom-3 z-10 order-3 mt-6 md:static md:order-2 md:mt-0">
        <SmartLogInput />
      </div>

      <section className="order-2 md:order-3 md:mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
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
