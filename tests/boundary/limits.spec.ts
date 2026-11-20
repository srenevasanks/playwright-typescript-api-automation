import { test, expect } from '../../src/api/fixtures/test.js';
import { projectData, taskData } from '../../src/api/factories/data.js';
import { projectSchema, taskSchema } from '../../src/api/schemas/contracts.js';
import { error } from '../helpers.js';
for (const length of [2, 3, 80, 81])
  test(`Project title length ${length} respects the 3–80 character boundary @boundary`, async ({
    actor,
  }) => {
    const title = 'x'.repeat(length);
    const response = await actor.projects.create({ ...projectData(actor.member.id), title });
    if (length === 2 || length === 81) await error(response, 400, 'title');
    else {
      expect(response.status()).toBe(200);
      const record = projectSchema.parse(await response.json());
      expect(projectSchema.parse(await (await actor.projects.get(record.id)).json()).title).toBe(
        title,
      );
    }
  });
for (const priority of [-1, 0, 1, 5, 6, 1e10])
  test(`Task priority ${priority} respects the integer 1–5 boundary @boundary`, async ({
    actor,
  }) => {
    const project = projectSchema.parse(
      await (await actor.projects.create(projectData(actor.member.id))).json(),
    );
    const response = await actor.tasks.create({ ...taskData(project.id), priority });
    if (priority < 1 || priority > 5) await error(response, 400, 'priority');
    else {
      expect(response.status()).toBe(200);
      expect(taskSchema.parse(await response.json()).priority).toBe(priority);
    }
  });
for (const length of [2, 3, 120, 121])
  test(`Task title length ${length} respects the 3–120 character boundary @boundary`, async ({
    actor,
  }) => {
    const project = projectSchema.parse(
      await (await actor.projects.create(projectData(actor.member.id))).json(),
    );
    const response = await actor.tasks.create({
      ...taskData(project.id),
      title: 'x'.repeat(length),
    });
    if (length === 2 || length === 121) await error(response, 400, 'title');
    else {
      expect(response.status()).toBe(200);
      expect(taskSchema.parse(await response.json()).title).toHaveLength(length);
    }
  });
for (const length of [0, 300, 301])
  test(`Optional task notes length ${length} respects the 300 character maximum @boundary`, async ({
    actor,
  }) => {
    const project = projectSchema.parse(
      await (await actor.projects.create(projectData(actor.member.id))).json(),
    );
    const response = await actor.tasks.create({
      ...taskData(project.id),
      notes: 'n'.repeat(length),
    });
    if (length > 300) await error(response, 400, 'notes');
    else {
      expect(response.status()).toBe(200);
      expect(taskSchema.parse(await response.json()).notes).toHaveLength(length);
    }
  });
test('Whitespace counts toward project title length without implicit trimming @boundary', async ({
  actor,
}) => {
  const response = await actor.projects.create({ ...projectData(actor.member.id), title: '   ' });
  expect(response.status()).toBe(200);
  const project = projectSchema.parse(await response.json());
  expect(projectSchema.parse(await (await actor.projects.get(project.id)).json()).title).toBe(
    '   ',
  );
});
