import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="max-w-lg rounded-[28px] border border-white/10 bg-slate-950/60 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Access denied</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">You do not have permission for this area</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          This route requires a higher organization role. Contact an admin if this access should be granted.
        </p>
        <Link
          className="mt-6 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
