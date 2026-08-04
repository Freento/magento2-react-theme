import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const envFile = path.join(ROOT, '.env');
let editorEnabled = true;
if (fs.existsSync(envFile)) {
  const m = fs.readFileSync(envFile, 'utf8').match(/^\s*EDITOR_ENABLED\s*=\s*(\S+)/m);
  if (m) editorEnabled = m[1].toLowerCase() !== 'off';
}

const procs = [
  { name: 'storefront', color: 'blue',    cmd: 'npm:dev:storefront' },
];
if (editorEnabled) procs.push({ name: 'editor', color: 'magenta', cmd: 'npm:dev:editor' });
else console.log('[dev] EDITOR_ENABLED=off — skipping editor-app');

const args = [
  'concurrently',
  '-n', procs.map((p) => p.name).join(','),
  '-c', procs.map((p) => p.color).join(','),
  ...procs.map((p) => p.cmd),
];

const child = spawn('npx', args, { stdio: 'inherit', cwd: ROOT });
child.on('exit', (code) => process.exit(code ?? 0));
