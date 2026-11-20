import { test as base, expect, type APIRequestContext } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { AuthClient, ProjectsClient, TasksClient } from '../clients/Clients.js';
import { credentials } from '../factories/data.js';
import { authSchema, memberSchema, type Member } from '../schemas/contracts.js';
type Actor = {
  member: Member;
  credentials: ReturnType<typeof credentials>;
  auth: AuthClient;
  projects: ProjectsClient;
  tasks: TasksClient;
};
type Fixtures = {
  metadata: void;
  actor: Actor;
  makeActor: (role?: 'editor' | 'viewer') => Promise<Actor>;
  anonymous: ProjectsClient;
};
export const test = base.extend<Fixtures>({
  metadata: [
    async ({ baseURL }, use, info) => {
      await allure.feature(info.tags[0]?.replace('@', '') ?? 'API');
      await allure.story(info.title);
      await allure.severity(info.tags.includes('@smoke') ? 'critical' : 'normal');
      await allure.description(
        `Validates the TaskDesk API contract through Playwright APIRequestContext at ${baseURL}.`,
      );
      await use();
    },
    { auto: true },
  ],
  makeActor: async ({ playwright, baseURL }, use, info) => {
    const owned: { context: APIRequestContext; id?: string; auth?: AuthClient }[] = [];
    const failures: Error[] = [];
    try {
      await use(async (role = 'editor') => {
        const context = await playwright.request.newContext({ baseURL });
        const resource: { context: APIRequestContext; id?: string; auth?: AuthClient } = {
          context,
        };
        owned.push(resource);
        const data = credentials(role);
        const anonymous = new AuthClient(context, info);
        const created = await anonymous.register(data);
        expect(created.status(), await created.text()).toBe(200);
        const member = memberSchema.parse(await created.json());
        resource.id = member.id;
        const login = await anonymous.login(data.email, data.password);
        expect(login.status(), `Authentication setup returned HTTP ${login.status()}`).toBe(200);
        const { token } = authSchema.parse(await login.json());
        const actor = {
          member,
          credentials: data,
          auth: new AuthClient(context, info, token),
          projects: new ProjectsClient(context, info, token),
          tasks: new TasksClient(context, info, token),
        };
        resource.auth = actor.auth;
        return actor;
      });
    } catch (cause) {
      failures.push(cause instanceof Error ? cause : new Error(String(cause)));
    } finally {
      for (const { context, id, auth } of owned.reverse()) {
        try {
          if (!id) continue;
          if (!auth) {
            failures.push(
              new Error(
                `Member ${id} setup failed before authentication; controlled database reset required`,
              ),
            );
            continue;
          }
          const response = await auth.deleteMember(id);
          if (response.status() !== 204)
            failures.push(new Error(`member ${id}: ${response.status()} ${await response.text()}`));
        } catch (error) {
          failures.push(error instanceof Error ? error : new Error(String(error)));
        } finally {
          await context.dispose();
        }
      }
    }
    if (failures.length) {
      await info.attach('fixture failures', {
        body: failures.map((e) => e.message).join('\n'),
        contentType: 'text/plain',
      });
      throw new AggregateError(failures, 'Actor fixture failed; see attached diagnostics');
    }
  },
  actor: async ({ makeActor }, use) => {
    await use(await makeActor());
  },
  anonymous: async ({ request }, use, info) => {
    await use(new ProjectsClient(request, info));
  },
});
export { expect };
