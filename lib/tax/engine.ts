import { applyExemptions } from "@/lib/tax/exemptions";
import { resolveRates } from "@/lib/tax/rate-resolver";
import { applyRules } from "@/lib/tax/rule-resolver";
import { calculateGst } from "@/lib/tax/calculators/gst";
import { calculateSalesTax } from "@/lib/tax/calculators/sales-tax";
import { calculateVat } from "@/lib/tax/calculators/vat";
import { type TaxComputationContext, type TaxEngineInput } from "@/lib/tax/types";

function buildContext(input: TaxEngineInput): TaxComputationContext {
  return {
    input,
    resolvedRates: resolveRates({
      rates: input.jurisdiction.rates,
      product: input.product,
      customerLocation: input.customerLocation,
      transactionDate: input.transactionDate,
    }),
    appliedRuleIds: [],
    exemptionReason: undefined,
    effectivePriceIncludesTax:
      input.product.priceIncludesTax ?? input.jurisdiction.pricesIncludeTax ?? false,
  };
}

export function calculateTax(input: TaxEngineInput) {
  const baseContext = buildContext(input);
  const withRules = applyRules(baseContext, input.jurisdiction.rules);
  const finalContext = applyExemptions(withRules, input.jurisdiction.exemptions);

  switch (input.jurisdiction.taxType) {
    case "vat":
      return calculateVat(finalContext);
    case "gst":
      return calculateGst(finalContext);
    case "sales_tax":
      return calculateSalesTax(finalContext);
    default:
      return calculateSalesTax(finalContext);
  }
}
