migrate(
  (app) => {
    const users = new Collection({
      type: 'auth',
      name: 'members',
      createRule: '@request.body.role = "editor" || @request.body.role = "viewer"',
      listRule: 'id = @request.auth.id',
      viewRule: 'id = @request.auth.id',
      updateRule: 'id = @request.auth.id && @request.body.role:changed = false',
      deleteRule: 'id = @request.auth.id',
      fields: [
        {
          name: 'role',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['editor', 'viewer'],
        },
      ],
      passwordAuth: { enabled: true, identityFields: ['email'] },
    });
    app.save(users);
    const owner = '@request.auth.id != "" && owner = @request.auth.id';
    const edit = owner + ' && @request.auth.role = "editor"';
    const projects = new Collection({
      type: 'base',
      name: 'projects',
      listRule: owner,
      viewRule: owner,
      createRule: '@request.auth.role = "editor" && @request.body.owner = @request.auth.id',
      updateRule: edit + ' && @request.body.owner:changed = false',
      deleteRule: edit,
      fields: [
        { name: 'title', type: 'text', required: true, min: 3, max: 80 },
        {
          name: 'status',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['active', 'archived'],
        },
        {
          name: 'owner',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true,
        },
      ],
    });
    app.save(projects);
    const access = '@request.auth.id != "" && project.owner = @request.auth.id';
    const write = access + ' && @request.auth.role = "editor" && project.status = "active"';
    app.save(
      new Collection({
        type: 'base',
        name: 'tasks',
        listRule: access,
        viewRule: access,
        createRule:
          '@request.auth.role = "editor" && @request.body.project.owner = @request.auth.id && @request.body.project.status = "active"',
        updateRule: write + ' && @request.body.project:changed = false',
        deleteRule: write,
        fields: [
          { name: 'title', type: 'text', required: true, min: 3, max: 120 },
          {
            name: 'status',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: ['todo', 'doing', 'done'],
          },
          { name: 'priority', type: 'number', required: true, onlyInt: true, min: 1, max: 5 },
          { name: 'notes', type: 'text', max: 300 },
          {
            name: 'project',
            type: 'relation',
            required: true,
            maxSelect: 1,
            collectionId: projects.id,
            cascadeDelete: true,
          },
        ],
      }),
    );
  },
  (app) => {
    for (const name of ['tasks', 'projects', 'members'])
      app.delete(app.findCollectionByNameOrId(name));
  },
);
