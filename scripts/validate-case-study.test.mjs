import assert from 'node:assert/strict';
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { validateCaseStudy } from './validate-case-study.mjs';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEXT_FILES = [
  'README.md',
  'README.es.md',
  'LICENSE.md',
  'SECURITY.md',
  'ASSET_PROVENANCE.md',
  'package.json',
];
const ASSET_FILES = [
  'product-overview.png',
  'ogamlabs-signature.svg',
  'price-history.webp',
  'station-list.webp',
  'price-map.webp',
  'route-deficit.webp',
  'route-range.webp',
  'route-stop.webp',
  'social-preview.png',
];

async function makeFixture(t) {
  const fixture = await mkdtemp(join(tmpdir(), 'chollogas-case-study-'));
  await mkdir(join(fixture, 'assets'));
  await mkdir(join(fixture, '.github/workflows'), { recursive: true });
  for (const file of TEXT_FILES) {
    await copyFile(join(PROJECT_ROOT, file), join(fixture, file));
  }
  for (const file of ASSET_FILES) {
    await copyFile(join(PROJECT_ROOT, 'assets', file), join(fixture, 'assets', file));
  }
  await copyFile(
    join(PROJECT_ROOT, '.github/workflows/case-study-check.yml'),
    join(fixture, '.github/workflows/case-study-check.yml'),
  );
  t.after(() => rm(fixture, { recursive: true, force: true }));
  return fixture;
}

async function replaceFixtureText(fixture, path, original, replacement) {
  const target = join(fixture, path);
  const text = await readFile(target, 'utf8');
  assert(text.includes(original), `Fixture text not found in ${path}: ${original}`);
  await writeFile(target, text.replace(original, replacement));
}

test('the current bilingual case study satisfies its public-proof invariants', async () => {
  const result = await validateCaseStudy(PROJECT_ROOT);
  assert.deepEqual(result.errors, []);
  assert.equal(result.documents, 2);
  assert.equal(result.referencedAssets.length, 9);
});

test('the current Spanish capture keeps its cross-border scope explanation', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    'README.md',
    'The hero combines an authentic Spanish-language product capture with the',
    'The hero shows CholloGas.',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('README.md')
    && error.includes('missing public-proof statement')
    && error.includes('Spanish-language product capture')
  )));
});

test('the Spanish document keeps the current cross-border scope explanation', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    'README.es.md',
    'La portada combina una captura auténtica del producto en español con el alcance',
    'La portada muestra CholloGas.',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('README.es.md')
    && error.includes('missing public-proof statement')
    && error.includes('captura auténtica')
  )));
});

test('the route visuals remain an explained three-step product decision', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    'README.md',
    'The decision is intentionally progressive: quantify the vehicle\'s usable range,',
    'The app recommends a stop.',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('README.md')
    && error.includes('missing public-proof statement')
    && error.includes('intentionally progressive')
  )));
});

test('the privacy section must disclose server-side coordinates and telemetry limits', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    'README.md',
    'server-side; the request is unauthenticated.',
    'entirely on-device.',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('README.md')
    && error.includes('missing public-proof statement')
    && error.includes('request is unauthenticated')
  )));
});

test('missing social previews fail validation', async (t) => {
  const fixture = await makeFixture(t);
  await unlink(join(fixture, 'assets', 'social-preview.png'));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('social-preview.png')));
});

test('silent social-preview changes fail the reviewed hash', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'assets', 'social-preview.png');
  const data = await readFile(path);
  data[data.length - 1] ^= 1;
  await writeFile(path, data);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('SHA-256')));
});

test('silent WebP changes fail the reviewed hash', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'assets', 'price-map.webp');
  const data = await readFile(path);
  data[data.length - 1] ^= 1;
  await writeFile(path, data);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('price-map.webp') && error.includes('SHA-256')
  )));
});

test('missing product captures fail validation', async (t) => {
  const fixture = await makeFixture(t);
  await unlink(join(fixture, 'assets', 'price-map.webp'));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('price-map.webp')));
});

test('missing route-decision captures fail validation', async (t) => {
  const fixture = await makeFixture(t);
  await unlink(join(fixture, 'assets', 'route-range.webp'));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('route-range.webp')));
});

