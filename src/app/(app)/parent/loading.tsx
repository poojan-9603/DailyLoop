export default function ParentLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-4 pb-20 md:pb-6">
      <div className="h-8 w-48 rounded bg-secondary/40 animate-pulse" />
      <div className="h-28 rounded-xl bg-secondary/40 animate-pulse" />
      {[1, 2].map((i) => (
        <div key={i} className="h-14 rounded-xl bg-secondary/40 animate-pulse" />
      ))}
    </div>
  );
}
