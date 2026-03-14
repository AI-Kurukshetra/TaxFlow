export type TaxType = "vat" | "gst" | "sales_tax";

export type ProductInput = {
  id?: string;
  sku?: string;
  category?: string;
  taxCode?: string;
  isTaxExempt?: boolean;
  priceIncludesTax?: boolean;
};

export type CustomerLocation = {
  countryCode: string;
  regionCode?: string;
  city?: string;
  postalCode?: string;
  isExempt?: boolean;
  exemptionReason?: string;
};

export type JurisdictionRate = {
  id: string;
  name: string;
  taxType: TaxType;
  rate: number;
  countryCode: string;
  regionCode?: string;
  city?: string;
  priority?: number;
  appliesToProductCategories?: string[];
  appliesToTaxCodes?: string[];
  startsAt?: string;
  endsAt?: string;
};

export type TaxRuleCondition = {
  productCategories?: string[];
  productTaxCodes?: string[];
  customerCountries?: string[];
  customerRegions?: string[];
  minAmount?: number;
  maxAmount?: number;
  customerIsExempt?: boolean;
};

export type TaxRuleEffect =
  | {
      type: "exempt";
      reason: string;
    }
  | {
      type: "override_rate";
      rate: number;
      name?: string;
    }
  | {
      type: "add_rate";
      rate: number;
      name: string;
    }
  | {
      type: "reduce_rate";
      rate: number;
    };

export type TaxRule = {
  id: string;
  name: string;
  priority: number;
  condition: TaxRuleCondition;
  effect: TaxRuleEffect;
};

export type TaxExemption = {
  id?: string;
  reason: string;
  rateOverride?: number;
  appliesToProductCategories?: string[];
  appliesToTaxCodes?: string[];
};

export type JurisdictionInput = {
  id: string;
  name: string;
  taxType: TaxType;
  countryCode: string;
  regionCode?: string;
  city?: string;
  pricesIncludeTax?: boolean;
  rates: JurisdictionRate[];
  rules?: TaxRule[];
  exemptions?: TaxExemption[];
};

export type TaxEngineInput = {
  product: ProductInput;
  jurisdiction: JurisdictionInput;
  customerLocation: CustomerLocation;
  transactionAmount: number;
  transactionDate?: string;
};

export type TaxBreakdownItem = {
  name: string;
  rate: number;
  taxAmount: number;
  jurisdiction: {
    countryCode: string;
    regionCode?: string;
    city?: string;
  };
};

export type TaxEngineResult = {
  taxType: TaxType;
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  taxBreakdown: TaxBreakdownItem[];
  appliedRuleIds: string[];
  exemptionReason?: string;
};

export type ResolvedTaxComponent = {
  id: string;
  name: string;
  rate: number;
  countryCode: string;
  regionCode?: string;
  city?: string;
};

export type TaxComputationContext = {
  input: TaxEngineInput;
  resolvedRates: ResolvedTaxComponent[];
  appliedRuleIds: string[];
  exemptionReason?: string;
  effectivePriceIncludesTax: boolean;
};
