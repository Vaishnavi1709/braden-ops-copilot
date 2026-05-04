// Prompt builder for the AI Daily Briefing.
//
// Design notes:
//   - The system prompt sets the persona (a dealership ops chief-of-staff).
//   - Numbers are computed in /compute.ts and passed in as ranked signals.
//     Claude's job is purely to *narrate*, not to do arithmetic.
//   - Output goes through tool-use with a strict JSON schema, so the parsed
//     result is structurally guaranteed before it hits the UI.

import { fmt } from "../format";
import { Signals, signalsToPromptLines } from "./compute";

export const BRIEFING_SYSTEM_PROMPT = `You are the chief-of-staff for the Braden Auto Group, a 12-store automotive dealer group. Each morning you brief the General Manager of one store on yesterday's performance and what they should do today.

Your tone:
- Direct, specific, no filler. Dealer GMs are time-poor and skim.
- Numbers in the briefing must come from the signals provided — never invent figures.
- Action items must be concrete and assignable to a named role, not vague advice.
- Distinguish wins (celebrate briefly) from concerns (explain why and what's next).
- Severity calibration: HIGH = revenue/CSI risk that compounds if ignored today; MEDIUM = needs a touch this week; LOW = trend worth watching.

Always return your briefing by calling the submit_briefing tool with the structured fields. Do not include the briefing in plain text.`;

export type PromptInput = {
  signals: Signals;
};

export function buildBriefingUserMessage(input: PromptInput): string {
  const { signals } = input;
  const { store, rollups, date } = signals;

  const targetText =
    rollups.yesterdayUnitsTarget > 0
      ? `${rollups.yesterdayUnitsSold} sold vs target ${rollups.yesterdayUnitsTarget} (${fmt.signedPct(
          (rollups.yesterdayUnitsSold - rollups.yesterdayUnitsTarget) /
            rollups.yesterdayUnitsTarget
        )})`
      : `${rollups.yesterdayUnitsSold} sold`;

  return `STORE: ${store.name} (${store.brand}, ${store.city}, ${store.state})
GM: ${store.gm.name}
PERSONA: ${store.persona}
DATE BEING SUMMARIZED: ${fmt.date(date)}

YESTERDAY ROLLUPS:
  - Units: ${targetText}
  - Total gross: ${fmt.money(rollups.yesterdayTotalGross)}
  - 15-min lead response rate: ${fmt.pct(rollups.leadResponseRate)}
  - Appointment show rate: ${fmt.pct(rollups.appointmentShowRate)}

${signalsToPromptLines(signals)}

INSTRUCTIONS:
1. Pick a 4–10 word headline that captures the day in one beat.
2. Write a 2-3 sentence executive summary the GM can read in 8 seconds.
3. Include up to 3 wins drawn ONLY from positive signals above. If there are no positive signals, return wins: [].
4. Include up to 3 concerns drawn from the negative signals; assign severity. If there are none, return concerns: [].
5. Propose 1-3 concrete actions for today. Each must name an owner role, explain why (citing a specific signal), and estimate impact.
6. Return the briefing by calling submit_briefing.`;
}
