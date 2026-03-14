import { NextResponse } from "next/server";
import { z } from "zod";

import { taxAiService } from "@/lib/ai";
import { ApiAuthError, requireApiRole } from "@/lib/auth/api";

const transactionSchema = z.object({
  id: z.string(),
  transactionDate: z.string(),
  jurisdiction: z.string(),
  amount: z.number(),
  taxAmount: z.number(),
  taxCode: z.string().optional(),
  status: z.string().optional(),
});

const requestSchema = z.object({
  transactions: z.array(transactionSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireApiRole("tax_manager");
    const payload = requestSchema.parse(await request.json());

    const risks = await taxAiService.detectComplianceRisks({
      organizationId,
      transactions: payload.transactions,
    });

    return NextResponse.json({ organizationId, risks });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to detect compliance risks" }, { status: 500 });
  }
}
