"use server";

import { revalidatePath } from "next/cache";

import { requireOrganizationRole, requireUser } from "@/lib/auth/guards";

export type ImportTransactionState = {
  error: string | null;
  success: string | null;
};

const INITIAL_STATE: ImportTransactionState = {
  error: null,
  success: null,
};

function parsePositiveNumber(rawValue: string, label: string) {
  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }

  return value;
}

function parseNonNegativeNumber(rawValue: string, label: string) {
  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be 0 or greater.`);
  }

  return value;
}

export async function importTransaction(
  _prevState: ImportTransactionState,
  formData: FormData,
): Promise<ImportTransactionState> {
  try {
    const transactionNumber = String(formData.get("transactionNumber") ?? "").trim();
    const externalTransactionId = String(formData.get("externalTransactionId") ?? "").trim();
    const transactionDate = String(formData.get("transactionDate") ?? "").trim();
    const customerId = String(formData.get("customerId") ?? "").trim();
    const productId = String(formData.get("productId") ?? "").trim();
    const jurisdictionId = String(formData.get("jurisdictionId") ?? "").trim();
    const quantityRaw = String(formData.get("quantity") ?? "").trim();
    const subtotalRaw = String(formData.get("subtotalAmount") ?? "").trim();
    const taxableRaw = String(formData.get("taxableAmount") ?? "").trim();
    const taxRaw = String(formData.get("taxAmount") ?? "").trim();
    const source = String(formData.get("source") ?? "manual").trim();

    if (!transactionNumber || !transactionDate || !customerId || !productId || !jurisdictionId) {
      return {
        ...INITIAL_STATE,
        error: "Transaction number, date, customer, product, and jurisdiction are required.",
      };
    }

    const quantity = parsePositiveNumber(quantityRaw, "Quantity");
    const subtotalAmount = parsePositiveNumber(subtotalRaw, "Subtotal amount");
    const taxableAmount = taxableRaw ? parseNonNegativeNumber(taxableRaw, "Taxable amount") : subtotalAmount;
    const taxAmount = taxRaw ? parseNonNegativeNumber(taxRaw, "Tax amount") : 0;

    if (taxableAmount > subtotalAmount) {
      return {
        ...INITIAL_STATE,
        error: "Taxable amount cannot exceed subtotal amount.",
      };
    }

    const { organizationId, role } = await requireOrganizationRole("accountant");
    const { supabase, user } = await requireUser();

    if (!["admin", "tax_manager", "accountant"].includes(role)) {
      return {
        ...INITIAL_STATE,
        error: "Your role cannot import transactions.",
      };
    }

    const [organizationResult, customerResult, productResult, jurisdictionResult] = await Promise.all([
      supabase.from("organizations").select("base_currency").eq("id", organizationId).maybeSingle(),
      supabase.from("customers").select("id, name").eq("organization_id", organizationId).eq("id", customerId).maybeSingle(),
      supabase
        .from("products")
        .select("id, name, default_tax_code")
        .eq("organization_id", organizationId)
        .eq("id", productId)
        .maybeSingle(),
      supabase
        .from("tax_jurisdictions")
        .select("id, name")
        .eq("organization_id", organizationId)
        .eq("id", jurisdictionId)
        .maybeSingle(),
    ]);

    const firstError = organizationResult.error ?? customerResult.error ?? productResult.error ?? jurisdictionResult.error;
    if (firstError) {
      return {
        ...INITIAL_STATE,
        error: firstError.message,
      };
    }

    if (!customerResult.data || !productResult.data || !jurisdictionResult.data) {
      return {
        ...INITIAL_STATE,
        error: "One or more selected records are no longer available in the active organization.",
      };
    }

    const insertResult = await supabase.from("transactions").insert({
      organization_id: organizationId,
      transaction_number: transactionNumber,
      external_transaction_id: externalTransactionId || null,
      customer_id: customerId,
      product_id: productId,
      jurisdiction_id: jurisdictionId,
      transaction_date: transactionDate,
      status: taxAmount > 0 ? "calculated" : "pending",
      currency: organizationResult.data?.base_currency ?? "USD",
      quantity,
      subtotal_amount: subtotalAmount,
      taxable_amount: taxableAmount,
      tax_amount: taxAmount,
      classification_code: productResult.data.default_tax_code ?? null,
      metadata: {
        source,
        imported_from: "transactions_ui",
      },
      created_by: user.id,
    });

    if (insertResult.error) {
      return {
        ...INITIAL_STATE,
        error: insertResult.error.message,
      };
    }

    revalidatePath("/transactions");

    return {
      error: null,
      success: `${transactionNumber} was imported for ${customerResult.data.name} in ${jurisdictionResult.data.name}.`,
    };
  } catch (error) {
    return {
      ...INITIAL_STATE,
      error: error instanceof Error ? error.message : "Unable to import transaction.",
    };
  }
}
