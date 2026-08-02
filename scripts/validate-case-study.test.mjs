import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
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
];
const ASSET_FILES = [
  'product-overview.png',
  'price-history.webp',
  'station-list.webp',
  'price-map.webp',
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

test('the current bilingual case study satisfies its public-proof invariants', async () => {
  const result = await validateCaseStudy(PROJECT_ROOT);
  assert.deepEqual(result.errors, []);
  assert.equal(result.documents, 2);
  assert.equal(result.referencedAssets.length, 6);
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

test('the workflow must keep checkout pinned and credentials disabled', async (t) => {
  const fixture = await makeFixture(t);
  const path = join(fixture, '.github/workflows/case-study-check.yml');
  const workflow = await readFile(path, 'utf8');
  await writeFile(path, workflow.replace(
    'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    'actions/checkout@main',
  ));

  const result = await validateCaseStudy(fixture);
  assert(result.errors.some((error) => error.includes('checkout must be pinned')));
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
