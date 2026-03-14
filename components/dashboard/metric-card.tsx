type MetricCardProps = {
  title: string;
  value: string;
  change: string;
  tone?: "accent" | "danger" | "warning" | "neutral";
};

const toneClassMap: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  accent: "border-cyan-400/20 bg-cyan-400/10",
  danger: "border-rose-400/20 bg-rose-400/10",
  warning: "border-amber-400/20 bg-amber-400/10",
  neutral: "border-white/10 bg-white/5",
};

export function MetricCard({
  title,
  value,
  change,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <article className={`rounded-[24px] border p-5 ${toneClassMap[tone]}`}>
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm text-slate-400">{change}</p>
    </article>
  );
}
