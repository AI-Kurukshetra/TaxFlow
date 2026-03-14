"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { login, type LoginState } from "@/app/(auth)/login/actions";

const INITIAL_STATE: LoginState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

type LoginFormProps = {
  redirectTo: string;
  initialError?: string;
};

export function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const [state, formAction] = useActionState(login, {
    ...INITIAL_STATE,
    error: initialError ?? null,
  });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="email">
          Email
        </label>
        <input
          required
          autoComplete="email"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400"
          id="email"
          name="email"
          placeholder="finance@acme.com"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-slate-200"
          htmlFor="password"
        >
          Password
        </label>
        <input
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-400"
          id="password"
          name="password"
          placeholder="********"
          type="password"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
