import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');

const DOCUMENTS = Object.freeze({
  'README.md': {
    sections: [
      '## 1. The real problem',
      '## 2. One product, not a set of demos',
      '## 3. Production architecture',
      '## 4. Four decisions that shaped the system',
      '## 5. Operating what I built',
      '## 6. Where the GitHub releases dataset fits',
      '## 7. What remains private',
      '## 8. What I would carry into the next product',
    ],
    proof: [
      '**Status:** CholloGas is live on the App Store with Spain and France support.',
      '| Official-source station records | **21,000+** |',
      '| App Store locales | **5** |',
      'It is **not the production architecture**.',
      'not downloads or revenue',
    ],
  },
  'README.es.md': {
    sections: [
      '## 1. El problema real',
      '## 2. Un producto, no una colección de demos',
      '## 3. Arquitectura de producción',
      '## 4. Cuatro decisiones que dieron forma al sistema',
      '## 5. Operar lo que construí',
      '## 6. Dónde encaja el dataset de GitHub Releases',
      '## 7. Lo que sigue siendo privado',
      '## 8. Lo que llevaría al siguiente producto',
    ],
    proof: [
      '**Estado:** CholloGas está disponible en la App Store con soporte para España',
      '| Registros de estaciones en fuentes oficiales | **+21.000** |',
      '| Idiomas en la App Store | **5** |',
      '**No es la arquitectura de producción.**',
      'descargas ni ingresos',
    ],
  },
});

const REQUIRED_LINKS = Object.freeze([
  'https://chollogas.ogamlabs.com',
  'https://apps.apple.com/es/app/chollogas-gasolineras-baratas/id6773014516',
  'https://api.ogamlabs.com/v2/metadata/countries',
  'https://datos.gob.es/es/catalogo/e05068001-instalaciones-de-suministro-de-combustibles-a-vehiculos-con-venta-publica',
  'https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/',
  'https://github.com/OgamLabs/MITECO-Historical-prices/releases',
  'LICENSE.md',
  'SECURITY.md',
  'ASSET_PROVENANCE.md',
]);

const FORBIDDEN_LINKS = Object.freeze([
  'https://ogamlabs.com',
]);

const ASSET_REQUIREMENTS = Object.freeze({
  'assets/product-overview.png': {
    width: 1200,
    height: 630,
    sha256: 'bba1137c60bcb093a5c010e78cd07e561498ff9e1aac617350f5c02595e21066',
  },
  'assets/price-history.webp': {
    width: 736,
    height: 1600,
    sha256: '863b1e5ed9c9d5e906da329abef81652f0d6f8081b63c0866fc3fe143e30adc9',
  },
  'assets/station-list.webp': {
    width: 736,
    height: 1600,
    sha256: 'b4b3df9ebc256f575be27bf312b022a1f0807f551fc42b5f7cbb17dded0f7f62',
  },
  'assets/price-map.webp': {
    width: 736,
    height: 1600,
    sha256: '62026070ea8e6da556107fc7826e901963c69831d032cfaf2256c2ee21743b1d',
  },
  'assets/route-stop.webp': {
    width: 736,
    height: 1600,
    sha256: '18309d95517b76d96019b49ce4abe6ec5d834bb0ae70fedb6a8e9cda436ab1a4',
  },
  'assets/social-preview.png': {
    width: 1280,
    height: 640,
    sha256: 'fb541e1d0cf7c2835b2512cf073306b9fc79efe57185ccdb33e33c9c99ba63be',
  },
});

const REQUIRED_ASSETS = Object.freeze(Object.keys(ASSET_REQUIREMENTS));

function markdownReferences(markdown) {
  const references = [];
  const markdownPattern = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of markdown.matchAll(markdownPattern)) {
    references.push({
      image: match[1] === '!',
      label: match[2].trim(),
      target: match[3].trim(),
    });
  }

  for (const match of markdown.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    references.push({ image: true, label: 'HTML image', target: match[1].trim() });
  }
  return references;
}

function localTarget(root, documentPath, target) {
  const cleanTarget = target.split('#', 1)[0].split('?', 1)[0];
  if (cleanTarget === '') {
    return null;
  }
  return resolve(root, normalize(join(dirname(documentPath), cleanTarget)));
}

function isWithin(root, target) {
  const pathFromRoot = relative(root, target);
  return pathFromRoot === '' || (!pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot));
}

