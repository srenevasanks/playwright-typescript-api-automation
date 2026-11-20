import { test, expect } from '../../src/api/fixtures/test.js';
import { projectData, taskData } from '../../src/api/factories/data.js';
import { projectSchema, taskSchema, listSchema } from '../../src/api/schemas/contracts.js';
import { error } from '../helpers.js';
test('An editor completes a task, archives its project and retrieves retained history @workflows @integration', async ({
  actor,
}) => {
  const project = await test.step('Create the owned project', async () => {
    const response = await actor.projects.create(projectData(actor.member.id));
    expect(response.status()).toBe(200);
    return projectSchema.parse(await response.json());
  });
  const task = await test.step('Create a related task', async () => {
    const response = await actor.tasks.create(taskData(project.id));
    expect(response.status()).toBe(200);
    return taskSchema.parse(await response.json());
  });
  for (const status of ['doing', 'done'] as const)
    await test.step(`Persist status ${status}`, async () => {
      expect((await actor.tasks.update(task.id, { status })).status()).toBe(200);
      expect(taskSchema.parse(await (await actor.tasks.get(task.id)).json())).toMatchObject({
        status,
        project: project.id,
      });
    });
  await test.step('Archive and read retained history', async () => {
    expect((await actor.projects.update(project.id, { status: 'archived' })).status()).toBe(200);
    expect(projectSchema.parse(await (await actor.projects.get(project.id)).json()).status).toBe(
      'archived',
    );
    expect(taskSchema.parse(await (await actor.tasks.get(task.id)).json()).status).toBe('done');
  });
});
test('Archiving blocks task mutations and reopening restores editing @workflows @integration', async ({
  actor,
}) => {
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  const task = taskSchema.parse(await (await actor.tasks.create(taskData(project.id))).json());
  expect((await actor.projects.update(project.id, { status: 'archived' })).status()).toBe(200);
  await error(await actor.tasks.create(taskData(project.id)), 400);
  await error(await actor.tasks.update(task.id, { status: 'done' }), 404);
  await error(await actor.tasks.delete(task.id), 404);
  expect(taskSchema.parse(await (await actor.tasks.get(task.id)).json())).toEqual(task);
  expect((await actor.projects.update(project.id, { status: 'active' })).status()).toBe(200);
  expect((await actor.tasks.update(task.id, { status: 'doing' })).status()).toBe(200);
  expect(taskSchema.parse(await (await actor.tasks.get(task.id)).json()).status).toBe('doing');
});
test('Deleting a project cascades to its tasks and leaves unrelated projects intact @integration', async ({
  actor,
}) => {
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  const retained = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  const task = taskSchema.parse(await (await actor.tasks.create(taskData(project.id))).json());
  expect((await actor.projects.delete(project.id)).status()).toBe(204);
  await error(await actor.tasks.get(task.id), 404);
  const remaining = listSchema(projectSchema).parse(await (await actor.projects.list()).json());
  expect(remaining.items.map((p) => p.id)).toEqual([retained.id]);
});
