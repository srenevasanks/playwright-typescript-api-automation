import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const run = process.env.RUN_ID ?? 'regression';
if (!/^[a-z0-9-]+$/.test(run)) throw new Error('Invalid RUN_ID');
const folder = `reports/${run}`;
const summary = JSON.parse(readFileSync(`${folder}/summary.json`, 'utf8'));
const results = `${folder}/allure-results`;
for (const file of readdirSync(results)) {
  const content = readFileSync(`${results}/${file}`, 'utf8');
  if (/eyJhbGciOiJIUzI1Ni[A-Za-z0-9_.-]+/.test(content))
    throw new Error(`Unredacted JWT in ${file}`);
}
writeFileSync(
  `${results}/categories.json`,
  JSON.stringify(
    [
      { name: 'Product or contract failure', matchedStatuses: ['failed'] },
      { name: 'Framework or environment failure', matchedStatuses: ['broken'] },
    ],
    null,
    2,
  ),
);
writeFileSync(
  `${results}/environment.properties`,
  `Application=TaskDesk / PocketBase 0.40.6\nNode=${process.version}\nScope=${summary.scope}\nWorkers=${summary.workers}\n`,
);
const generated = spawnSync(
  process.execPath,
  [
    'node_modules/allure-commandline/bin/allure',
    'generate',
    results,
    '--clean',
    '-o',
    `${folder}/allure`,
  ],
  {
    stdio: 'inherit',
  },
);
if (generated.status !== 0) process.exit(generated.status ?? 1);
const allure = JSON.parse(readFileSync(`${folder}/allure/widgets/summary.json`, 'utf8'));
if (
  allure.statistic.total !== summary.total ||
  allure.statistic.passed !== summary.passed ||
  allure.statistic.failed !== summary.failed ||
  allure.statistic.skipped !== summary.skipped
)
  throw new Error('Allure test counts differ from execution summary');
if (!existsSync(`${folder}/playwright/index.html`) || !existsSync(`${folder}/allure/index.html`))
  throw new Error('Report HTML missing');
for (const file of readdirSync(results).filter((f) => f.endsWith('-attachment.json'))) {
  const text = readFileSync(`${results}/${file}`, 'utf8');
  if (
    /"(?:password|passwordConfirm|token|Authorization)"\s*:\s*"(?!\[REDACTED\])[^"]+"/i.test(text)
  )
    throw new Error(`Sensitive value in ${file}`);
}
console.log(
  `Verified reports: ${summary.total} tests, ${summary.passed} passed; scope ${summary.scope}; run ${run}`,
);
