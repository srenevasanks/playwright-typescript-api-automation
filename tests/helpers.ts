import type { APIResponse } from '@playwright/test';
import { expect } from '../src/api/fixtures/test.js';
import { errorSchema } from '../src/api/schemas/contracts.js';
export async function error(response: APIResponse, status: number, field?: string) {
  expect(response.status(), await response.text()).toBe(status);
  const body = errorSchema.parse(await response.json());
  expect(body.status).toBe(status);
  if (field) expect(body.data).toHaveProperty(field);
  return body;
}
