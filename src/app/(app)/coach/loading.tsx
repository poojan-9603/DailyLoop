export default function CoachLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4 pb-20 md:pb-6">
      <div className="h-8 w-40 rounded bg-secondary/40 animate-pulse" />
      <div className="h-32 rounded-xl bg-secondary/40 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
      ))}
    </div>
  );
}
