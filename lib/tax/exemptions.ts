import { type TaxComputationContext, type TaxExemption } from "@/lib/tax/types";
import { roundRate } from "@/lib/tax/utils";

function exemptionMatches(exemption: TaxExemption, context: TaxComputationContext) {
  const { product } = context.input;

  const matchesCategory =
    !exemption.appliesToProductCategories?.length ||
    (product.category ? exemption.appliesToProductCategories.includes(product.category) : false);

  const matchesTaxCode =
    !exemption.appliesToTaxCodes?.length ||
    (product.taxCode ? exemption.appliesToTaxCodes.includes(product.taxCode) : false);

  return matchesCategory && matchesTaxCode;
}

export function applyExemptions(
  context: TaxComputationContext,
  exemptions: TaxExemption[] = [],
) {
  if (context.input.product.isTaxExempt) {
    return {
      ...context,
      resolvedRates: [],
      exemptionReason: context.exemptionReason ?? "Product exemption",
    };
  }

  if (context.input.customerLocation.isExempt) {
    return {
      ...context,
      resolvedRates: [],
      exemptionReason:
        context.exemptionReason ?? context.input.customerLocation.exemptionReason ?? "Customer exemption",
    };
  }

  const matchingExemption = exemptions.find((exemption) => exemptionMatches(exemption, context));

  if (!matchingExemption) {
    return context;
  }

  if (typeof matchingExemption.rateOverride === "number") {
    const base = context.resolvedRates[0];

    return {
      ...context,
      resolvedRates: [
        {
          id: `${matchingExemption.id ?? "exemption"}:override`,
          name: matchingExemption.reason,
          rate: roundRate(matchingExemption.rateOverride),
          countryCode: base?.countryCode ?? context.input.customerLocation.countryCode,
          regionCode: base?.regionCode ?? context.input.customerLocation.regionCode,
          city: base?.city ?? context.input.customerLocation.city,
        },
      ],
      exemptionReason: matchingExemption.reason,
    };
  }

  return {
    ...context,
    resolvedRates: [],
    exemptionReason: matchingExemption.reason,
  };
}
