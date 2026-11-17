import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseTranscriptFile, loadConfigFile } from '@tokenlens/core';

const PORT = parseInt(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || '8123', 10);
const HOST = '127.0.0.1';

function resolveTranscriptPath(): string | null {
  if (process.env.ANTIGRAVITY_TRANSCRIPT_PATH && fs.existsSync(process.env.ANTIGRAVITY_TRANSCRIPT_PATH)) {
    return process.env.ANTIGRAVITY_TRANSCRIPT_PATH;
  }

  const appDataDir =
    process.env.ANTIGRAVITY_APP_DATA_DIR ||
    path.join(os.homedir(), '.gemini', 'antigravity');
  const convId = process.env.ANTIGRAVITY_CONVERSATION_ID;

  if (convId) {
    const candidate = path.join(
      appDataDir,
      'brain',
      convId,
      '.system_generated',
      'logs',
      'transcript.jsonl'
    );
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Scan recent brain directories for the latest active transcript
  try {
    const brainRoot = path.join(appDataDir, 'brain');
    if (fs.existsSync(brainRoot)) {
      const entries = fs.readdirSync(brainRoot, { withFileTypes: true });
      let latestMtime = 0;
      let latestPath: string | null = null;

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const candidate = path.join(
          brainRoot,
          entry.name,
          '.system_generated',
          'logs',
          'transcript.jsonl'
        );
        if (fs.existsSync(candidate)) {
          const stats = fs.statSync(candidate);
          if (stats.mtimeMs > latestMtime) {
            latestMtime = stats.mtimeMs;
            latestPath = candidate;
          }
        }
      }

      if (latestPath) {
        return latestPath;
      }
    }
  } catch {
    // Ignore scan errors safely
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      const htmlPath = path.join(__dirname, 'dashboard.html');
      // If running from dist, check sibling or src/dashboard.html
      const resolvedHtmlPath = fs.existsSync(htmlPath)
        ? htmlPath
        : path.resolve(__dirname, '..', 'src', 'dashboard.html');

      const content = fs.readFileSync(resolvedHtmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Failed to load dashboard: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
  }

  if (url.pathname === '/api/telemetry') {
    try {
      const transcriptPath = resolveTranscriptPath();
      if (!transcriptPath) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            activeModel: 'No active session',
            totalCostUsd: 0,
            plannerTurns: 0,
            totalTokens: 0,
            cacheHitRatePercent: 0,
            lastInputTokens: 0,
            contextHealth: {
              status: 'OPTIMAL',
              maxContextTokens: 1048576,
              saturationPercent: 0,
              recommendation: 'Waiting for conversation activity...',
            },
            steps: [],
          })
        );
        return;
      }

      const config = await loadConfigFile();
      const summary = await parseTranscriptFile(transcriptPath, config);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(summary));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`[TokenLens Sidecar] Dashboard running at http://${HOST}:${PORT}`);
});
