import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import { parseTranscriptStream } from '../src/parser.js';
import { DEFAULT_CONFIG } from '../src/config.js';

describe('Transcript Parser', () => {
  it('should parse streaming JSONL records and aggregate session metrics', async () => {
    const jsonlData = [
      JSON.stringify({
        step_index: 0,
        source: 'USER_EXPLICIT',
        type: 'USER_INPUT',
        status: 'DONE',
        created_at: '2026-11-17T21:30:00Z',
        content: 'Refactor auth module',
      }),
      JSON.stringify({
        step_index: 1,
        source: 'SYSTEM_SDK',
        type: 'EPHEMERAL_MESSAGE',
        status: 'DONE',
        created_at: '2026-11-17T21:30:01Z',
        content: 'System ready',
      }),
      JSON.stringify({
        step_index: 2,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        status: 'DONE',
        created_at: '2026-11-17T21:30:02Z',
        model: 'gemini-3.8-flash-high',
        input_tokens: 25000,
        cache_read_tokens: 5000,
        output_tokens: 500,
      }),
      JSON.stringify({
        step_index: 3,
        source: 'MODEL',
        type: 'PLANNER_RESPONSE',
        status: 'DONE',
        created_at: '2026-11-17T21:30:10Z',
        model: 'gemini-3.8-flash-high',
        input_tokens: 30000,
        cache_read_tokens: 20000,
        output_tokens: 800,
      }),
    ].join('\n');

    const stream = Readable.from(jsonlData);
    const summary = await parseTranscriptStream(stream, DEFAULT_CONFIG);

    expect(summary.totalSteps).toBe(4);
    expect(summary.plannerTurns).toBe(2);
    expect(summary.totalInputTokens).toBe(55000);
    expect(summary.totalOutputTokens).toBe(1300);
    expect(summary.totalCacheReadTokens).toBe(25000);
    expect(summary.activeModel).toBe('gemini-3.8-flash-high');
    expect(summary.lastInputTokens).toBe(30000);
    expect(summary.totalCostUsd).toBeGreaterThan(0);
    expect(summary.steps).toHaveLength(2);
    expect(summary.contextHealth.status).toBe('OPTIMAL');
  });

  it('should ignore malformed lines gracefully without throwing', async () => {
    const malformedData = [
      'not a json line',
      '{"incomplete":',
      JSON.stringify({
        step_index: 0,
        type: 'PLANNER_RESPONSE',
        model: 'gemini-2.0-flash',
        input_tokens: 1000,
        output_tokens: 200,
      }),
    ].join('\n');

    const stream = Readable.from(malformedData);
    const summary = await parseTranscriptStream(stream, DEFAULT_CONFIG);

    expect(summary.plannerTurns).toBe(1);
    expect(summary.totalInputTokens).toBe(1000);
  });
});
