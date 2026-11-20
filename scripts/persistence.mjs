import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID, randomBytes } from 'node:crypto';
import { request } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
const executable =
  process.platform === 'win32'
    ? '.cache/pocketbase/pocketbase.exe'
    : '.cache/pocketbase/pocketbase';
const api = await request.newContext({ baseURL: 'http://127.0.0.1:8091', timeout: 1000 });
let child;
async function start() {
  child = spawn(
    executable,
    [
      'serve',
      '--http=127.0.0.1:8091',
      '--dir=.cache/persistence-data',
      '--migrationsDir=api-app/pb_migrations',
    ],
    { stdio: 'ignore' },
  );
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      if ((await api.get('/api/health')).ok()) return;
    } catch {
      /* Readiness polling only. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Persistence service not ready');
}
async function stop() {
  if (child && child.exitCode === null) {
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }
}
let token;
let member;
const failures = [];
try {
  await start();
  const password = randomBytes(24).toString('hex');
  const email = `persist-${randomUUID()}@example.test`;
  const registration = await api.post('/api/collections/members/records', {
    data: { email, password, passwordConfirm: password, role: 'editor' },
  });
  if (registration.status() !== 200) throw new Error(await registration.text());
  member = await registration.json();
  const auth = await api.post('/api/collections/members/auth-with-password', {
    data: { identity: email, password },
  });
  token = (await auth.json()).token;
  const created = await api.post('/api/collections/projects/records', {
    headers: { Authorization: token },
    data: { title: 'Persist across restart', owner: member.id, status: 'active' },
  });
  if (created.status() !== 200) throw new Error(await created.text());
  const project = await created.json();
  await stop();
  await start();
  const retrieved = await api.get(`/api/collections/projects/records/${project.id}`, {
    headers: { Authorization: token },
  });
  const body = await retrieved.json();
  if (retrieved.status() !== 200 || body.title !== project.title || body.owner !== member.id)
    throw new Error('Persistence lost across process restart');
  mkdirSync('evidence', { recursive: true });
  writeFileSync(
    'evidence/persistence.json',
    JSON.stringify(
      {
        at: new Date().toISOString(),
        status: 'passed',
        method:
          'Create project, stop process, restart with same SQLite directory, retrieve identical title and owner',
        projectId: project.id,
      },
      null,
      2,
    ),
  );
  console.log('SQLite persistence across process restart: passed');
} catch (error) {
  failures.push(error);
} finally {
  try {
    if (token && member) {
      const cleanup = await api.delete(`/api/collections/members/records/${member.id}`, {
        headers: { Authorization: token },
      });
      if (cleanup.status() !== 204)
        failures.push(new Error(`Persistence cleanup failed: ${await cleanup.text()}`));
    }
  } catch (error) {
    failures.push(error);
  } finally {
    await api.dispose();
    await stop();
  }
}
if (failures.length) throw new AggregateError(failures, 'Persistence verification failed');
