import * as fs from 'node:fs';
import * as readline from 'node:readline';
import type {
  RawTranscriptRecord,
  SessionSummary,
  StepTokenUsage,
  TokenLensConfig,
} from './types.js';
import { DEFAULT_CONFIG } from './config.js';
import { resolveModelConfig, calculateStepCostUsd } from './pricing.js';
import { evaluateContextHealth } from './health.js';

function parseRecordLine(line: string): RawTranscriptRecord | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const obj = JSON.parse(trimmed);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return null;
    }

    if (typeof obj.step_index !== 'number' || typeof obj.type !== 'string') {
      return null;
    }

    return obj as RawTranscriptRecord;
  } catch {
    return null; // Ignore malformed or truncated lines safely
  }
}

export async function parseTranscriptStream(
  stream: NodeJS.ReadableStream,
  config: TokenLensConfig = DEFAULT_CONFIG
): Promise<SessionSummary> {
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  const steps: StepTokenUsage[] = [];
  let totalSteps = 0;
  let plannerTurns = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCostUsd = 0;
  let activeModel = 'default';
  let lastInputTokens = 0;

  for await (const line of rl) {
    totalSteps++;
    const record = parseRecordLine(line);
    if (!record) {
      continue;
    }

    // Process token metrics from steps with model usage (primarily PLANNER_RESPONSE)
    if (
      typeof record.input_tokens === 'number' ||
      typeof record.output_tokens === 'number'
    ) {
      plannerTurns++;
      const model = record.model || activeModel;
      activeModel = model;

      const inputTokens = Math.max(0, record.input_tokens || 0);
      const outputTokens = Math.max(0, record.output_tokens || 0);
      const cacheReadTokens = Math.max(0, record.cache_read_tokens || 0);

      const { pricing } = resolveModelConfig(model, config);
      const costUsd = calculateStepCostUsd(
        inputTokens,
        outputTokens,
        cacheReadTokens,
        pricing
      );

      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalCacheReadTokens += cacheReadTokens;
      totalCostUsd += costUsd;
      lastInputTokens = inputTokens;

      steps.push({
        stepIndex: record.step_index,
        model,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd,
        timestamp: record.created_at || new Date().toISOString(),
      });
    }
  }

  const { pricing } = resolveModelConfig(activeModel, config);
  const contextHealth = evaluateContextHealth(
    lastInputTokens,
    pricing.contextWindowLimit,
    config.alertThresholdPercent
  );

  const totalTokens = totalInputTokens + totalOutputTokens;
  const cacheHitRatePercent = totalInputTokens > 0
    ? Math.round((totalCacheReadTokens / totalInputTokens) * 1000) / 10
    : 0;

  return {
    totalSteps,
    plannerTurns,
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalTokens,
    totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
    cacheHitRatePercent,
    activeModel,
    lastInputTokens,
    contextHealth,
    steps,
  };
}

export async function parseTranscriptFile(
  filePath: string,
  config: TokenLensConfig = DEFAULT_CONFIG
): Promise<SessionSummary> {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  return parseTranscriptStream(fileStream, config);
}
