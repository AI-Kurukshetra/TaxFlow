import {
  type ResolvedTaxComponent,
  type TaxComputationContext,
  type TaxRule,
} from "@/lib/tax/types";
import { roundRate } from "@/lib/tax/utils";

function matchesRule(rule: TaxRule, context: TaxComputationContext) {
  const { product, customerLocation, transactionAmount } = context.input;
  const { condition } = rule;

  if (
    condition.productCategories?.length &&
    (!product.category || !condition.productCategories.includes(product.category))
  ) {
    return false;
  }

  if (
    condition.productTaxCodes?.length &&
    (!product.taxCode || !condition.productTaxCodes.includes(product.taxCode))
  ) {
    return false;
  }

  if (
    condition.customerCountries?.length &&
    !condition.customerCountries.includes(customerLocation.countryCode)
  ) {
    return false;
  }

  if (
    condition.customerRegions?.length &&
    (!customerLocation.regionCode || !condition.customerRegions.includes(customerLocation.regionCode))
  ) {
    return false;
  }

  if (
    typeof condition.customerIsExempt === "boolean" &&
    condition.customerIsExempt !== Boolean(customerLocation.isExempt)
  ) {
    return false;
  }

  if (typeof condition.minAmount === "number" && transactionAmount < condition.minAmount) {
    return false;
  }

  if (typeof condition.maxAmount === "number" && transactionAmount > condition.maxAmount) {
    return false;
  }

  return true;
}

function overrideRates(name: string, rate: number, existing: ResolvedTaxComponent[]) {
  const base = existing[0];

  return [
    {
      id: `${base?.id ?? "override"}:override`,
      name,
      rate: roundRate(rate),
      countryCode: base?.countryCode ?? "",
      regionCode: base?.regionCode,
      city: base?.city,
    },
  ];
}

export function applyRules(context: TaxComputationContext, rules: TaxRule[] = []) {
  return rules
    .slice()
    .sort((left, right) => left.priority - right.priority)
    .reduce<TaxComputationContext>((currentContext, rule) => {
      if (!matchesRule(rule, currentContext)) {
        return currentContext;
      }

      const nextContext: TaxComputationContext = {
        ...currentContext,
        resolvedRates: [...currentContext.resolvedRates],
        appliedRuleIds: [...currentContext.appliedRuleIds, rule.id],
      };

      const effect = rule.effect;

      switch (effect.type) {
        case "exempt": {
          nextContext.resolvedRates = [];
          nextContext.exemptionReason = effect.reason;
          return nextContext;
        }
        case "override_rate": {
          nextContext.resolvedRates = overrideRates(
            effect.name ?? rule.name,
            effect.rate,
            currentContext.resolvedRates,
          );
          return nextContext;
        }
        case "add_rate": {
          const base = currentContext.resolvedRates[0];
          nextContext.resolvedRates.push({
            id: `${rule.id}:rate`,
            name: effect.name,
            rate: roundRate(effect.rate),
            countryCode: base?.countryCode ?? currentContext.input.customerLocation.countryCode,
            regionCode: base?.regionCode ?? currentContext.input.customerLocation.regionCode,
            city: base?.city ?? currentContext.input.customerLocation.city,
          });
          return nextContext;
        }
        case "reduce_rate": {
          nextContext.resolvedRates = currentContext.resolvedRates.map((component) => ({
            ...component,
            rate: roundRate(Math.max(component.rate - effect.rate, 0)),
          }));
          return nextContext;
        }
      }
    }, context);
}