test('the reviewed OgamLabs signature is required', async (t) => {
  const fixture = await makeFixture(t);
  await unlink(join(fixture, 'assets', 'ogamlabs-signature.svg'));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('ogamlabs-signature.svg')));
});

test('the OgamLabs signature keeps its white dark-mode panel', async (t) => {
  const fixture = await makeFixture(t);
  const signaturePath = join(fixture, 'assets', 'ogamlabs-signature.svg');
  const signature = await readFile(signaturePath, 'utf8');
  const withoutPanel = signature.replace(
    '  <rect width="1024" height="320" rx="32" fill="#FFFFFF"/>\n',
    '',
  );
  assert.notEqual(withoutPanel, signature);
  await writeFile(signaturePath, withoutPanel);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('ogamlabs-signature.svg')
    && error.includes('SHA-256')
  )));
});

test('SVG assets reject active or external content', async (t) => {
  const fixture = await makeFixture(t);
  await writeFile(
    join(fixture, 'assets', 'ogamlabs-signature.svg'),
    '<svg width="1024" height="320" viewBox="0 0 1024 320"><script>alert(1)</script></svg>',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('ogamlabs-signature.svg')
    && error.includes('active or external content')
  )));
});

test('corrupt image containers fail validation', async (t) => {
  const fixture = await makeFixture(t);
  await writeFile(join(fixture, 'assets', 'route-stop.webp'), 'not a webp');

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('expected a valid WebP')));
});

test('reviewed image dimensions cannot change', async (t) => {
  const fixture = await makeFixture(t);
  await copyFile(
    join(fixture, 'assets', 'social-preview.png'),
    join(fixture, 'assets', 'product-overview.png'),
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('product-overview.png') && error.includes('expected 1200x630')
  )));
});

test('externally hosted images are rejected', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  await writeFile(path, `${markdown}\n![Tracking pixel](https://example.com/pixel.png)\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('externally hosted images')));
});

test('unreviewed raw HTML behavior is rejected', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  await writeFile(
    path,
    `${markdown}\n<img src="assets/social-preview.png" onerror="alert(1)">\n`,
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('unreviewed embedded HTML')));
});

test('the unsafe portfolio link stays out until its publication gate is cleared', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  await writeFile(path, `${markdown}\n[Portfolio](https://ogamlabs.com)\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('forbidden pre-publication link')));
});

test('path traversal is rejected', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  await writeFile(path, `${markdown}\n[Private runbook](../runbook.md)\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('unsafe local reference')));
});

test('secret-like values are rejected', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  const secretLikeValue = ['sk', '1234567890abcdef1234567890abcdef'].join('-');
  await writeFile(path, `${markdown}\n${secretLikeValue}\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('secret-like value')));
});

test('database URLs with credentials are rejected', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  const credential = [
    'postgres',
    '://case-study:do-not-publish@db.internal/chollogas',
  ].join('');
  await writeFile(path, `${markdown}\n${credential}\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('secret-like value')));
});

test('unsupported outcome metrics are rejected', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  await writeFile(path, `${markdown}\nDownloads: 50000\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('unsupported outcome metric')));
});

