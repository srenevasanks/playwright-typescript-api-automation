import { test, expect } from '../../src/api/fixtures/test.js';
import { ProjectsClient } from '../../src/api/clients/Clients.js';
import { projectData, taskData } from '../../src/api/factories/data.js';
import { projectSchema, taskSchema, listSchema } from '../../src/api/schemas/contracts.js';
import { error } from '../helpers.js';
test('A viewer cannot create a project @authorization', async ({ makeActor }) => {
  const viewer = await makeActor('viewer');
  await error(await viewer.projects.create(projectData(viewer.member.id)), 400);
});
test('An anonymous user cannot create a project @authorization', async ({ actor, anonymous }) => {
  await error(await anonymous.create(projectData(actor.member.id)), 400);
});
for (const operation of ['get', 'update', 'delete'] as const)
  test(`Another editor cannot ${operation} an owned project @authorization`, async ({
    actor,
    makeActor,
  }) => {
    const other = await makeActor();
    const project = projectSchema.parse(
      await (await actor.projects.create(projectData(actor.member.id))).json(),
    );
    const response =
      operation === 'update'
        ? await other.projects.update(project.id, { title: 'Unauthorized update' })
        : await other.projects[operation](project.id);
    await error(response, 404);
    expect(projectSchema.parse(await (await actor.projects.get(project.id)).json())).toEqual(
      project,
    );
  });
test('Lists hide other users projects and tasks @authorization', async ({ actor, makeActor }) => {
  const other = await makeActor();
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  expect((await actor.tasks.create(taskData(project.id))).status()).toBe(200);
  expect(listSchema(projectSchema).parse(await (await other.projects.list()).json()).items).toEqual(
    [],
  );
  expect(listSchema(taskSchema).parse(await (await other.tasks.list()).json()).items).toEqual([]);
});
test('An editor cannot attach a task to another users project @authorization', async ({
  actor,
  makeActor,
}) => {
  const other = await makeActor();
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  await error(await other.tasks.create(taskData(project.id)), 400);
});
test('An editor cannot transfer project ownership @authorization', async ({ actor, makeActor }) => {
  const other = await makeActor();
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  await error(await actor.projects.update(project.id, { owner: other.member.id }), 404);
  expect(projectSchema.parse(await (await actor.projects.get(project.id)).json()).owner).toBe(
    actor.member.id,
  );
});
test('A viewer cannot elevate its role to editor @authorization', async ({ makeActor }) => {
  const viewer = await makeActor('viewer');
  await error(await viewer.auth.updateMember(viewer.member.id, { role: 'editor' }), 404);
});
test('An invalid token cannot retrieve a private project @authorization', async ({
  actor,
  request,
}) => {
  const project = projectSchema.parse(
    await (await actor.projects.create(projectData(actor.member.id))).json(),
  );
  await error(await new ProjectsClient(request, undefined, 'invalid-token').get(project.id), 404);
});
