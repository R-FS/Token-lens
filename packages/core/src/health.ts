import type { ContextHealthReport, ContextHealthStatus } from './types.js';

export function evaluateContextHealth(
  currentContextTokens: number,
  maxContextTokens: number,
  alertThresholdPercent = 70
): ContextHealthReport {
  const safeCurrent = Math.max(0, Number.isFinite(currentContextTokens) ? currentContextTokens : 0);
  const safeMax = Math.max(1, Number.isFinite(maxContextTokens) ? maxContextTokens : 128_000);

  const rawPercent = (safeCurrent / safeMax) * 100;
  const saturationPercent = Math.min(100, Math.round(rawPercent * 10) / 10);

  let status: ContextHealthStatus = 'OPTIMAL';
  let recommendation = 'Context utilization is healthy. Full attention fidelity maintained.';

  if (saturationPercent >= alertThresholdPercent) {
    status = 'DEGRADED';
    recommendation =
      'Context window is saturated. High probability of instruction forgetting and hallucination. Recommend compacting context or starting a new session.';
  } else if (saturationPercent >= 40) {
    status = 'CAUTION';
    recommendation =
      'Context utilization is moderate. Attention dispersion may begin. Avoid attaching unnecessary large files or dependencies.';
  }

  return {
    status,
    currentContextTokens: safeCurrent,
    maxContextTokens: safeMax,
    saturationPercent,
    recommendation,
  };
}
