# TokenLens (for Google Antigravity)

> Real-time token analytics, cost intelligence, and context degradation monitor for Google Antigravity.

---

## Overview

TokenLens is a developer observability plugin for Google Antigravity. It monitors token usage, calculates real-time API expenditure, tracks prompt cache hit rates, and alerts developers when an agent's context window is approaching the degradation zone (where hallucinations and instruction drift increase).

## Features (Planned)

- 📊 **Real-time Token Observability**: Track prompt, completion, and cache tokens per turn and across entire sessions.
- 💰 **Live Cost Engine**: Accurately maps token usage to dynamic pricing tiers for Gemini, Claude, OpenAI, and custom endpoints.
- 🎯 **Context Health Meter**: Visual warning gauge before context window saturation degrades agent performance.
- ⚡ **Antigravity Native**: Plugs directly into Antigravity lifecycle hooks (`hooks.json`) and streams metrics directly from `transcript.jsonl`.
- 🖥️ **Auxiliary Sidecar UI**: Dedicated dashboard inside Antigravity's side panel.

## Architecture & Specifications

See [BLUEPRINT.md](./BLUEPRINT.md) for the complete engineering architecture and implementation roadmap.

## License

Apache-2.0
