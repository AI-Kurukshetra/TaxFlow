"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { importTransaction, type ImportTransactionState } from "@/app/(dashboard)/transactions/actions";

type SelectOption = {
  value: string;
  label: string;
};

type ImportTransactionFormProps = {
  customers: SelectOption[];
  products: SelectOption[];
  jurisdictions: SelectOption[];
  currency: string;
};

const INITIAL_STATE: ImportTransactionState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Importing..." : "Import Transaction"}
    </button>
  );
}

export function ImportTransactionForm({ customers, products, jurisdictions, currency }: ImportTransactionFormProps) {
  const [state, formAction] = useActionState(importTransaction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="transaction-number">
            Transaction Number
          </label>
          <input
            required
            id="transaction-number"
            name="transactionNumber"
            type="text"
            placeholder="TXN-2026-0101"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="external-transaction-id">
            External ID
          </label>
          <input
            id="external-transaction-id"
            name="externalTransactionId"
            type="text"
            placeholder="ERP-900001"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="transaction-date">
            Transaction Date
          </label>
          <input
            required
            id="transaction-date"
            name="transactionDate"
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="customer-id">
            Customer
          </label>
          <select
            required
            id="customer-id"
            name="customerId"
            defaultValue=""
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          >
            <option value="" disabled>
              Select customer
            </option>
            {customers.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="product-id">
            Product
          </label>
          <select
            required
            id="product-id"
            name="productId"
            defaultValue=""
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          >
            <option value="" disabled>
              Select product
            </option>
            {products.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="jurisdiction-id">
            Jurisdiction
          </label>
          <select
            required
            id="jurisdiction-id"
            name="jurisdictionId"
            defaultValue=""
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          >
            <option value="" disabled>
              Select jurisdiction
            </option>
            {jurisdictions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="quantity">
            Quantity
          </label>
          <input
            required
            id="quantity"
            name="quantity"
            type="number"
            min="0.0001"
            step="0.0001"
            defaultValue="1"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="subtotal-amount">
            Subtotal ({currency})
          </label>
          <input
            required
            id="subtotal-amount"
            name="subtotalAmount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="taxable-amount">
            Taxable ({currency})
          </label>
          <input
            id="taxable-amount"
            name="taxableAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Defaults to subtotal"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="tax-amount">
            Tax ({currency})
          </label>
          <input
            id="tax-amount"
            name="taxAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200" htmlFor="source">
            Source
          </label>
          <input
            id="source"
            name="source"
            type="text"
            defaultValue="manual"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>

        <SubmitButton />
      </div>

      {state.error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
