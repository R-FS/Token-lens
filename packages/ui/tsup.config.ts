import { defineConfig } from 'tsup';
import * as fs from 'node:fs';
import * as path from 'node:path';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  clean: true,
  sourcemap: true,
  target: 'es2022',
  onSuccess: async () => {
    const srcHtml = path.resolve('src/dashboard.html');
    const distHtml = path.resolve('dist/dashboard.html');
    fs.copyFileSync(srcHtml, distHtml);
  },
});
