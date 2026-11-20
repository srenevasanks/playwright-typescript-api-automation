import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
const executable = path.resolve(
  '.cache/pocketbase',
  process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase',
);
mkdirSync('.cache/data', { recursive: true });
const child = spawn(
  executable,
  ['serve', '--http=127.0.0.1:8090', '--dir=.cache/data', '--migrationsDir=api-app/pb_migrations'],
  { stdio: 'inherit' },
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code ?? 1));
