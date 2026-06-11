export default function StudentLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <div className="h-8 w-48 rounded bg-secondary/40 animate-pulse" />
      <div className="h-32 rounded-xl bg-secondary/40 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-secondary/40 animate-pulse" />
      ))}
    </div>
  );
}