function pngDimensions(data) {
  const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  if (
    data.length < 24
    || !signature.every((byte, index) => data[index] === byte)
    || data.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    return null;
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function webpDimensions(data) {
  if (
    data.length < 20
    || data.toString('ascii', 0, 4) !== 'RIFF'
    || data.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= data.length) {
    const chunkType = data.toString('ascii', offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (payload + chunkSize > data.length) {
      return null;
    }
    if (chunkType === 'VP8X' && chunkSize >= 10) {
      return {
        width: data.readUIntLE(payload + 4, 3) + 1,
        height: data.readUIntLE(payload + 7, 3) + 1,
      };
    }
    if (
      chunkType === 'VP8 '
      && chunkSize >= 10
      && data[payload + 3] === 0x9D
      && data[payload + 4] === 0x01
      && data[payload + 5] === 0x2A
    ) {
      return {
        width: data.readUInt16LE(payload + 6) & 0x3FFF,
        height: data.readUInt16LE(payload + 8) & 0x3FFF,
      };
    }
    if (chunkType === 'VP8L' && chunkSize >= 5 && data[payload] === 0x2F) {
      const bits = data.readUInt32LE(payload + 1);
      return {
        width: (bits & 0x3FFF) + 1,
        height: ((bits >> 14) & 0x3FFF) + 1,
      };
    }
    offset = payload + chunkSize + (chunkSize % 2);
  }
  return null;
}

async function validateLocalReference(root, documentPath, reference, errors) {
  const target = localTarget(root, documentPath, reference.target);
  if (!target || !isWithin(root, target)) {
    errors.add(`${documentPath}: unsafe local reference ${reference.target}`);
    return;
  }

  try {
    const targetStat = await lstat(target);
    if (targetStat.isSymbolicLink()) {
      errors.add(`${documentPath}: symbolic links are not allowed (${reference.target})`);
    } else if (!targetStat.isFile()) {
      errors.add(`${documentPath}: reference is not a regular file (${reference.target})`);
    }
  } catch {
    errors.add(`${documentPath}: missing local reference ${reference.target}`);
  }
}

function secretFinding(text) {
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bsk-[A-Za-z0-9]{16,}\b/,
    /\bAKIA[A-Z0-9]{16}\b/,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

export async function validateCaseStudy(root = DEFAULT_ROOT) {
  const caseStudyRoot = resolve(root);
  const errors = new Set();
  const referencedAssets = new Set();

  for (const [documentPath, requirements] of Object.entries(DOCUMENTS)) {
    let markdown;
    try {
      markdown = await readFile(join(caseStudyRoot, documentPath), 'utf8');
    } catch {
      errors.add(`${documentPath}: missing or unreadable`);
      continue;
    }

    for (const section of requirements.sections) {
      if (!markdown.includes(section)) {
        errors.add(`${documentPath}: missing required section "${section}"`);
      }
    }
    for (const proof of requirements.proof) {
      if (!markdown.includes(proof)) {
        errors.add(`${documentPath}: missing public-proof statement "${proof}"`);
      }
    }
    if (/(?:file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\)/i.test(markdown)) {
      errors.add(`${documentPath}: contains a machine-local path`);
    }
    if (secretFinding(markdown)) {
      errors.add(`${documentPath}: contains a secret-like value`);
    }
    if (/\b(?:downloads?|monthly active users|MAU|revenue|ARR|uptime|descargas|usuarios activos|ingresos)\s*[:=]\s*[\d,.]+/i.test(markdown)) {
      errors.add(`${documentPath}: contains an unsupported outcome metric`);
    }
    if (/\b(?:in the order of millions|en el orden de millones)\b/i.test(markdown)) {
      errors.add(`${documentPath}: contains an unsupported internal scale claim`);
    }
    if (/<(?:script|iframe)\b/i.test(markdown)) {
      errors.add(`${documentPath}: executable embedded HTML is not allowed`);
    }

    const references = markdownReferences(markdown);
    const targets = new Set(references.map(({ target }) => target));
    for (const requiredLink of REQUIRED_LINKS) {
      if (!targets.has(requiredLink)) {
        errors.add(`${documentPath}: missing required link ${requiredLink}`);
      }
    }
    for (const forbiddenLink of FORBIDDEN_LINKS) {
      if (targets.has(forbiddenLink)) {
        errors.add(`${documentPath}: forbidden pre-publication link ${forbiddenLink}`);
      }
    }
    for (const requiredAsset of REQUIRED_ASSETS) {
      if (!targets.has(requiredAsset)) {
        errors.add(`${documentPath}: missing required product capture ${requiredAsset}`);
      } else {
        referencedAssets.add(requiredAsset);
      }
    }

    for (const reference of references) {
      if (/^https:\/\//i.test(reference.target)) {
        if (reference.image) {
          errors.add(`${documentPath}: externally hosted images are not allowed`);
        }
        continue;
      }
      if (/^mailto:/i.test(reference.target)) {
        continue;
      }
      if (isAbsolute(reference.target) || /^[a-z][a-z0-9+.-]*:/i.test(reference.target)) {
        errors.add(`${documentPath}: unsafe or unsupported reference ${reference.target}`);
        continue;
      }
      await validateLocalReference(caseStudyRoot, documentPath, reference, errors);
    }
  }

  for (const assetPath of REQUIRED_ASSETS) {
    let data;
    try {
      const assetStat = await lstat(join(caseStudyRoot, assetPath));
      if (assetStat.isSymbolicLink() || !assetStat.isFile()) {
        errors.add(`${assetPath}: must be a regular file, not a symbolic link`);
        continue;
      }
      data = await readFile(join(caseStudyRoot, assetPath));
    } catch {
      errors.add(`${assetPath}: missing or unreadable`);
      continue;
    }

    const expected = ASSET_REQUIREMENTS[assetPath];
    const dimensions = assetPath.endsWith('.png')
      ? pngDimensions(data)
      : webpDimensions(data);
    if (!dimensions) {
      const format = assetPath.endsWith('.png') ? 'PNG' : 'WebP';
      errors.add(`${assetPath}: expected a valid ${format}`);
    } else if (dimensions.width !== expected.width || dimensions.height !== expected.height) {
      errors.add(
        `${assetPath}: expected ${expected.width}x${expected.height}, `
        + `found ${dimensions.width}x${dimensions.height}`,
      );
    }

    const digest = createHash('sha256').update(data).digest('hex');
    if (digest !== expected.sha256) {
      errors.add(`${assetPath}: SHA-256 does not match the reviewed visual asset`);
    }
    if (assetPath.endsWith('social-preview.png') && data.length > 1_000_000) {
      errors.add(`${assetPath}: must stay below the 1 MB GitHub social-preview limit`);
    }
  }

  let licence = '';
  try {
    licence = await readFile(join(caseStudyRoot, 'LICENSE.md'), 'utf8');
  } catch {
    errors.add('LICENSE.md: missing or unreadable');
  }
  if (!licence.includes('validation scripts and GitHub Actions workflow')
    || !licence.includes('All rights reserved')) {
    errors.add('LICENSE.md: must preserve the split between MIT code and protected content');
  }

  try {
    const provenance = await readFile(join(caseStudyRoot, 'ASSET_PROVENANCE.md'), 'utf8');
    if (!provenance.includes('first-party product captures')
      || !provenance.includes('No AI-generated product pixels')
      || !provenance.includes('Spanish-language product snapshot')
      || !provenance.includes('not a guarantee')
      || !provenance.includes('current real-world price')) {
      errors.add('ASSET_PROVENANCE.md: must preserve authenticity, privacy and temporal limits');
    }
    for (const [assetPath, requirement] of Object.entries(ASSET_REQUIREMENTS)) {
      if (!provenance.includes(`\`${assetPath}\``)
        || !provenance.includes(`${requirement.width}×${requirement.height} pixels`)
        || !provenance.includes(`\`${requirement.sha256}\``)) {
        errors.add(`ASSET_PROVENANCE.md: missing reviewed metadata for ${assetPath}`);
      }
    }
    if (/(?:file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\)/i.test(provenance)
      || secretFinding(provenance)) {
      errors.add('ASSET_PROVENANCE.md: contains a local path or secret-like value');
    }
  } catch {
    errors.add('ASSET_PROVENANCE.md: missing or unreadable');
  }

  try {
    const workflowPath = join(caseStudyRoot, '.github/workflows/case-study-check.yml');
    const workflowStat = await lstat(workflowPath);
    if (workflowStat.isSymbolicLink() || !workflowStat.isFile()) {
      errors.add('case-study-check.yml: must be a regular file, not a symbolic link');
    } else {
      const workflow = await readFile(workflowPath, 'utf8');
      if (!workflow.includes('permissions:\n  contents: read')
        || !workflow.includes('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1')
        || !workflow.includes('persist-credentials: false')) {
        errors.add('case-study-check.yml: checkout must be pinned and run with read-only permissions');
      }
    }
  } catch {
    errors.add('case-study-check.yml: missing or unreadable');
  }

  return {
    documents: Object.keys(DOCUMENTS).length,
    errors: [...errors].sort(),
    referencedAssets: [...referencedAssets].sort(),
  };
}

async function main() {
  const result = await validateCaseStudy();
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(
    `Validated ${result.documents} case-study documents and `
    + `${result.referencedAssets.length} local product captures.`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
