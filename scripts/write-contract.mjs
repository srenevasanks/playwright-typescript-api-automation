// Explicit contract for the configured TaskDesk domain; not inferred from live responses.
import { writeFileSync } from 'node:fs';
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const id = { type: 'string', pattern: '^[a-z0-9]{15}$' };
const text = (minLength, maxLength) => ({ type: 'string', minLength, maxLength });
const enumeration = (values) => ({ type: 'string', enum: values });
const object = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
});
const metadata = { id, collectionId: { type: 'string' }, collectionName: { type: 'string' } };
const project = { title: text(3, 80), status: enumeration(['active', 'archived']), owner: id };
const task = {
  title: text(3, 120),
  status: enumeration(['todo', 'doing', 'done']),
  priority: { type: 'integer', minimum: 1, maximum: 5 },
  project: id,
  notes: text(0, 300),
};
const response = (description, schema) => ({
  description,
  ...(schema ? { content: { 'application/json': { schema } } } : {}),
});
const errors = {
  400: response('Validation or create-rule denial', ref('Error')),
  401: response('Authentication required', ref('Error')),
  404: response('Absent resource, denied access, or unsupported route/method', ref('Error')),
};
const body = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const paths = {
  '/api/health': {
    get: {
      security: [],
      responses: {
        200: response(
          'Healthy',
          object({
            code: { const: 200, type: 'integer' },
            message: { type: 'string' },
            data: { type: 'object' },
          }),
        ),
      },
    },
  },
  '/api/collections/members/auth-with-password': {
    post: {
      security: [],
      requestBody: body(
        object({ identity: { type: 'string' }, password: { type: 'string', writeOnly: true } }),
      ),
      responses: { 200: response('Authenticated', ref('Authentication')), ...errors },
    },
  },
  '/api/collections/members/auth-refresh': {
    post: { responses: { 200: response('Refreshed', ref('Authentication')), ...errors } },
  },
  '/api/collections/members/records': {
    post: {
      security: [],
      requestBody: body(ref('Registration')),
      responses: { 200: response('Registered', ref('Member')), ...errors },
    },
  },
  '/api/collections/members/records/{id}': {
    parameters: [{ name: 'id', in: 'path', required: true, schema: id }],
    get: { responses: { 200: response('Own member', ref('Member')), ...errors } },
    patch: {
      description: 'Own profile only; role changes are forbidden.',
      requestBody: body({
        type: 'object',
        properties: { role: enumeration(['editor', 'viewer']) },
      }),
      responses: { 200: response('Updated', ref('Member')), ...errors },
    },
    delete: {
      description: 'Deletes owned projects and their tasks by cascade.',
      responses: { 204: response('Deleted'), ...errors },
    },
  },
};
for (const [collection, name] of [
  ['projects', 'Project'],
  ['tasks', 'Task'],
]) {
  const root = `/api/collections/${collection}/records`;
  paths[root] = {
    get: {
      description: 'Access-rule-filtered list; inaccessible records are omitted.',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        {
          name: 'perPage',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
        },
        ...['sort', 'filter', 'expand'].map((name) => ({
          name,
          in: 'query',
          schema: { type: 'string' },
        })),
      ],
      responses: {
        200: response(
          'Paginated records',
          object({
            page: { type: 'integer' },
            perPage: { type: 'integer' },
            totalItems: { type: 'integer' },
            totalPages: { type: 'integer' },
            items: { type: 'array', items: ref(name) },
          }),
        ),
        ...errors,
      },
    },
    post: {
      requestBody: body(ref(`${name}Input`)),
      responses: { 200: response('Created', ref(name)), ...errors },
    },
  };
  paths[`${root}/{id}`] = {
    parameters: [{ name: 'id', in: 'path', required: true, schema: id }],
    get: {
      parameters: [{ name: 'expand', in: 'query', schema: { type: 'string' } }],
      responses: {
        200: response('Record; expand may add nested related records', ref(name)),
        ...errors,
      },
    },
    patch: {
      description:
        collection === 'projects'
          ? 'Owner immutable. May archive or reopen.'
          : 'Project immutable. Requires active project.',
      requestBody: body(ref(`${name}Patch`)),
      responses: { 200: response('Updated', ref(name)), ...errors },
    },
    delete: { responses: { 204: response('Deleted'), ...errors } },
  };
}
const specification = {
  openapi: '3.1.0',
  info: {
    title: 'TaskDesk on PocketBase',
    version: '1.0.0',
    description:
      'Controlled task management configuration on unmodified PocketBase 0.40.6. Text is not implicitly trimmed. Role, ownership and archive rules are defined in pb_migrations. No nullable domain fields: optional notes default to an empty string. PATCH only; unsupported PUT returns 404 via upstream catch-all. Token expiry and revocation are not customized.',
  },
  servers: [{ url: 'http://127.0.0.1:8090' }],
  security: [{ Token: [] }],
  paths,
  components: {
    securitySchemes: {
      Token: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'PocketBase auth token',
      },
    },
    schemas: {
      ProjectInput: object(project),
      ProjectPatch: object(project, []),
      Project: object({ ...metadata, ...project }),
      TaskInput: object(task, ['title', 'status', 'priority', 'project']),
      TaskPatch: object(task, []),
      Task: object({ ...metadata, ...task }),
      Member: object(
        {
          ...metadata,
          role: enumeration(['editor', 'viewer']),
          emailVisibility: { type: 'boolean' },
          verified: { type: 'boolean' },
          email: { type: 'string', format: 'email' },
        },
        [...Object.keys(metadata), 'role', 'emailVisibility', 'verified'],
      ),
      Registration: object({
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, writeOnly: true },
        passwordConfirm: { type: 'string', writeOnly: true },
        role: enumeration(['editor', 'viewer']),
      }),
      Authentication: object({ token: { type: 'string' }, record: ref('Member') }),
      Error: object({
        status: { type: 'integer' },
        message: { type: 'string' },
        data: { type: 'object', additionalProperties: true },
      }),
    },
  },
};
writeFileSync('api-app/openapi.json', JSON.stringify(specification, null, 2) + '\n');
