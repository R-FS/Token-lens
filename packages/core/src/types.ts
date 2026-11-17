/**
 * Antigravity Transcript step types as emitted in transcript.jsonl.
 */
export type AntigravityStepType =
  | 'USER_INPUT'
  | 'PLANNER_RESPONSE'
  | 'EPHEMERAL_MESSAGE'
  | 'GENERIC'
  | string;

export type AntigravityStepSource =
  | 'USER_EXPLICIT'
  | 'MODEL'
  | 'SYSTEM'
  | 'SYSTEM_SDK'
  | string;

export type AntigravityStepStatus =
  | 'DONE'
  | 'ERROR'
  | 'IN_PROGRESS'
  | string;

export interface RawTranscriptRecord {
  step_index: number;
  source: AntigravityStepSource;
  type: AntigravityStepType;
  status: AntigravityStepStatus;
  created_at: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  tool_calls?: Array<{
    name: string;
    args?: Record<string, unknown>;
  }>;
  truncated_fields?: string[];
  content?: string;
  thinking?: string;
}

export interface StepTokenUsage {
  stepIndex: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  costUsd: number;
  timestamp: string;
}

export type ContextHealthStatus = 'OPTIMAL' | 'CAUTION' | 'DEGRADED';

export interface ContextHealthReport {
  status: ContextHealthStatus;
  currentContextTokens: number;
  maxContextTokens: number;
  saturationPercent: number;
  recommendation: string;
}

export interface SessionSummary {
  totalSteps: number;
  plannerTurns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  cacheHitRatePercent: number;
  activeModel: string;
  lastInputTokens: number;
  contextHealth: ContextHealthReport;
  steps: StepTokenUsage[];
}

export interface ModelPricingConfig {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  cacheReadPricePerMillion: number;
  contextWindowLimit: number;
}

export interface TokenLensConfig {
  currency: string;
  budgetLimitUsd?: number;
  alertThresholdPercent?: number;
  models: Record<string, ModelPricingConfig>;
}
