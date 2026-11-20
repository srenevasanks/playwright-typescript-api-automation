import { test, expect } from '../../src/api/fixtures/test.js';
import { projectData, taskData } from '../../src/api/factories/data.js';
import { projectSchema, listSchema } from '../../src/api/schemas/contracts.js';
import { error } from '../helpers.js';
for (const [name, patch, field] of [
  ['missing title', { title: '' }, 'title'],
  ['null title', { title: null }, 'title'],
  ['object title', { title: { bad: true } }, 'title'],
  ['invalid status', { status: 'deleted' }, 'status'],
] as const)
  test(`Project validation rejects ${name} @negative`, async ({ actor }) => {
    await error(
      await actor.projects.create({ ...projectData(actor.member.id), ...patch }),
      400,
      field,
    );
    expect(
      listSchema(projectSchema).parse(await (await actor.projects.list()).json()).totalItems,
    ).toBe(0);
  });
for (const [name, patch, field] of [
  ['missing title', { title: '' }, 'title'],
  ['invalid status', { status: 'cancelled' }, 'status'],
  ['fractional priority', { priority: 2.5 }, 'priority'],
  ['nonnumeric priority', { priority: 'high' }, 'priority'],
] as const)
  test(`Task validation rejects ${name} @negative`, async ({ actor }) => {
    const project = projectSchema.parse(
      await (await actor.projects.create(projectData(actor.member.id))).json(),
    );
    await error(await actor.tasks.create({ ...taskData(project.id), ...patch }), 400, field);
  });
for (const id of ['invalid-id', '000000000000000'])
  test(`Retrieving absent project ${id} returns a structured error @negative`, async ({
    actor,
  }) => {
    await error(await actor.projects.get(id), 404);
  });
test('Malformed JSON is rejected before creating a record @negative', async ({ actor }) => {
  await error(
    await actor.projects.send('POST', '/api/collections/projects/records', '{bad', undefined, {
      'Content-Type': 'application/json',
    }),
    400,
  );
});
test('Invalid filter expressions return a structured error @negative', async ({ actor }) => {
  await error(await actor.projects.list({ filter: 'title = (' }), 400);
});
test('A nonexistent project cannot be used as a task relationship @negative', async ({ actor }) => {
  await error(await actor.tasks.create(taskData('000000000000000')), 400);
});
test('PUT replacement is not supported by the records API @negative', async ({ actor }) => {
  await error(
    await actor.projects.send(
      'PUT',
      '/api/collections/projects/records',
      projectData(actor.member.id),
    ),
    404,
  );
});
