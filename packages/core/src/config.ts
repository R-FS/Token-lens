import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { ModelPricingConfig, TokenLensConfig } from './types.js';

export const DEFAULT_MODELS: Record<string, ModelPricingConfig> = {
  'gemini-3.8-flash-high': {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    cacheReadPricePerMillion: 0.0375,
    contextWindowLimit: 1_048_576,
  },
  'gemini-2.0-flash': {
    inputPricePerMillion: 0.10,
    outputPricePerMillion: 0.40,
    cacheReadPricePerMillion: 0.025,
    contextWindowLimit: 1_048_576,
  },
  'gemini-1.5-pro': {
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.00,
    cacheReadPricePerMillion: 0.3125,
    contextWindowLimit: 2_097_152,
  },
  'claude-3-7-sonnet': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    cacheReadPricePerMillion: 0.30,
    contextWindowLimit: 200_000,
  },
  'claude-3-5-sonnet': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    cacheReadPricePerMillion: 0.30,
    contextWindowLimit: 200_000,
  },
  'claude-3-5-haiku': {
    inputPricePerMillion: 0.80,
    outputPricePerMillion: 4.00,
    cacheReadPricePerMillion: 0.08,
    contextWindowLimit: 200_000,
  },
  'gpt-4o': {
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
    cacheReadPricePerMillion: 1.25,
    contextWindowLimit: 128_000,
  },
  'gpt-4o-mini': {
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    cacheReadPricePerMillion: 0.075,
    contextWindowLimit: 128_000,
  },
  default: {
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 3.00,
    cacheReadPricePerMillion: 0.25,
    contextWindowLimit: 128_000,
  },
};

export const DEFAULT_CONFIG: TokenLensConfig = {
  currency: 'USD',
  budgetLimitUsd: 10.00,
  alertThresholdPercent: 70,
  models: { ...DEFAULT_MODELS },
};

function sanitizeNumber(val: unknown, fallback: number): number {
  if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
    return val;
  }
  return fallback;
}

function sanitizeModelConfig(
  raw: unknown,
  fallback: ModelPricingConfig
): ModelPricingConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...fallback };
  }

  const obj = raw as Record<string, unknown>;
  return {
    inputPricePerMillion: sanitizeNumber(
      obj.inputPricePerMillion,
      fallback.inputPricePerMillion
    ),
    outputPricePerMillion: sanitizeNumber(
      obj.outputPricePerMillion,
      fallback.outputPricePerMillion
    ),
    cacheReadPricePerMillion: sanitizeNumber(
      obj.cacheReadPricePerMillion,
      fallback.cacheReadPricePerMillion
    ),
    contextWindowLimit: Math.floor(
      sanitizeNumber(obj.contextWindowLimit, fallback.contextWindowLimit)
    ),
  };
}

export function parseConfig(rawJson: string): TokenLensConfig {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_CONFIG };
    }

    const mergedModels: Record<string, ModelPricingConfig> = { ...DEFAULT_MODELS };

    if (parsed.models && typeof parsed.models === 'object' && !Array.isArray(parsed.models)) {
      for (const [key, value] of Object.entries(parsed.models)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue; // Guard against prototype pollution
        }
        const fallback = mergedModels[key] || DEFAULT_MODELS.default;
        mergedModels[key] = sanitizeModelConfig(value, fallback);
      }
    }

    return {
      currency: typeof parsed.currency === 'string' && parsed.currency.length > 0
        ? parsed.currency.trim().toUpperCase()
        : DEFAULT_CONFIG.currency,
      budgetLimitUsd: typeof parsed.budgetLimitUsd === 'number'
        ? sanitizeNumber(parsed.budgetLimitUsd, 10.00)
        : DEFAULT_CONFIG.budgetLimitUsd,
      alertThresholdPercent: typeof parsed.alertThresholdPercent === 'number'
        ? Math.min(100, Math.max(1, sanitizeNumber(parsed.alertThresholdPercent, 70)))
        : DEFAULT_CONFIG.alertThresholdPercent,
      models: mergedModels,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function loadConfigFile(configPath?: string): Promise<TokenLensConfig> {
  if (!configPath) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const resolved = path.resolve(configPath);
    const content = await fs.readFile(resolved, 'utf-8');
    return parseConfig(content);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
