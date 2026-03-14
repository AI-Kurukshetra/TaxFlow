import {
  type ResolvedTaxComponent,
  type TaxBreakdownItem,
  type TaxEngineResult,
  type TaxType,
} from "@/lib/tax/types";
import { roundCurrency, roundRate, sum } from "@/lib/tax/utils";

function buildBreakdown(
  taxableAmount: number,
  rates: ResolvedTaxComponent[],
): TaxBreakdownItem[] {
  return rates.map((component) => ({
    name: component.name,
    rate: roundRate(component.rate),
    taxAmount: roundCurrency(taxableAmount * component.rate),
    jurisdiction: {
      countryCode: component.countryCode,
      regionCode: component.regionCode,
      city: component.city,
    },
  }));
}

export function calculateExclusiveTax(params: {
  taxType: TaxType;
  amount: number;
  rates: ResolvedTaxComponent[];
  appliedRuleIds: string[];
  exemptionReason?: string;
}): TaxEngineResult {
  const totalRate = roundRate(sum(params.rates.map((rate) => rate.rate)));
  const taxBreakdown = buildBreakdown(params.amount, params.rates);
  const taxAmount = roundCurrency(sum(taxBreakdown.map((item) => item.taxAmount)));

  return {
    taxType: params.taxType,
    taxableAmount: roundCurrency(params.amount),
    taxAmount,
    taxRate: totalRate,
    taxBreakdown,
    appliedRuleIds: params.appliedRuleIds,
    exemptionReason: params.exemptionReason,
  };
}

export function calculateInclusiveTax(params: {
  taxType: TaxType;
  amount: number;
  rates: ResolvedTaxComponent[];
  appliedRuleIds: string[];
  exemptionReason?: string;
}): TaxEngineResult {
  const totalRate = roundRate(sum(params.rates.map((rate) => rate.rate)));
  const divisor = 1 + totalRate;
  const taxableAmount = divisor === 0 ? params.amount : roundCurrency(params.amount / divisor);
  const taxBreakdown = buildBreakdown(taxableAmount, params.rates);
  const taxAmount = roundCurrency(sum(taxBreakdown.map((item) => item.taxAmount)));

  return {
    taxType: params.taxType,
    taxableAmount,
    taxAmount,
    taxRate: totalRate,
    taxBreakdown,
    appliedRuleIds: params.appliedRuleIds,
    exemptionReason: params.exemptionReason,
  };
}
