import { ApiClient } from '../core/ApiClient.js';
import type { ProjectInput, TaskInput } from '../schemas/contracts.js';
export class AuthClient extends ApiClient {
  register(data: unknown) {
    return this.send('POST', '/api/collections/members/records', data);
  }
  login(identity: unknown, password?: unknown) {
    return this.send('POST', '/api/collections/members/auth-with-password', { identity, password });
  }
  refresh() {
    return this.send('POST', '/api/collections/members/auth-refresh');
  }
  getMember(id: string) {
    return this.send('GET', `/api/collections/members/records/${id}`);
  }
  updateMember(id: string, data: unknown) {
    return this.send('PATCH', `/api/collections/members/records/${id}`, data);
  }
  deleteMember(id: string) {
    return this.send('DELETE', `/api/collections/members/records/${id}`);
  }
}
export class ProjectsClient extends ApiClient {
  create(data: ProjectInput | Record<string, unknown>) {
    return this.send('POST', '/api/collections/projects/records', data);
  }
  get(id: string, params?: Record<string, string>) {
    return this.send('GET', `/api/collections/projects/records/${id}`, undefined, params);
  }
  list(params?: Record<string, string | number>) {
    return this.send('GET', '/api/collections/projects/records', undefined, params);
  }
  update(id: string, data: Partial<ProjectInput> | Record<string, unknown>) {
    return this.send('PATCH', `/api/collections/projects/records/${id}`, data);
  }
  delete(id: string) {
    return this.send('DELETE', `/api/collections/projects/records/${id}`);
  }
}
export class TasksClient extends ApiClient {
  create(data: TaskInput | Record<string, unknown>) {
    return this.send('POST', '/api/collections/tasks/records', data);
  }
  get(id: string, params?: Record<string, string>) {
    return this.send('GET', `/api/collections/tasks/records/${id}`, undefined, params);
  }
  list(params?: Record<string, string | number>) {
    return this.send('GET', '/api/collections/tasks/records', undefined, params);
  }
  update(id: string, data: Partial<TaskInput> | Record<string, unknown>) {
    return this.send('PATCH', `/api/collections/tasks/records/${id}`, data);
  }
  delete(id: string) {
    return this.send('DELETE', `/api/collections/tasks/records/${id}`);
  }
}
