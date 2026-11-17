import type { ModelPricingConfig, TokenLensConfig } from './types.js';
import { DEFAULT_MODELS } from './config.js';

export function resolveModelConfig(
  modelName: string | undefined,
  config: TokenLensConfig
): { resolvedName: string; pricing: ModelPricingConfig } {
  if (!modelName || typeof modelName !== 'string') {
    return { resolvedName: 'default', pricing: config.models.default || DEFAULT_MODELS.default };
  }

  const normalized = modelName.trim().toLowerCase();

  // 1. Direct match
  if (config.models[normalized]) {
    return { resolvedName: normalized, pricing: config.models[normalized] };
  }

  // 2. Partial / Prefix matching against known model families
  for (const [key, pricing] of Object.entries(config.models)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { resolvedName: key, pricing };
    }
  }

  // 3. Fallback based on name fragments
  if (normalized.includes('flash')) {
    return {
      resolvedName: 'gemini-2.0-flash',
      pricing: config.models['gemini-2.0-flash'] || DEFAULT_MODELS['gemini-2.0-flash'],
    };
  }

  if (normalized.includes('sonnet')) {
    return {
      resolvedName: 'claude-3-7-sonnet',
      pricing: config.models['claude-3-7-sonnet'] || DEFAULT_MODELS['claude-3-7-sonnet'],
    };
  }

  if (normalized.includes('haiku')) {
    return {
      resolvedName: 'claude-3-5-haiku',
      pricing: config.models['claude-3-5-haiku'] || DEFAULT_MODELS['claude-3-5-haiku'],
    };
  }

  if (normalized.includes('gpt-4o-mini')) {
    return {
      resolvedName: 'gpt-4o-mini',
      pricing: config.models['gpt-4o-mini'] || DEFAULT_MODELS['gpt-4o-mini'],
    };
  }

  if (normalized.includes('gpt-4o')) {
    return {
      resolvedName: 'gpt-4o',
      pricing: config.models['gpt-4o'] || DEFAULT_MODELS['gpt-4o'],
    };
  }

  return {
    resolvedName: 'default',
    pricing: config.models.default || DEFAULT_MODELS.default,
  };
}

export function calculateStepCostUsd(
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  pricing: ModelPricingConfig
): number {
  const safeInput = Math.max(0, Number.isFinite(inputTokens) ? inputTokens : 0);
  const safeOutput = Math.max(0, Number.isFinite(outputTokens) ? outputTokens : 0);
  const safeCache = Math.min(
    safeInput,
    Math.max(0, Number.isFinite(cacheReadTokens) ? cacheReadTokens : 0)
  );

  const uncachedInput = safeInput - safeCache;

  const inputCost = (uncachedInput * pricing.inputPricePerMillion) / 1_000_000;
  const cacheCost = (safeCache * pricing.cacheReadPricePerMillion) / 1_000_000;
  const outputCost = (safeOutput * pricing.outputPricePerMillion) / 1_000_000;

  const total = inputCost + cacheCost + outputCost;
  return Math.round(total * 1_000_000) / 1_000_000; // Round to 6 decimal places
}
