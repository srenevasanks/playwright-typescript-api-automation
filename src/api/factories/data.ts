import { randomBytes, randomUUID } from 'node:crypto';
import type { ProjectInput, TaskInput } from '../schemas/contracts.js';
export const credentials = (role: 'editor' | 'viewer' = 'editor') => {
  const password = randomBytes(24).toString('hex');
  return {
    email: `member-${randomUUID()}@example.test`,
    password,
    passwordConfirm: password,
    role,
  };
};
export const projectData = (owner: string): ProjectInput => ({
  title: `Project ${randomUUID()}`,
  owner,
  status: 'active',
});
export const taskData = (project: string): TaskInput => ({
  title: `Task ${randomUUID()}`,
  project,
  status: 'todo',
  priority: 3,
});
