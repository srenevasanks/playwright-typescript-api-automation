import { test, expect } from '../../src/api/fixtures/test.js';
import { projectData, taskData } from '../../src/api/factories/data.js';
import { projectSchema, taskSchema, listSchema } from '../../src/api/schemas/contracts.js';
import { error } from '../helpers.js';
test('An editor creates, retrieves, updates and deletes an owned project @functional @smoke', async ({
  actor,
}) => {
  const input = projectData(actor.member.id);
  const created = await actor.projects.create(input);
  expect(created.status()).toBe(200);
  const project = projectSchema.parse(await created.json());
  expect(project).toMatchObject(input);
  expect(projectSchema.parse(await (await actor.projects.get(project.id)).json())).toEqual(project);
  expect((await actor.projects.update(project.id, { title: 'Persisted update' })).status()).toBe(
    200,
  );
  expect(projectSchema.parse(await (await actor.projects.get(project.id)).json()).title).toBe(
    'Persisted update',
  );
  expect((await actor.projects.delete(project.id)).status()).toBe(204);
  await error(await actor.projects.get(project.id), 404);
});
test('An editor persists task changes and deletes the task @functional @smoke', async ({
  actor,
}) => {
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  const input = { ...taskData(project.id), notes: 'Optional context' };
  const response = await actor.tasks.create(input);
  expect(response.status()).toBe(200);
  const task = taskSchema.parse(await response.json());
  expect(task).toMatchObject(input);
  expect((await actor.tasks.update(task.id, { title: 'Updated task', priority: 5 })).status()).toBe(
    200,
  );
  expect(taskSchema.parse(await (await actor.tasks.get(task.id)).json())).toMatchObject({
    title: 'Updated task',
    priority: 5,
    notes: input.notes,
    status: 'todo',
  });
  expect((await actor.tasks.delete(task.id)).status()).toBe(204);
  await error(await actor.tasks.get(task.id), 404);
});
test('Project lists support sorting, filtering and disjoint pagination @functional', async ({
  actor,
}) => {
  for (const title of ['Alpha project', 'Bravo project', 'Charlie project'])
    expect((await actor.projects.create({ ...projectData(actor.member.id), title })).status()).toBe(
      200,
    );
  const first = listSchema(projectSchema).parse(
    await (await actor.projects.list({ sort: 'title', perPage: 2, page: 1 })).json(),
  );
  const second = listSchema(projectSchema).parse(
    await (await actor.projects.list({ sort: 'title', perPage: 2, page: 2 })).json(),
  );
  expect(first).toMatchObject({ totalItems: 3, totalPages: 2, page: 1, perPage: 2 });
  expect(first.items.map((p) => p.title)).toEqual(['Alpha project', 'Bravo project']);
  expect(second.items.map((p) => p.title)).toEqual(['Charlie project']);
  const filtered = listSchema(projectSchema).parse(
    await (await actor.projects.list({ filter: 'title = "Bravo project"' })).json(),
  );
  expect(filtered.totalItems).toBe(1);
  expect(filtered.items[0]?.title).toBe('Bravo project');
});
test('Task lists support priority sorting and status filtering @functional', async ({ actor }) => {
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  for (const priority of [1, 3, 5])
    expect(
      (
        await actor.tasks.create({
          ...taskData(project.id),
          priority,
          status: priority === 3 ? 'done' : 'todo',
        })
      ).status(),
    ).toBe(200);
  const list = listSchema(taskSchema).parse(
    await (
      await actor.tasks.list({ sort: '-priority', filter: 'status = "todo"', perPage: 1 })
    ).json(),
  );
  expect(list).toMatchObject({ totalItems: 2, totalPages: 2 });
  expect(list.items[0]?.priority).toBe(5);
});
for (const status of ['todo', 'doing', 'done'] as const)
  test(`Task status ${status} persists across requests @functional`, async ({ actor }) => {
    const project = projectSchema.parse(
      await (await actor.projects.create(projectData(actor.member.id))).json(),
    );
    const task = taskSchema.parse(await (await actor.tasks.create(taskData(project.id))).json());
    expect((await actor.tasks.update(task.id, { status })).status()).toBe(200);
    expect(taskSchema.parse(await (await actor.tasks.get(task.id)).json()).status).toBe(status);
  });
test('An omitted optional task note defaults to an empty string @functional', async ({ actor }) => {
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  expect(
    taskSchema.parse(await (await actor.tasks.create(taskData(project.id))).json()).notes,
  ).toBe('');
});
