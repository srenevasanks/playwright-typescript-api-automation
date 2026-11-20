import { request } from '@playwright/test';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
const api = await request.newContext({ baseURL: 'http://127.0.0.1:8090' });
const evidence = [];
async function check(name, method, url, data, status, token) {
  const response = await api.fetch(url, {
    method,
    data,
    headers: token ? { Authorization: token } : {},
  });
  const body = response.status() === 204 ? null : await response.json();
  evidence.push({
    name,
    method,
    url,
    expected: status,
    actual: response.status(),
    body: body?.token ? { ...body, token: '[REDACTED]' } : body,
  });
  if (response.status() !== status)
    throw new Error(`${name}: ${response.status()} ${JSON.stringify(body)}`);
  return body;
}
const password = randomBytes(24).toString('hex');
const email = `feasibility-${randomUUID()}@example.test`;
let token;
let member;
try {
  await check('health', 'GET', '/api/health', undefined, 200);
  member = await check(
    'register',
    'POST',
    '/api/collections/members/records',
    { email, password, passwordConfirm: password, role: 'editor' },
    200,
  );
  await check(
    'invalid authentication',
    'POST',
    '/api/collections/members/auth-with-password',
    { identity: email, password: 'invalid' },
    400,
  );
  token = (
    await check(
      'valid authentication',
      'POST',
      '/api/collections/members/auth-with-password',
      { identity: email, password },
      200,
    )
  ).token;
  const project = await check(
    'create project',
    'POST',
    '/api/collections/projects/records',
    { title: 'Feasibility project', status: 'active', owner: member.id },
    200,
    token,
  );
  await check(
    'retrieve project',
    'GET',
    `/api/collections/projects/records/${project.id}`,
    undefined,
    200,
    token,
  );
  await check(
    'unauthorized project access',
    'GET',
    `/api/collections/projects/records/${project.id}`,
    undefined,
    404,
  );
  await check(
    'update project',
    'PATCH',
    `/api/collections/projects/records/${project.id}`,
    { title: 'Updated project' },
    200,
    token,
  );
  const task = await check(
    'create related task',
    'POST',
    '/api/collections/tasks/records',
    { title: 'Verify relationship', project: project.id, status: 'todo', priority: 3 },
    200,
    token,
  );
  await check(
    'complete task',
    'PATCH',
    `/api/collections/tasks/records/${task.id}`,
    { status: 'done' },
    200,
    token,
  );
  await check(
    'delete task',
    'DELETE',
    `/api/collections/tasks/records/${task.id}`,
    undefined,
    204,
    token,
  );
  await check(
    'delete project',
    'DELETE',
    `/api/collections/projects/records/${project.id}`,
    undefined,
    204,
    token,
  );
} finally {
  if (token && member)
    await check(
      'cleanup member',
      'DELETE',
      `/api/collections/members/records/${member.id}`,
      undefined,
      204,
      token,
    );
  await api.dispose();
  mkdirSync('evidence', { recursive: true });
  writeFileSync(
    'evidence/feasibility.json',
    JSON.stringify(
      { at: new Date().toISOString(), node: process.version, checks: evidence },
      null,
      2,
    ),
  );
}
console.log(`${evidence.length} feasibility checks passed`);
