import { DataTable } from "@/components/dashboard/data-table";
import { ImportTransactionForm } from "@/components/dashboard/import-transaction-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { requireOrganizationAccess } from "@/lib/auth/guards";
import { getTransactionImportData } from "@/lib/dashboard/transaction-import";
import { getTransactionsPageData } from "@/lib/dashboard/live-data";

export default async function TransactionsPage() {
  const [transactionsData, importData, access] = await Promise.all([
    getTransactionsPageData(),
    getTransactionImportData(),
    requireOrganizationAccess(),
  ]);

  const canImport = access.role === "admin" || access.role === "tax_manager" || access.role === "accountant";
  const hasImportData =
    importData.customers.length > 0 && importData.products.length > 0 && importData.jurisdictions.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Review taxable events, monitor calculation status, and hand off exceptions for analyst or AI-assisted review."
      />

      <SectionCard
        title="Import transaction"
        subtitle="Create a transaction record directly in the active organization workspace."
      >
        {canImport ? (
          hasImportData ? (
            <ImportTransactionForm
              customers={importData.customers}
              products={importData.products}
              jurisdictions={importData.jurisdictions}
              currency={importData.currency}
            />
          ) : (
            <p className="text-sm text-slate-400">
              Add at least one customer, product, and active jurisdiction before importing transactions.
            </p>
          )
        ) : (
          <p className="text-sm text-slate-400">Your role can review transactions but cannot import new ones.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Transaction queue"
        subtitle="Transaction amounts and tax values are scoped by organization and protected by row-level security."
      >
        {transactionsData.transactions.length > 0 ? (
          <DataTable
            columns={["id", "customer", "jurisdiction", "amount", "tax", "status"]}
            rows={transactionsData.transactions}
          />
        ) : (
          <p className="text-sm text-slate-400">No transactions have been imported for the active organization yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
