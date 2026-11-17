import { describe, it, expect } from 'vitest';
import type { SessionSummary } from '@tokenlens/core';
import {
  formatCurrency,
  formatNumber,
  formatPostInvocationMessage,
  formatSessionSummaryMarkdown,
} from '../src/formatter.js';

describe('Plugin Formatter', () => {
  const mockSummary: SessionSummary = {
    totalSteps: 5,
    plannerTurns: 2,
    totalInputTokens: 50000,
    totalOutputTokens: 2000,
    totalCacheReadTokens: 10000,
    totalTokens: 52000,
    totalCostUsd: 0.045,
    cacheHitRatePercent: 20.0,
    activeModel: 'gemini-3.8-flash-high',
    lastInputTokens: 30000,
    contextHealth: {
      status: 'OPTIMAL',
      currentContextTokens: 30000,
      maxContextTokens: 1048576,
      saturationPercent: 2.9,
      recommendation: 'Context utilization is healthy.',
    },
    steps: [
      {
        stepIndex: 1,
        model: 'gemini-3.8-flash-high',
        inputTokens: 20000,
        outputTokens: 800,
        cacheReadTokens: 0,
        totalTokens: 20800,
        costUsd: 0.018,
        timestamp: '2026-11-17T22:00:00Z',
      },
      {
        stepIndex: 3,
        model: 'gemini-3.8-flash-high',
        inputTokens: 30000,
        outputTokens: 1200,
        cacheReadTokens: 10000,
        totalTokens: 31200,
        costUsd: 0.027,
        timestamp: '2026-11-17T22:00:10Z',
      },
    ],
  };

  it('should format numbers with comma separators', () => {
    expect(formatNumber(1250000)).toBe('1,250,000');
  });

  it('should format currency values to 4 decimal places', () => {
    expect(formatCurrency(0.045, 'USD')).toContain('0.0450');
  });

  it('should produce a single-line summary with turn metrics for PostInvocation', () => {
    const msg = formatPostInvocationMessage(mockSummary);
    expect(msg).toContain('[TokenLens] Turn 3:');
    expect(msg).toContain('31,200 tokens');
    expect(msg).toContain('[OPTIMAL]');
  });

  it('should include warning alerts when context is degraded', () => {
    const degradedSummary: SessionSummary = {
      ...mockSummary,
      contextHealth: {
        status: 'DEGRADED',
        currentContextTokens: 80000,
        maxContextTokens: 100000,
        saturationPercent: 80.0,
        recommendation: 'Context window is saturated.',
      },
    };

    const msg = formatPostInvocationMessage(degradedSummary);
    expect(msg).toContain('[WARNING] Context saturation reached 80.0%');
  });

  it('should include budget warning when budget is exceeded', () => {
    const msg = formatPostInvocationMessage(mockSummary, 0.01);
    expect(msg).toContain('[WARNING] Session cost');
    expect(msg).toContain('exceeded configured budget limit');
  });

  it('should render a complete markdown table for session summaries', () => {
    const md = formatSessionSummaryMarkdown(mockSummary);
    expect(md).toContain('### TokenLens Session Telemetry');
    expect(md).toContain('| **Active Model** | `gemini-3.8-flash-high` |');
    expect(md).toContain('| Turn | Model | Input | Output | Cache Read | Total | Cost |');
    expect(md).toContain('| #3 | `gemini-3.8-flash-high` |');
  });
});
