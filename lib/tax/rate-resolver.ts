import {
  type CustomerLocation,
  type JurisdictionRate,
  type ProductInput,
  type ResolvedTaxComponent,
} from "@/lib/tax/types";

function matchesProduct(rate: JurisdictionRate, product: ProductInput) {
  const matchesCategory =
    !rate.appliesToProductCategories?.length ||
    (product.category ? rate.appliesToProductCategories.includes(product.category) : false);

  const matchesTaxCode =
    !rate.appliesToTaxCodes?.length ||
    (product.taxCode ? rate.appliesToTaxCodes.includes(product.taxCode) : false);

  return matchesCategory && matchesTaxCode;
}

function matchesLocation(rate: JurisdictionRate, customerLocation: CustomerLocation) {
  if (rate.countryCode !== customerLocation.countryCode) {
    return false;
  }

  if (rate.regionCode && rate.regionCode !== customerLocation.regionCode) {
    return false;
  }

  if (rate.city && rate.city !== customerLocation.city) {
    return false;
  }

  return true;
}

function matchesDate(rate: JurisdictionRate, transactionDate?: string) {
  if (!transactionDate) {
    return true;
  }

  if (rate.startsAt && transactionDate < rate.startsAt) {
    return false;
  }

  if (rate.endsAt && transactionDate > rate.endsAt) {
    return false;
  }

  return true;
}

function getSpecificityScore(rate: JurisdictionRate) {
  let score = rate.priority ?? 0;

  if (rate.countryCode) {
    score += 1;
  }

  if (rate.regionCode) {
    score += 10;
  }

  if (rate.city) {
    score += 100;
  }

  return score;
}

export function resolveRates(params: {
  rates: JurisdictionRate[];
  product: ProductInput;
  customerLocation: CustomerLocation;
  transactionDate?: string;
}): ResolvedTaxComponent[] {
  const matches = params.rates
    .filter((rate) => matchesProduct(rate, params.product))
    .filter((rate) => matchesLocation(rate, params.customerLocation))
    .filter((rate) => matchesDate(rate, params.transactionDate))
    .sort((left, right) => getSpecificityScore(right) - getSpecificityScore(left));

  const seen = new Set<string>();

  return matches.filter((rate) => {
    const key = [rate.name, rate.countryCode, rate.regionCode ?? "", rate.city ?? ""].join(":");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  }).map((rate) => ({
    id: rate.id,
    name: rate.name,
    rate: rate.rate,
    countryCode: rate.countryCode,
    regionCode: rate.regionCode,
    city: rate.city,
  }));
}
