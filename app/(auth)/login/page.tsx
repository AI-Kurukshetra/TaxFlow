import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams?: Promise<{
    redirectTo?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/50 md:grid-cols-[1.15fr_0.85fr]">
          <section className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(2,6,23,1))] p-12 md:block">
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">
              TaxFlow Pro
            </p>
            <h1 className="mt-8 max-w-md text-4xl font-semibold leading-tight text-white">
              Secure tax operations for multi-entity finance teams.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Sign in with your organization account to review filings, manage
              tax rules, and work inside your tenant boundary enforced by
              Supabase RLS.
            </p>
            <div className="mt-10 grid gap-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Roles: admin, tax manager, accountant, viewer
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Organization isolation enforced in database policies
              </div>
            </div>
          </section>

          <section className="p-8 sm:p-10">
            <div className="mx-auto max-w-md">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300 md:hidden">
                TaxFlow Pro
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Sign in
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Use your email and password to access your organization
                workspace.
              </p>

              <div className="mt-8">
                <LoginForm
                  redirectTo={params.redirectTo ?? "/dashboard"}
                  initialError={params.error}
                />
              </div>

              <p className="mt-6 text-sm text-slate-400">
                Need account access? Contact your organization admin or{" "}
                <Link className="text-cyan-300 hover:text-cyan-200" href="/support">
                  support
                </Link>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
