import { NextResponse } from "next/server";
import { z } from "zod";

import { taxAiService } from "@/lib/ai";
import { ApiAuthError, requireApiRole } from "@/lib/auth/api";

const requestSchema = z.object({
  question: z.string().min(1),
  allowedTables: z.array(z.string()).default([
    "transactions",
    "tax_returns",
    "reports",
    "customers",
    "tax_jurisdictions",
  ]),
});

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireApiRole("viewer");
    const payload = requestSchema.parse(await request.json());

    const query = await taxAiService.naturalLanguageToSql({
      organizationId,
      question: payload.question,
      allowedTables: payload.allowedTables,
    });

    return NextResponse.json({ organizationId, query });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to convert question to SQL" }, { status: 500 });
  }
}
