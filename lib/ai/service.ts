import "server-only";

import { OPENAI_MODEL, openai } from "@/lib/ai/client";
import { COMPLIANCE_RISK_SYSTEM_PROMPT } from "@/lib/ai/prompts/compliance-risk";
import { NATURAL_LANGUAGE_TAX_QUERY_SYSTEM_PROMPT } from "@/lib/ai/prompts/natural-language-query";
import { TAX_CODE_PREDICTION_SYSTEM_PROMPT } from "@/lib/ai/prompts/tax-code";
import {
  complianceRiskSchema,
  naturalLanguageTaxQuerySchema,
  taxCodePredictionSchema,
  type ComplianceRisk,
  type ComplianceRiskDetectionInput,
  type NaturalLanguageTaxQueryInput,
  type NaturalLanguageTaxQueryResult,
  type TaxCodePrediction,
  type TaxCodePredictionInput,
} from "@/lib/ai/schemas";

type StructuredSchema = {
  name: string;
  schema: Record<string, unknown>;
};

async function createStructuredResponse<T>(params: {
  systemPrompt: string;
  input: string;
  schema: StructuredSchema;
}) {
  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: params.systemPrompt,
      },
      {
        role: "user",
        content: params.input,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: params.schema.name,
        schema: params.schema.schema,
        strict: true,
      },
    },
  });

  if (!response.output_text) {
    throw new Error("OpenAI response did not include structured output.");
  }

  return JSON.parse(response.output_text) as T;
}

function normalizeSql(sql: string) {
  return sql.trim().replace(/;+/g, "");
}

function assertSafeReadOnlySql(sql: string) {
  const normalized = normalizeSql(sql).toLowerCase();

  if (!(normalized.startsWith("select") || normalized.startsWith("with"))) {
    throw new Error("Generated SQL must be a read-only SELECT query.");
  }

  if (!normalized.includes("organization_id = $1") && !normalized.includes("organization_id=$1")) {
    throw new Error("Generated SQL must scope results to organization_id = $1.");
  }

  if (/(insert|update|delete|drop|alter|truncate|grant|revoke)\b/.test(normalized)) {
    throw new Error("Generated SQL contains a forbidden statement.");
  }

  return normalizeSql(sql);
}

export class TaxAiService {
  async predictTaxCode(input: TaxCodePredictionInput): Promise<TaxCodePrediction> {
    return createStructuredResponse<TaxCodePrediction>({
      systemPrompt: TAX_CODE_PREDICTION_SYSTEM_PROMPT,
      input: JSON.stringify(input, null, 2),
      schema: taxCodePredictionSchema,
    });
  }

  async naturalLanguageToSql(
    input: NaturalLanguageTaxQueryInput,
  ): Promise<NaturalLanguageTaxQueryResult> {
    const result = await createStructuredResponse<NaturalLanguageTaxQueryResult>({
      systemPrompt: NATURAL_LANGUAGE_TAX_QUERY_SYSTEM_PROMPT,
      input: JSON.stringify(input, null, 2),
      schema: naturalLanguageTaxQuerySchema,
    });

    return {
      ...result,
      sql: assertSafeReadOnlySql(result.sql),
      parameters: result.parameters.length
        ? result.parameters
        : [
            {
              name: "$1",
              value: input.organizationId,
              description: "Tenant organization id",
            },
          ],
    };
  }

  async detectComplianceRisks(
    input: ComplianceRiskDetectionInput,
  ): Promise<ComplianceRisk[]> {
    const result = await createStructuredResponse<{ risks: ComplianceRisk[] }>({
      systemPrompt: COMPLIANCE_RISK_SYSTEM_PROMPT,
      input: JSON.stringify(input, null, 2),
      schema: complianceRiskSchema,
    });

    return result.risks;
  }
}

export const taxAiService = new TaxAiService();
