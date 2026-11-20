import { request } from '@playwright/test';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
if (!root)
  throw new Error(
    'Usage: node scripts/verify-hosted.mjs <downloaded verified-report-site directory>',
  );
const baseURL = 'https://srenevasanks.github.io/playwright-typescript-api-automation/';
const expected = JSON.parse(readFileSync(path.join(root, 'summary.json'), 'utf8'));
function files(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(path.join(folder, entry.name)) : [path.join(folder, entry.name)],
  );
}
const assets = files(root).filter((file) => path.basename(file) !== '.nojekyll');
const api = await request.newContext({ baseURL, timeout: 30000 });
let verified = 0;
try {
  for (let i = 0; i < assets.length; i += 8) {
    await Promise.all(
      assets.slice(i, i + 8).map(async (file) => {
        const relative = path.relative(root, file).replaceAll('\\', '/');
        const response = await api.get(relative);
        if (response.status() !== 200 || !(await response.body()).equals(readFileSync(file)))
          throw new Error(
            `Hosted asset differs from deployed artifact: ${relative} (HTTP ${response.status()})`,
          );
        verified++;
      }),
    );
  }
  writeFileSync(
    'evidence/hosted-report-verification.json',
    JSON.stringify(
      {
        at: new Date().toISOString(),
        status: 'passed',
        baseURL,
        workflow: expected.githubActions,
        scope: expected.scope,
        total: expected.total,
        passed: expected.passed,
        assetsVerifiedOverHttp: verified,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Published report verified: ${verified} assets match the hosted workflow artifact; ${expected.passed}/${expected.total} passed`,
  );
} finally {
  await api.dispose();
}
