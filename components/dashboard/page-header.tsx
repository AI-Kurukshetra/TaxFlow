type PageHeaderProps = {
  title: string;
  description: string;
  actionLabel?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, actionLabel, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Operations</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {action ? (
        action
      ) : actionLabel ? (
        <button className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20">
          {actionLabel}
        </button>
      ) : null}
    </header>
  );
}
