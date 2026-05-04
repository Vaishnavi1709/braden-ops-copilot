// Briefing output schema. Lives in its own module so the prompt builder, the
// Claude tool-use schema, the mock fallback, and the UI all share one source
// of truth.

import { z } from "zod";

export const BriefingSeveritySchema = z.enum(["low", "medium", "high"]);

export const KPIDeltaSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  delta: z.string().min(1).optional(),
});

export const ConcernSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(500),
  severity: BriefingSeveritySchema,
  metric: z.string().min(1).max(60).optional(),
});

export const WinSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(400),
  metric: z.string().min(1).max(60).optional(),
});

export const ActionSchema = z.object({
  title: z.string().min(1).max(120),
  why: z.string().min(1).max(500),
  owner: z.enum([
    "GM",
    "Sales Manager",
    "Service Manager",
    "F&I Manager",
    "BDC Lead",
    "Inventory Manager",
  ]),
  estimatedImpact: z.string().min(1).max(120),
});

export const BriefingSchema = z.object({
  headline: z.string().min(1).max(140),
  summary: z.string().min(1).max(600),
  wins: z.array(WinSchema).max(4),
  concerns: z.array(ConcernSchema).max(4),
  actions: z.array(ActionSchema).min(1).max(3),
});

export type Briefing = z.infer<typeof BriefingSchema>;
export type Concern = z.infer<typeof ConcernSchema>;
export type Win = z.infer<typeof WinSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type BriefingSeverity = z.infer<typeof BriefingSeveritySchema>;

// JSON Schema mirror used as the Claude tool input_schema.
// Kept in sync with the Zod schema by hand so we don't pull in an extra
// generator dep — the test suite has a sanity check that fails if they drift.
export const BRIEFING_TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    headline: { type: "string", maxLength: 140 },
    summary: { type: "string", maxLength: 600 },
    wins: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 120 },
          detail: { type: "string", maxLength: 400 },
          metric: { type: "string", maxLength: 60 },
        },
        required: ["title", "detail"],
      },
    },
    concerns: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 120 },
          detail: { type: "string", maxLength: 500 },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          metric: { type: "string", maxLength: 60 },
        },
        required: ["title", "detail", "severity"],
      },
    },
    actions: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 120 },
          why: { type: "string", maxLength: 500 },
          owner: {
            type: "string",
            enum: [
              "GM",
              "Sales Manager",
              "Service Manager",
              "F&I Manager",
              "BDC Lead",
              "Inventory Manager",
            ],
          },
          estimatedImpact: { type: "string", maxLength: 120 },
        },
        required: ["title", "why", "owner", "estimatedImpact"],
      },
    },
  },
  required: ["headline", "summary", "wins", "concerns", "actions"],
};
