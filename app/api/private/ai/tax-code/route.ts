import { NextResponse } from "next/server";
import { z } from "zod";

import { taxAiService } from "@/lib/ai";
import { ApiAuthError, requireApiRole } from "@/lib/auth/api";

const requestSchema = z.object({
  product: z.object({
    sku: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    attributes: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireApiRole("accountant");
    const payload = requestSchema.parse(await request.json());

    const prediction = await taxAiService.predictTaxCode({
      organizationId,
      product: payload.product,
    });

    return NextResponse.json({ organizationId, prediction });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to predict tax code" }, { status: 500 });
  }
}
