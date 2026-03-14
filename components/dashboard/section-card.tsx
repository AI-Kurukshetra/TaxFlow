type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
