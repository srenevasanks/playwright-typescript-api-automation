import { test, expect } from '../../src/api/fixtures/test.js';
import { ApiClient } from '../../src/api/core/ApiClient.js';
import { projectData, taskData } from '../../src/api/factories/data.js';
import {
  healthSchema,
  projectSchema,
  taskSchema,
  listSchema,
  memberSchema,
} from '../../src/api/schemas/contracts.js';
test('Health response matches the published PocketBase health contract @contract @smoke', async ({
  request,
}, info) => {
  const response = await new ApiClient(request, info).health();
  expect(response.status()).toBe(200);
  expect(healthSchema.parse(await response.json()).code).toBe(200);
});
test('Project and task lists validate nested array contracts @contract', async ({ actor }) => {
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  const task = taskSchema.parse(await (await actor.tasks.create(taskData(project.id))).json());
  expect(listSchema(projectSchema).parse(await (await actor.projects.list()).json()).items).toEqual(
    [project],
  );
  expect(listSchema(taskSchema).parse(await (await actor.tasks.list()).json()).items).toEqual([
    task,
  ]);
});
test('An expanded task response contains its related project and owner @contract @integration', async ({
  actor,
}) => {
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  const task = taskSchema.parse(await (await actor.tasks.create(taskData(project.id))).json());
  const response = await actor.tasks.get(task.id, { expand: 'project.owner' });
  expect(response.status()).toBe(200);
  const body: unknown = await response.json();
  const { z } = await import('zod');
  const expanded = taskSchema
    .extend({
      expand: z.object({
        project: projectSchema.extend({ expand: z.object({ owner: memberSchema }) }),
      }),
    })
    .parse(body);
  expect(expanded.expand.project.id).toBe(project.id);
  expect(expanded.expand.project.expand.owner.id).toBe(actor.member.id);
});
