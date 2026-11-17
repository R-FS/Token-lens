---
name: token-lens
description: Provides real-time token telemetry, financial cost estimates, prompt cache hit rates, and context window health metrics for the current session. Use when the user asks for token stats, cost breakdown, context health, /tokens, or /context.
---

# TokenLens: Telemetry & Context Health

When the user asks to check token usage, cost estimates, or context health (or triggers `/tokens` or `/context`), perform the following steps:

1. Locate the current conversation transcript at `<appDataDir>/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`.
2. Inspect the latest steps to aggregate:
   - Total input tokens across turns.
   - Total output tokens generated.
   - Cache read tokens.
   - Active model name.
   - Current working context size (input tokens on the latest turn).
3. Compute the context saturation percentage against the active model's context limit:
   - If saturation < 40%: Context is **OPTIMAL**.
   - If saturation between 40% and 70%: Context is **CAUTION**.
   - If saturation >= 70%: Context is **DEGRADED**. Recommend running `/compact` or starting a fresh focused session.
4. Output a clean, markdown table summarizing:
   - Model and turn count.
   - Token breakdown (input, output, cache read, total).
   - Estimated expenditure based on configured or standard model rates.
   - Context saturation meter and recommendation.
