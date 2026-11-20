import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { request } from '@playwright/test';
const run = process.env.RUN_ID ?? 'parallel-2';
if (!/^[a-z0-9-]+$/.test(run)) throw new Error('Invalid RUN_ID');
const root = `reports/${run}`;
function files(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(`${folder}/${entry.name}`) : [`${folder}/${entry.name}`],
  );
}
const api = await request.newContext({ baseURL: 'http://127.0.0.1:9323' });
let checked = 0;
try {
  for (const file of [...files(`${root}/playwright`), ...files(`${root}/allure`)]) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const response = await api.get(`/${relative}`);
    if (response.status() !== 200 || !(await response.body()).equals(readFileSync(file)))
      throw new Error(`Missing or stale report asset: ${relative}`);
    checked++;
  }
  const resultFiles = readdirSync(`${root}/allure-results`).filter((name) =>
    name.endsWith('-result.json'),
  );
  for (const file of resultFiles) {
    const result = JSON.parse(readFileSync(`${root}/allure-results/${file}`, 'utf8'));
    for (const label of ['feature', 'story', 'severity'])
      if (!result.labels.some((item) => item.name === label))
        throw new Error(`${file} missing ${label}`);
    if (!result.description) throw new Error(`${file} missing description`);
  }
  writeFileSync(
    'evidence/report-audit.json',
    JSON.stringify(
      {
        at: new Date().toISOString(),
        run,
        assetsVerifiedOverHttp: checked,
        testsWithAllureMetadata: resultFiles.length,
        status: 'passed',
      },
      null,
      2,
    ),
  );
  console.log(
    `${checked} report assets verified over HTTP; ${resultFiles.length} tests have required Allure metadata`,
  );
} finally {
  await api.dispose();
}
