# TokenLens

> Real-time token analytics, cost intelligence, and context degradation monitor for Google Antigravity.

---

## Overview

TokenLens is a developer observability plugin designed for Google Antigravity. It monitors token usage, calculates real-time API expenditure, tracks prompt cache hit rates, and alerts developers when an agent context window is approaching saturation thresholds where attention degradation and hallucinations occur.

## Core Features

- Real-time Token Telemetry: Tracks prompt, completion, and cache tokens per step and across whole sessions.
- Configurable Cost Engine: Accurately maps token usage to pricing tiers with full user-defined overrides via `.tokenlensrc.json`.
- Context Health Monitor: Evaluates token density against model limits to warn before performance degrades.
- Security-First Architecture: 100% local in-process execution with zero external data transmission.
- Antigravity Native: Intercepts lifecycle events via `hooks.json` and streams metrics directly from `transcript.jsonl`.
- Auxiliary Sidecar UI: Dedicated dashboard hosted in Antigravity's side panel.

## Architecture and Specifications

Refer to [BLUEPRINT.md](./BLUEPRINT.md) for the detailed technical design, threat model, and implementation roadmap.

## Security

TokenLens operates entirely in-memory and on local disk:
- Zero telemetry or network transmission.
- No storage or logging of sensitive prompt text or source code.
- Strict dependency isolation using `pnpm` to protect against phantom dependency supply chain attacks.

## License

Apache-2.0