test('unsupported internal scale claims are rejected', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  await writeFile(path, `${markdown}\nThe history is in the order of millions.\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('unsupported internal scale claim')));
});

test('the production-ingestion distinction cannot disappear', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'README.md');
  const markdown = await readFile(path, 'utf8');
  await writeFile(path, markdown.replace('It is **not the production architecture**.', 'It powers production.'));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('not the production architecture')));
});

test('the licence must keep code and product content separate', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'LICENSE.md');
  const licence = await readFile(path, 'utf8');
  await writeFile(path, licence.replace('All rights reserved', 'Public domain'));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('split between MIT code')));
});

test('the licence cannot claim ownership of third-party visual elements', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    'LICENSE.md',
    'claims no ownership',
    'claims ownership',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('split between MIT code')));
});

test('asset provenance cannot turn the authentic capture into generated UI', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'ASSET_PROVENANCE.md');
  const provenance = await readFile(path, 'utf8');
  await writeFile(path, provenance.replace(
    'No AI-generated product pixels',
    'AI-generated product pixels',
  ));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('authenticity')));
});

test('asset provenance cannot imply that the app has zero analytics', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    'ASSET_PROVENANCE.md',
    'It is not a claim of zero analytics',
    'It means zero analytics',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('authenticity')));
});

test('asset provenance must cover every reviewed capture', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'ASSET_PROVENANCE.md');
  const provenance = await readFile(path, 'utf8');
  await writeFile(path, provenance.replace(
    '`62026070ea8e6da556107fc7826e901963c69831d032cfaf2256c2ee21743b1d`',
    '`missing-reviewed-digest`',
  ));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('price-map.webp')));
});

test('public files cannot be executable', async (t) => {
  const fixture = await makeFixture(t);
  await chmod(join(fixture, 'README.md'), 0o755);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('public files must not be executable')));
});

test('symbolic links are rejected anywhere in the public tree', async (t) => {
  const fixture = await makeFixture(t);
  await symlink('../README.md', join(fixture, 'assets', 'linked-readme.md'));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('symbolic links are not allowed')));
});

test('secret-like values are rejected from unexpected public text files', async (t) => {
  const fixture = await makeFixture(t);
  const secretLikeValue = ['ghp', '1234567890abcdefghijklmnopqrst'].join('_');
  await writeFile(join(fixture, 'notes.txt'), `${secretLikeValue}\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('notes.txt') && error.includes('secret-like value')
  )));
});

test('unexpected files are rejected even when they contain no secret', async (t) => {
  const fixture = await makeFixture(t);
  await writeFile(join(fixture, 'internal-runbook.md'), 'No secrets here.\n');

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('internal-runbook.md') && error.includes('outside the public allowlist')
  )));
});

test('ignored tool directories are only allowed at the repository root', async (t) => {
  const fixture = await makeFixture(t);
  const nestedDirectory = join(fixture, 'assets', 'node_modules');
  await mkdir(nestedDirectory);
  await writeFile(join(nestedDirectory, 'private-notes.md'), 'Not public.\n');

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => (
    error.includes('assets/node_modules') && error.includes('outside the public allowlist')
  )));
});

test('the workflow cannot use pull_request_target', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    '  pull_request:',
    '  pull_request_target:',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('pull_request_target is not allowed')));
});

test('workflow events stay limited to push and pull_request', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    '  pull_request:',
    '  schedule:',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('events must be exactly')));
});

test('workflow branch scopes cannot drift', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    '      - "feature/**"',
    '      - "hotfix/**"',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('push branches must be')));
});

test('the workflow cannot request write permissions', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    '  contents: read',
    '  contents: write',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('write permissions are not allowed')));
});

test('workflow actions must use full commit SHAs', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
    'actions/setup-node@v7',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('full 40-character commit SHA')));
});

test('workflow actions must stay on the allowlist', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
    'example/setup-node@820762786026740c76f36085b0efc47a31fe5020',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('is not allowlisted')));
});

test('checkout cannot persist repository credentials', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    'persist-credentials: false',
    'persist-credentials: true',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('persist-credentials: false')));
});

test('the workflow uses the reviewed Node.js major version', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    'node-version: 24',
    'node-version: 22',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('must select Node.js 24')));
});

test('the workflow keeps both validation commands', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    '.github/workflows/case-study-check.yml',
    'run: npm run validate',
    'run: npm run lint',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('run command for npm run validate')));
});

test('package scripts cannot redirect the reviewed workflow commands', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    'package.json',
    'node scripts/validate-case-study.mjs',
    'node scripts/other-validator.mjs',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('reviewed commands exactly')));
});

test('the validator stays dependency-free', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, 'package.json');
  const packageDefinition = JSON.parse(await readFile(path, 'utf8'));
  packageDefinition.dependencies = { example: '1.0.0' };
  await writeFile(path, `${JSON.stringify(packageDefinition, null, 2)}\n`);

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('must remain dependency-free')));
});

test('security reporting remains private and scoped to the public repository', async (t) => {
  const fixture = await makeFixture(t);
  await replaceFixtureText(
    fixture,
    'SECURITY.md',
    'please do not open a public issue',
    'please open a public issue',
  );

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('private, repository-scoped reporting')));
});
