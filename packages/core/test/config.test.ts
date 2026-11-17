import { describe, it, expect } from 'vitest';
import { parseConfig, DEFAULT_CONFIG } from '../src/config.js';

describe('Configuration Engine', () => {
  it('should return default config when given invalid JSON', () => {
    const config = parseConfig('invalid json');
    expect(config.currency).toBe(DEFAULT_CONFIG.currency);
    expect(config.budgetLimitUsd).toBe(DEFAULT_CONFIG.budgetLimitUsd);
  });

  it('should override model rates from user configuration', () => {
    const customJson = JSON.stringify({
      currency: 'EUR',
      budgetLimitUsd: 25.5,
      alertThresholdPercent: 80,
      models: {
        'gemini-3.8-flash-high': {
          inputPricePerMillion: 0.2,
          outputPricePerMillion: 0.8,
          cacheReadPricePerMillion: 0.05,
          contextWindowLimit: 500000,
        },
        'custom-local': {
          inputPricePerMillion: 0.0,
          outputPricePerMillion: 0.0,
          cacheReadPricePerMillion: 0.0,
          contextWindowLimit: 64000,
        },
      },
    });

    const config = parseConfig(customJson);
    expect(config.currency).toBe('EUR');
    expect(config.budgetLimitUsd).toBe(25.5);
    expect(config.alertThresholdPercent).toBe(80);
    expect(config.models['gemini-3.8-flash-high'].inputPricePerMillion).toBe(0.2);
    expect(config.models['custom-local'].contextWindowLimit).toBe(64000);
  });

  it('should guard against prototype pollution', () => {
    const maliciousJson = '{"models": {"__proto__": {"polluted": true}}}';
    const config = parseConfig(maliciousJson);
    expect((Object.prototype as unknown as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.hasOwn(config.models, '__proto__')).toBe(false);
  });
});
