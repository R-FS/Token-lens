import * as path from 'node:path';
import { parseTranscriptFile, loadConfigFile } from '@tokenlens/core';
import { formatSessionSummaryMarkdown } from '../formatter.js';

interface HookPayload {
  conversationId?: string;
  transcriptPath?: string;
  modelName?: string;
  cwd?: string;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    if (process.stdin.isTTY) {
      resolve('');
    }
  });
}

export async function runSessionSummary(): Promise<void> {
  try {
    const rawInput = await readStdin();
    if (!rawInput.trim()) {
      process.stdout.write(JSON.stringify({ injectSteps: [] }));
      return;
    }

    const payload: HookPayload = JSON.parse(rawInput);
    if (!payload.transcriptPath) {
      process.stdout.write(JSON.stringify({ injectSteps: [] }));
      return;
    }

    const configPath = payload.cwd
      ? path.join(payload.cwd, '.tokenlensrc.json')
      : undefined;
    const config = await loadConfigFile(configPath);

    const summary = await parseTranscriptFile(payload.transcriptPath, config);
    const summaryMarkdown = formatSessionSummaryMarkdown(summary, config.budgetLimitUsd);

    const output = {
      injectSteps: [
        {
          systemMessage: {
            systemMessage: '',
            metadata: {
              user_markdown: summaryMarkdown,
            },
          },
        },
      ],
    };

    process.stdout.write(JSON.stringify(output));
  } catch {
    process.stdout.write(JSON.stringify({ injectSteps: [] }));
  }
}

if (process.argv[1] && process.argv[1].endsWith('session-summary.js')) {
  runSessionSummary();
}
