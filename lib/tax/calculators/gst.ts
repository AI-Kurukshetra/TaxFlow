import { calculateExclusiveTax, calculateInclusiveTax } from "@/lib/tax/calculators/shared";
import { type TaxComputationContext } from "@/lib/tax/types";

export function calculateGst(context: TaxComputationContext) {
  if (context.effectivePriceIncludesTax) {
    return calculateInclusiveTax({
      taxType: "gst",
      amount: context.input.transactionAmount,
      rates: context.resolvedRates,
      appliedRuleIds: context.appliedRuleIds,
      exemptionReason: context.exemptionReason,
    });
  }

  return calculateExclusiveTax({
    taxType: "gst",
    amount: context.input.transactionAmount,
    rates: context.resolvedRates,
    appliedRuleIds: context.appliedRuleIds,
    exemptionReason: context.exemptionReason,
  });
}
