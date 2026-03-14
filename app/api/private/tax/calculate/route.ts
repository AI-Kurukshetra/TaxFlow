import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiAuthError, requireApiRole } from "@/lib/auth/api";
import { calculateTax } from "@/lib/tax";

const requestSchema = z.object({
  product: z.object({
    id: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().optional(),
    taxCode: z.string().optional(),
    isTaxExempt: z.boolean().optional(),
    priceIncludesTax: z.boolean().optional(),
  }),
  jurisdiction: z.object({
    id: z.string(),
    name: z.string(),
    taxType: z.enum(["vat", "gst", "sales_tax"]),
    countryCode: z.string(),
    regionCode: z.string().optional(),
    city: z.string().optional(),
    pricesIncludeTax: z.boolean().optional(),
    rates: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        taxType: z.enum(["vat", "gst", "sales_tax"]),
        rate: z.number().nonnegative(),
        countryCode: z.string(),
        regionCode: z.string().optional(),
        city: z.string().optional(),
        priority: z.number().optional(),
        appliesToProductCategories: z.array(z.string()).optional(),
        appliesToTaxCodes: z.array(z.string()).optional(),
        startsAt: z.string().optional(),
        endsAt: z.string().optional(),
      }),
    ),
    rules: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          priority: z.number(),
          condition: z.object({
            productCategories: z.array(z.string()).optional(),
            productTaxCodes: z.array(z.string()).optional(),
            customerCountries: z.array(z.string()).optional(),
            customerRegions: z.array(z.string()).optional(),
            minAmount: z.number().optional(),
            maxAmount: z.number().optional(),
            customerIsExempt: z.boolean().optional(),
          }),
          effect: z.discriminatedUnion("type", [
            z.object({ type: z.literal("exempt"), reason: z.string() }),
            z.object({ type: z.literal("override_rate"), rate: z.number(), name: z.string().optional() }),
            z.object({ type: z.literal("add_rate"), rate: z.number(), name: z.string() }),
            z.object({ type: z.literal("reduce_rate"), rate: z.number() }),
          ]),
        }),
      )
      .optional(),
    exemptions: z
      .array(
        z.object({
          id: z.string().optional(),
          reason: z.string(),
          rateOverride: z.number().optional(),
          appliesToProductCategories: z.array(z.string()).optional(),
          appliesToTaxCodes: z.array(z.string()).optional(),
        }),
      )
      .optional(),
  }),
  customerLocation: z.object({
    countryCode: z.string(),
    regionCode: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    isExempt: z.boolean().optional(),
    exemptionReason: z.string().optional(),
  }),
  transactionAmount: z.number().nonnegative(),
  transactionDate: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireApiRole("accountant");
    const payload = requestSchema.parse(await request.json());

    const result = calculateTax(payload);

    return NextResponse.json({
      organizationId,
      result,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to calculate tax" }, { status: 500 });
  }
}
