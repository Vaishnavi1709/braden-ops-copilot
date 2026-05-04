// The Anthropic SDK glue.
//
// Calling convention: signals → prompt → Claude tool-use → Zod-validated
// briefing. If anything in that chain fails (no key, network blip, malformed
// tool input, schema-validation error), we return a deterministic mock
// briefing built from the same signals so the demo is never broken.
//
// We always return an object — never throw — so the route handler stays
// simple. Telemetry is surfaced via the `source` field for the UI to label.

import Anthropic from "@anthropic-ai/sdk";
import { Signals } from "./compute";
import { buildMockBriefing } from "./mock";
import {
  BRIEFING_SYSTEM_PROMPT,
  buildBriefingUserMessage,
} from "./prompt";
import {
  BRIEFING_TOOL_INPUT_SCHEMA,
  Briefing,
  BriefingSchema,
} from "./types";

export type BriefingResult = {
  briefing: Briefing;
  source: "claude" | "mock-no-key" | "mock-fallback";
  error?: string;
  modelId?: string;
};

const MODEL_ID = process.env.ANTHROPIC_MODEL_ID ?? "claude-sonnet-4-6";

export async function generateBriefing(signals: Signals): Promise<BriefingResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      briefing: buildMockBriefing(signals),
      source: "mock-no-key",
    };
  }

  try {
    const client = new Anthropic();

    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 1024,
      system: BRIEFING_SYSTEM_PROMPT,
      tools: [
        {
          name: "submit_briefing",
          description:
            "Submit the structured AI Daily Briefing for the General Manager. Use ONLY this tool — do not also write the briefing in plain text.",
          input_schema: BRIEFING_TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "submit_briefing" },
      messages: [{ role: "user", content: buildBriefingUserMessage({ signals }) }],
    });

    const toolUse = response.content.find(
      (block) => block.type === "tool_use" && block.name === "submit_briefing"
    );
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not invoke the submit_briefing tool");
    }

    const parsed = BriefingSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw new Error(`Briefing failed schema validation: ${parsed.error.message}`);
    }

    return {
      briefing: parsed.data,
      source: "claude",
      modelId: MODEL_ID,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      briefing: buildMockBriefing(signals),
      source: "mock-fallback",
      error: msg,
    };
  }
}
