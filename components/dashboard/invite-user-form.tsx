"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { inviteUser, type InviteUserState } from "@/app/(dashboard)/settings/actions";

const INITIAL_STATE: InviteUserState = {
  error: null,
  success: null,
  credentials: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Inviting..." : "Invite User"}
    </button>
  );
}

export function InviteUserForm() {
  const [state, formAction] = useActionState(inviteUser, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="invite-email">
            Email
          </label>
          <input
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            id="invite-email"
            name="email"
            placeholder="teammate@company.com"
            type="email"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="invite-name">
            Full Name
          </label>
          <input
            autoComplete="name"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            id="invite-name"
            name="fullName"
            placeholder="Jordan Lee"
            type="text"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="invite-role">
          Organization Role
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="viewer"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        >
          <option value="admin">Admin</option>
          <option value="tax_manager">Tax Manager</option>
          <option value="accountant">Accountant</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      <p className="text-sm leading-6 text-slate-400">
        New users are created with an immediate temporary password. Existing users keep their current password and only
        receive the new organization membership.
      </p>

      {state.error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <p>{state.success}</p>
          {state.credentials ? (
            <div className="space-y-1 text-emerald-50">
              <p>Temporary login email: {state.credentials.email}</p>
              <p>Temporary password: {state.credentials.password}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
