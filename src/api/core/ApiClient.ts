import type { APIRequestContext, APIResponse, TestInfo } from '@playwright/test';
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        /password|token|authorization|secret/i.test(key) ? '[REDACTED]' : redact(v),
      ]),
    );
  return value;
}
export class ApiClient {
  constructor(
    protected readonly context: APIRequestContext,
    protected readonly info?: TestInfo,
    protected readonly token?: string,
  ) {}
  async send(
    method: string,
    path: string,
    data?: unknown,
    params?: Record<string, string | number>,
    headers?: Record<string, string>,
  ): Promise<APIResponse> {
    const response = await this.context.fetch(path, {
      method,
      data,
      params,
      headers: { ...(this.token ? { Authorization: this.token } : {}), ...headers },
    });
    if (this.info) {
      const raw = await response.text();
      let body: unknown = raw;
      try {
        body = JSON.parse(raw) as unknown;
      } catch {
        /* Non-JSON errors remain readable. */
      }
      await this.info.attach(`${method} ${path}`, {
        body: JSON.stringify(
          {
            request: {
              method,
              path,
              params,
              data: typeof data === 'string' ? '[RAW BODY OMITTED]' : redact(data),
              headers: redact(headers),
            },
            response: { status: response.status(), body: redact(body) },
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });
    }
    return response;
  }
  health() {
    return this.send('GET', '/api/health');
  }
}
