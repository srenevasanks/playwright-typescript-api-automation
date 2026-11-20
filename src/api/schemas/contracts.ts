import { z } from 'zod';
export const idSchema = z.string().regex(/^[a-z0-9]{15}$/);
const base = z.object({ id: idSchema, collectionId: z.string(), collectionName: z.string() });
export const memberSchema = base.extend({
  role: z.enum(['editor', 'viewer']),
  emailVisibility: z.boolean(),
  verified: z.boolean(),
  email: z.email().optional(),
});
export const projectSchema = base.extend({
  title: z.string().min(3).max(80),
  status: z.enum(['active', 'archived']),
  owner: idSchema,
});
export const taskSchema = base.extend({
  title: z.string().min(3).max(120),
  status: z.enum(['todo', 'doing', 'done']),
  priority: z.number().int().min(1).max(5),
  notes: z.string().max(300),
  project: idSchema,
});
export const authSchema = z.object({ token: z.string().min(20), record: memberSchema });
export const errorSchema = z.object({
  status: z.number().int(),
  message: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});
export const healthSchema = z.object({
  code: z.literal(200),
  message: z.string(),
  data: z.object({}),
});
export const listSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    page: z.number().int(),
    perPage: z.number().int(),
    totalItems: z.number().int(),
    totalPages: z.number().int(),
    items: z.array(item),
  });
export type Member = z.infer<typeof memberSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Task = z.infer<typeof taskSchema>;
export type ProjectInput = Pick<Project, 'title' | 'status' | 'owner'>;
export type TaskInput = Pick<Task, 'title' | 'status' | 'priority' | 'project'> & {
  notes?: string;
};
