import { describe, it, expect } from 'vitest';
import { evaluateContextHealth } from '../src/health.js';

describe('Context Health Evaluator', () => {
  it('should mark context below 40% as OPTIMAL', () => {
    const report = evaluateContextHealth(30000, 100000, 70);
    expect(report.status).toBe('OPTIMAL');
    expect(report.saturationPercent).toBe(30);
  });

  it('should mark context between 40% and alertThreshold as CAUTION', () => {
    const report = evaluateContextHealth(55000, 100000, 70);
    expect(report.status).toBe('CAUTION');
    expect(report.saturationPercent).toBe(55);
  });

  it('should mark context above alertThreshold as DEGRADED', () => {
    const report = evaluateContextHealth(75000, 100000, 70);
    expect(report.status).toBe('DEGRADED');
    expect(report.saturationPercent).toBe(75);
    expect(report.recommendation).toContain('saturated');
  });

  it('should safely cap saturation at 100%', () => {
    const report = evaluateContextHealth(150000, 100000, 70);
    expect(report.saturationPercent).toBe(100);
    expect(report.status).toBe('DEGRADED');
  });
});
