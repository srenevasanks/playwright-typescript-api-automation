import { test, expect } from '../../src/api/fixtures/test.js';
import { AuthClient } from '../../src/api/clients/Clients.js';
import { credentials } from '../../src/api/factories/data.js';
import { authSchema, memberSchema } from '../../src/api/schemas/contracts.js';
import { error } from '../helpers.js';
test('Valid credentials return the authenticated member and reusable token @authentication @smoke', async ({
  actor,
}) => {
  const response = await actor.auth.login(actor.credentials.email, actor.credentials.password);
  expect(response.status()).toBe(200);
  expect(authSchema.parse(await response.json()).record.id).toBe(actor.member.id);
  for (let i = 0; i < 2; i++) {
    const own = await actor.auth.getMember(actor.member.id);
    expect(own.status()).toBe(200);
    expect(memberSchema.parse(await own.json()).id).toBe(actor.member.id);
  }
});
for (const [name, identity, password] of [
  ['unknown identity', 'absent@example.test', 'bad-password'],
  ['missing identity', undefined, 'bad-password'],
  ['missing password', 'absent@example.test', undefined],
  ['empty identity', '', 'bad-password'],
  ['empty password', 'absent@example.test', ''],
  ['malformed identity type', { name: 'wrong' }, 'bad-password'],
] as const)
  test(`Authentication rejects ${name} @authentication @negative`, async ({ request }, info) => {
    await error(await new AuthClient(request, info).login(identity, password), 400);
  });
test('Authentication rejects an incorrect password for an existing member @authentication @negative', async ({
  actor,
}) => {
  await error(await actor.auth.login(actor.credentials.email, 'wrong-password'), 400);
});
test('Authenticated refresh returns the same member @authentication', async ({ actor }) => {
  const response = await actor.auth.refresh();
  expect(response.status()).toBe(200);
  expect(authSchema.parse(await response.json()).record.id).toBe(actor.member.id);
});
for (const token of [undefined, 'invalid-token'])
  test(`Refresh rejects ${token ? 'invalid' : 'missing'} token @authentication @negative`, async ({
    request,
  }, info) => {
    await error(await new AuthClient(request, info, token).refresh(), 401);
  });
for (const [name, patch, field] of [
  ['missing email', { email: '' }, 'email'],
  ['invalid email', { email: 'not-an-email' }, 'email'],
  ['short password', { password: 'short', passwordConfirm: 'short' }, 'password'],
  ['password mismatch', { passwordConfirm: 'different' }, 'passwordConfirm'],
] as const)
  test(`Registration rejects ${name} @authentication @negative`, async ({ request }, info) => {
    await error(
      await new AuthClient(request, info).register({ ...credentials(), ...patch }),
      400,
      field,
    );
  });
test('Registration rejects duplicate email identities @authentication @negative', async ({
  actor,
  request,
}, info) => {
  await error(await new AuthClient(request, info).register(actor.credentials), 400, 'email');
});
