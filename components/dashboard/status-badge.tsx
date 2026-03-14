type StatusBadgeProps = {
  value: string;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const lower = value.toLowerCase();
  const tone = lower.includes("critical") || lower.includes("disconnected")
    ? "bg-rose-400/15 text-rose-200 border-rose-400/20"
    : lower.includes("warning") || lower.includes("review") || lower.includes("draft")
      ? "bg-amber-400/15 text-amber-100 border-amber-400/20"
      : lower.includes("healthy") || lower.includes("ready") || lower.includes("filed") || lower.includes("calculated")
        ? "bg-emerald-400/15 text-emerald-100 border-emerald-400/20"
        : "bg-white/5 text-slate-200 border-white/10";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      {value}
    </span>
  );
}
