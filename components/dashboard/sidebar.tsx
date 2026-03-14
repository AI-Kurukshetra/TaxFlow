"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/tax-reports", label: "Tax Reports" },
  { href: "/compliance", label: "Compliance Dashboard" },
  { href: "/integrations", label: "Integrations" },
  { href: "/settings", label: "Settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-5 backdrop-blur">
      <div className="absolute inset-x-6 top-0 h-24 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">TaxFlow Pro</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Control tower for tax operations</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Filing, compliance, and audit readiness in one workspace.
          </p>
        </div>

        <nav className="mt-8 space-y-2">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? "bg-white text-slate-950 shadow-lg shadow-cyan-400/10"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-cyan-500" : "bg-slate-700"}`} />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
