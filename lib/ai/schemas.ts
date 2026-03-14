export type TaxCodePredictionInput = {
  organizationId: string;
  product: {
    sku?: string;
    name: string;
    description?: string;
    category?: string;
    attributes?: Record<string, string | number | boolean>;
  };
};

export type TaxCodePrediction = {
  taxCode: string;
  confidence: number;
  rationale: string;
  requiresReview: boolean;
};

export type NaturalLanguageTaxQueryInput = {
  organizationId: string;
  question: string;
  allowedTables: string[];
};

export type SqlParameter = {
  name: string;
  value: string;
  description: string;
};

export type NaturalLanguageTaxQueryResult = {
  sql: string;
  parameters: SqlParameter[];
  explanation: string;
};

export type ComplianceRiskDetectionInput = {
  organizationId: string;
  transactions: Array<{
    id: string;
    transactionDate: string;
    jurisdiction: string;
    amount: number;
    taxAmount: number;
    taxCode?: string;
    status?: string;
  }>;
};

export type ComplianceRisk = {
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  transactionIds: string[];
  recommendation: string;
};

export const taxCodePredictionSchema = {
  name: "tax_code_prediction",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      taxCode: { type: "string" },
      confidence: { type: "number" },
      rationale: { type: "string" },
      requiresReview: { type: "boolean" },
    },
    required: ["taxCode", "confidence", "rationale", "requiresReview"],
  },
};

export const naturalLanguageTaxQuerySchema = {
  name: "natural_language_tax_query",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      sql: { type: "string" },
      parameters: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            value: { type: "string" },
            description: { type: "string" },
          },
          required: ["name", "value", "description"],
        },
      },
      explanation: { type: "string" },
    },
    required: ["sql", "parameters", "explanation"],
  },
};

export const complianceRiskSchema = {
  name: "compliance_risk_detection",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      risks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
            summary: { type: "string" },
            transactionIds: {
              type: "array",
              items: { type: "string" },
            },
            recommendation: { type: "string" },
          },
          required: ["title", "severity", "summary", "transactionIds", "recommendation"],
        },
      },
    },
    required: ["risks"],
  },
};
