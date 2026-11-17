import { describe, it, expect } from 'vitest';
import { calculateStepCostUsd, resolveModelConfig } from '../src/pricing.js';
import { DEFAULT_CONFIG } from '../src/config.js';

describe('Pricing Engine', () => {
  it('should calculate cost without caching', () => {
    const pricing = {
      inputPricePerMillion: 1.0,
      outputPricePerMillion: 2.0,
      cacheReadPricePerMillion: 0.1,
      contextWindowLimit: 128000,
    };

    // 100,000 input tokens = $0.10
    // 50,000 output tokens = $0.10
    // Total = $0.20
    const cost = calculateStepCostUsd(100000, 50000, 0, pricing);
    expect(cost).toBe(0.2);
  });

  it('should calculate discounted cost with prompt cache hits', () => {
    const pricing = {
      inputPricePerMillion: 2.0,
      outputPricePerMillion: 10.0,
      cacheReadPricePerMillion: 0.2,
      contextWindowLimit: 200000,
    };

    // Uncached input: 20k * $2/M = $0.04
    // Cached input: 80k * $0.2/M = $0.016
    // Output: 10k * $10/M = $0.10
    // Total: $0.04 + $0.016 + $0.10 = $0.156
    const cost = calculateStepCostUsd(20000, 10000, 80000, pricing);
    expect(cost).toBe(0.156);
  });

  it('should safely handle negative or invalid inputs', () => {
    const pricing = DEFAULT_CONFIG.models['default'];
    const cost = calculateStepCostUsd(-500, -100, -50, pricing);
    expect(cost).toBe(0);
  });

  it('should resolve model aliases and families', () => {
    const resolvedSonnet = resolveModelConfig('claude-3-7-sonnet-20250219', DEFAULT_CONFIG);
    expect(resolvedSonnet.resolvedName).toContain('sonnet');

    const resolvedFlash = resolveModelConfig('gemini-2.0-flash-exp', DEFAULT_CONFIG);
    expect(resolvedFlash.resolvedName).toContain('flash');

    const resolvedUnknown = resolveModelConfig('unknown-llm-model', DEFAULT_CONFIG);
    expect(resolvedUnknown.resolvedName).toBe('default');
  });
});
