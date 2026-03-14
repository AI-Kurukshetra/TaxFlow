type DashboardShellProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  profile: {
    name: string;
    email: string;
    role: string;
  };
};

function getInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function DashboardShell({ children, sidebar, profile }: DashboardShellProps) {
  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {sidebar}
        <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                {getInitials(profile.name)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{profile.name}</p>
                <p className="mt-1 text-sm text-slate-400">{profile.email}</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                {profile.role}
              </span>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
