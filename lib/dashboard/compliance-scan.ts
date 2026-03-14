import "server-only";

import { requireOrganizationAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export type ComplianceScanTransaction = {
  id: string;
  transactionDate: string;
  jurisdiction: string;
  amount: number;
  taxAmount: number;
  taxCode?: string;
  status?: string;
};

export async function getComplianceScanTransactions(): Promise<ComplianceScanTransaction[]> {
  const { organizationId } = await requireOrganizationAccess();
  const supabase = await createClient();

  const result = await supabase
    .from("transactions")
    .select("transaction_number, transaction_date, subtotal_amount, tax_amount, classification_code, status, jurisdiction:tax_jurisdictions(name)")
    .eq("organization_id", organizationId)
    .order("transaction_date", { ascending: false })
    .limit(20);

  if (result.error) {
    throw new Error(`Unable to load transactions for compliance scan: ${result.error.message}`);
  }

  return (result.data ?? []).map((item) => {
    const jurisdiction = Array.isArray(item.jurisdiction) ? item.jurisdiction[0] : item.jurisdiction;

    return {
      id: item.transaction_number,
      transactionDate: item.transaction_date,
      jurisdiction: jurisdiction?.name ?? "Unknown jurisdiction",
      amount: Number(item.subtotal_amount ?? 0),
      taxAmount: Number(item.tax_amount ?? 0),
      taxCode: item.classification_code ?? undefined,
      status: item.status ?? undefined,
    };
  });
}
