import type { SessionSummary } from '@tokenlens/core';

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatPostInvocationMessage(
  summary: SessionSummary,
  budgetLimitUsd?: number
): string {
  const lastStep = summary.steps[summary.steps.length - 1];
  if (!lastStep) {
    return '[TokenLens] Initializing session telemetry.';
  }

  const stepDeltaTokens = lastStep.totalTokens;
  const stepCost = formatCurrency(lastStep.costUsd);
  const totalTokens = formatNumber(summary.totalTokens);
  const totalCost = formatCurrency(summary.totalCostUsd);
  const cacheHitRate = `${summary.cacheHitRatePercent.toFixed(1)}%`;
  const contextSaturation = `${summary.contextHealth.saturationPercent.toFixed(1)}%`;
  const healthStatus = summary.contextHealth.status;

  let message = `[TokenLens] Turn ${lastStep.stepIndex}: +${formatNumber(stepDeltaTokens)} tokens (${stepCost}) | Total: ${totalTokens} tokens (${totalCost}) | Cache: ${cacheHitRate} | Context: ${contextSaturation} [${healthStatus}]`;

  if (summary.contextHealth.status === 'DEGRADED') {
    message += `\n> [WARNING] Context saturation reached ${contextSaturation}. ${summary.contextHealth.recommendation}`;
  }

  if (budgetLimitUsd && summary.totalCostUsd > budgetLimitUsd) {
    message += `\n> [WARNING] Session cost (${totalCost}) has exceeded configured budget limit (${formatCurrency(budgetLimitUsd)}).`;
  }

  return message;
}

export function formatSessionSummaryMarkdown(
  summary: SessionSummary,
  budgetLimitUsd?: number
): string {
  const lines: string[] = [];

  lines.push('### TokenLens Session Telemetry');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('| :--- | :--- |');
  lines.push(`| **Active Model** | \`${summary.activeModel}\` |`);
  lines.push(`| **Total Turns** | ${summary.plannerTurns} |`);
  lines.push(`| **Total Input Tokens** | ${formatNumber(summary.totalInputTokens)} |`);
  lines.push(`| **Total Output Tokens** | ${formatNumber(summary.totalOutputTokens)} |`);
  lines.push(`| **Cache Read Tokens** | ${formatNumber(summary.totalCacheReadTokens)} |`);
  lines.push(`| **Cache Hit Rate** | ${summary.cacheHitRatePercent.toFixed(1)}% |`);
  lines.push(`| **Total Tokens** | ${formatNumber(summary.totalTokens)} |`);
  lines.push(`| **Estimated Cost** | **${formatCurrency(summary.totalCostUsd)}** |`);
  lines.push(
    `| **Context Saturation** | ${summary.contextHealth.saturationPercent.toFixed(1)}% (${formatNumber(summary.lastInputTokens)} / ${formatNumber(summary.contextHealth.maxContextTokens)} tokens) [${summary.contextHealth.status}] |`
  );
  lines.push('');

  if (summary.contextHealth.status !== 'OPTIMAL') {
    lines.push(`> [NOTE] **Context Health:** ${summary.contextHealth.recommendation}`);
    lines.push('');
  }

  if (budgetLimitUsd && summary.totalCostUsd > budgetLimitUsd) {
    lines.push(
      `> [WARNING] **Budget Alert:** Total cost has exceeded configured budget limit of ${formatCurrency(budgetLimitUsd)}.`
    );
    lines.push('');
  }

  if (summary.steps.length > 0) {
    lines.push('#### Turn-by-Turn Breakdown');
    lines.push('');
    lines.push('| Turn | Model | Input | Output | Cache Read | Total | Cost |');
    lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

    for (const step of summary.steps) {
      lines.push(
        `| #${step.stepIndex} | \`${step.model}\` | ${formatNumber(step.inputTokens)} | ${formatNumber(step.outputTokens)} | ${formatNumber(step.cacheReadTokens)} | ${formatNumber(step.totalTokens)} | ${formatCurrency(step.costUsd)} |`
      );
    }
  }

  return lines.join('\n');
}
