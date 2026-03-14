import "server-only";

import { requireOrganizationAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

type SelectOption = {
  value: string;
  label: string;
};

type TransactionImportData = {
  customers: SelectOption[];
  products: SelectOption[];
  jurisdictions: SelectOption[];
  currency: string;
};

export async function getTransactionImportData(): Promise<TransactionImportData> {
  const { organizationId } = await requireOrganizationAccess();
  const supabase = await createClient();

  const [organizationResult, customersResult, productsResult, jurisdictionsResult] = await Promise.all([
    supabase.from("organizations").select("base_currency").eq("id", organizationId).maybeSingle(),
    supabase
      .from("customers")
      .select("id, name, external_customer_id")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, sku")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("tax_jurisdictions")
      .select("id, name")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  if (organizationResult.error) {
    throw new Error(`Unable to load organization currency: ${organizationResult.error.message}`);
  }

  if (customersResult.error) {
    throw new Error(`Unable to load customers: ${customersResult.error.message}`);
  }

  if (productsResult.error) {
    throw new Error(`Unable to load products: ${productsResult.error.message}`);
  }

  if (jurisdictionsResult.error) {
    throw new Error(`Unable to load jurisdictions: ${jurisdictionsResult.error.message}`);
  }

  return {
    currency: organizationResult.data?.base_currency ?? "USD",
    customers: (customersResult.data ?? []).map((item) => ({
      value: item.id,
      label: item.external_customer_id ? `${item.name} (${item.external_customer_id})` : item.name,
    })),
    products: (productsResult.data ?? []).map((item) => ({
      value: item.id,
      label: `${item.name} (${item.sku})`,
    })),
    jurisdictions: (jurisdictionsResult.data ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  };
}
