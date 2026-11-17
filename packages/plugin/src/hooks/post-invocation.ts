import * as path from 'node:path';
import { parseTranscriptFile, loadConfigFile } from '@tokenlens/core';
import { formatPostInvocationMessage } from '../formatter.js';

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
    // In case stdin is already closed or empty
    if (process.stdin.isTTY) {
      resolve('');
    }
  });
}

export async function runPostInvocation(): Promise<void> {
  try {
    const rawInput = await readStdin();
    if (!rawInput.trim()) {
      process.stdout.write(JSON.stringify({ injectSteps: [], terminationBehavior: '' }));
      return;
    }

    const payload: HookPayload = JSON.parse(rawInput);
    if (!payload.transcriptPath) {
      process.stdout.write(JSON.stringify({ injectSteps: [], terminationBehavior: '' }));
      return;
    }

    // Load optional user configuration from workspace cwd
    const configPath = payload.cwd
      ? path.join(payload.cwd, '.tokenlensrc.json')
      : undefined;
    const config = await loadConfigFile(configPath);

    const summary = await parseTranscriptFile(payload.transcriptPath, config);
    const userMarkdown = formatPostInvocationMessage(summary, config.budgetLimitUsd);

    const output = {
      injectSteps: [
        {
          systemMessage: {
            systemMessage: '',
            metadata: {
              user_markdown: userMarkdown,
            },
          },
        },
      ],
      terminationBehavior: '',
    };

    process.stdout.write(JSON.stringify(output));
  } catch {
    // Fail silently with an empty payload to avoid interrupting agent workflows
    process.stdout.write(JSON.stringify({ injectSteps: [], terminationBehavior: '' }));
  }
}

// Only invoke automatically when run as main script
if (process.argv[1] && process.argv[1].endsWith('post-invocation.js')) {
  runPostInvocation();
}
