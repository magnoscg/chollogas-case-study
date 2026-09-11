import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');

const WORKFLOW_PATH = '.github/workflows/case-study-check.yml';
const IGNORED_TREE_DIRECTORIES = Object.freeze(new Set([
  '.git',
  'coverage',
  'node_modules',
]));
const ALLOWED_PUBLIC_DIRECTORIES = Object.freeze(new Set([
  '.github',
  '.github/workflows',
  'assets',
  'scripts',
]));
const ALLOWED_PUBLIC_FILES = Object.freeze(new Set([
  '.gitattributes',
  '.gitignore',
  '.github/workflows/case-study-check.yml',
  'ASSET_PROVENANCE.md',
  'LICENSE.md',
  'README.es.md',
  'README.md',
  'SECURITY.md',
  'assets/ogamlabs-signature.svg',
  'assets/price-history.webp',
  'assets/price-map.webp',
  'assets/product-overview.png',
  'assets/route-deficit.webp',
  'assets/route-range.webp',
  'assets/route-stop.webp',
  'assets/social-preview.png',
  'assets/station-list.webp',
  'package.json',
  'scripts/validate-case-study.mjs',
  'scripts/validate-case-study.test.mjs',
]));
const ALLOWED_WORKFLOW_ACTIONS = Object.freeze({
  'actions/checkout': '3d3c42e5aac5ba805825da76410c181273ba90b1',
  'actions/setup-node': '820762786026740c76f36085b0efc47a31fe5020',
});
const REQUIRED_WORKFLOW_COMMANDS = Object.freeze([
  'npm test',
  'npm run validate',
]);
const EXPECTED_PACKAGE_SCRIPTS = Object.freeze({
  test: 'node --test scripts/validate-case-study.test.mjs',
  validate: 'node scripts/validate-case-study.mjs',
});

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
      'The hero combines an authentic Spanish-language product capture with the',
      'The decision is intentionally progressive: quantify the vehicle\'s usable range,',
      '11,492 records in the',
      '21,295 station records',
      'server-side; the request is unauthenticated.',
      'station IDs and personal identifiers are not included in TelemetryDeck events,',
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
      'La portada combina una captura auténtica del producto en español con el alcance',
      'La decisión avanza de forma deliberada: cuantifica la autonomía útil del',
      '11.492 registros en',
      '21.295 registros de estación',
      'se ejecuta en el servidor; la petición no está autenticada.',
      'identificadores de estación ni identificadores personales: se limitan a acciones',
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
    sha256: '3e9b14ba4d8135f5cbff7d29f6fd74e868768bc70bcacca98db8a8dc8d66a840',
  },
  'assets/ogamlabs-signature.svg': {
    width: 1024,
    height: 320,
    sha256: '7e3f7eb423c9d5a4add06ec6eff00b32fe60ee9f697151b824cd7f83b1b6ce7a',
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
  'assets/route-range.webp': {
    width: 736,
    height: 1600,
    sha256: '3b999eba4c88176aa54005df584161b039befb42f42ec4fc3d9e134472a77150',
  },
  'assets/route-deficit.webp': {
    width: 736,
    height: 1600,
    sha256: 'b412274bd34d494bb4b3fe7b3f4b50673effa9f32f3bea5411948bf06a3df207',
  },
  'assets/social-preview.png': {
    width: 1280,
    height: 640,
    sha256: 'd175169f0df5e1cb9b6605f1f114af27594c41beb4751152c26e35f11deeb4d0',
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

function svgDimensions(data) {
  const svg = data.toString('utf8');
  const openingTag = svg.match(/<svg\b[^>]*>/i)?.[0];
  if (!openingTag) {
    return null;
  }

  const width = openingTag.match(/\bwidth=["']([0-9]+(?:\.[0-9]+)?)(?:px)?["']/i)?.[1];
  const height = openingTag.match(/\bheight=["']([0-9]+(?:\.[0-9]+)?)(?:px)?["']/i)?.[1];
  const viewBox = openingTag.match(/\bviewBox=["']([^"']+)["']/i)?.[1]
    ?.trim()
    .split(/\s+/)
    .map(Number);
  if (!width || !height || viewBox?.length !== 4 || viewBox.some(Number.isNaN)) {
    return null;
  }

  const dimensions = { width: Number(width), height: Number(height) };
  if (viewBox[0] !== 0
    || viewBox[1] !== 0
    || viewBox[2] !== dimensions.width
    || viewBox[3] !== dimensions.height) {
    return null;
  }
  return dimensions;
}

function hasUnsafeSVGContent(data) {
  const svg = data.toString('utf8');
  return /<script\b|<foreignObject\b|<!ENTITY|\son[a-z]+\s*=|(?:href|xlink:href)\s*=|url\s*\(/i.test(svg);
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
    /\bAIza[0-9A-Za-z_-]{35}\b/,
    /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/,
    /\b(?:postgres(?:ql)?|mysql):\/\/[^:\s/]+:[^@\s]+@/i,
    /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]{20,}/,
    /\b(?:CF_API_TOKEN|CLOUDFLARE_API_TOKEN|DATABASE_URL|ADMIN_PASSWORD)\s*=\s*["']?[^"'\s<]{8,}/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function isPublicTextPath(path) {
  return path.endsWith('.gitignore')
    || ['.json', '.md', '.mjs', '.svg', '.txt', '.yaml', '.yml'].includes(extname(path));
}

function workflowCodeLines(workflow) {
  return workflow
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, '').replace(/\s+$/, ''));
}

function indentation(line) {
  return line.match(/^\s*/)[0].length;
}

function topLevelBlockLines(lines, header) {
  const start = lines.findIndex((line) => line === header);
  if (start === -1) {
    return [];
  }

  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() !== '' && indentation(line) === 0) {
      break;
    }
    end += 1;
  }
  return lines.slice(start + 1, end);
}

function nestedBlockLines(lines, exactLine) {
  const start = lines.findIndex((line) => line === exactLine);
  if (start === -1) {
    return [];
  }

  const blockIndent = indentation(lines[start]);
  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() !== '' && indentation(line) <= blockIndent) {
      break;
    }
    end += 1;
  }
  return lines.slice(start + 1, end);
}

function actionStepLines(lines, actionReference) {
  const actionIndex = lines.findIndex(
    (line) => line.trim() === `uses: ${actionReference}`,
  );
  if (actionIndex === -1) {
    return [];
  }

  const stepIndent = Math.max(0, indentation(lines[actionIndex]) - 2);
  let end = actionIndex + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() !== '' && indentation(line) <= stepIndent) {
      break;
    }
    end += 1;
  }
  return lines.slice(actionIndex, end);
}

function hasReadOnlyTopLevelPermissions(lines) {
  const permissionHeaders = lines.filter((line) => line.trim() === 'permissions:');
  if (permissionHeaders.length !== 1) {
    return false;
  }

  const entries = topLevelBlockLines(lines, 'permissions:')
    .filter((line) => line.trim() !== '')
    .map((line) => line.trim());
  return entries.length === 1 && entries[0] === 'contents: read';
}

function branchNames(blockLines) {
  return blockLines.flatMap((line) => {
    const match = line.trim().match(/^-\s+["']?([^"']+?)["']?$/);
    return match ? [match[1]] : [];
  });
}

function sameMembers(actual, expected) {
  return actual.length === expected.length
    && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

function validateWorkflowEvents(lines, errors) {
  const onBlock = topLevelBlockLines(lines, 'on:');
  const events = onBlock.flatMap((line) => {
    if (indentation(line) !== 2) {
      return [];
    }
    const match = line.match(/^\s{2}([A-Za-z_][A-Za-z0-9_-]*):\s*$/);
    return match ? [match[1]] : [];
  });
  if (!sameMembers(events, ['push', 'pull_request'])) {
    errors.add(`${WORKFLOW_PATH}: events must be exactly push and pull_request`);
  }

  const pushBranches = branchNames(nestedBlockLines(lines, '  push:'));
  if (!sameMembers(pushBranches, ['main', 'develop', 'feature/**'])) {
    errors.add(`${WORKFLOW_PATH}: push branches must be main, develop and feature/**`);
  }

  const pullRequestBranches = branchNames(nestedBlockLines(lines, '  pull_request:'));
  if (!sameMembers(pullRequestBranches, ['main', 'develop'])) {
    errors.add(`${WORKFLOW_PATH}: pull_request branches must be main and develop`);
  }
}

function validateWorkflowText(workflow, errors) {
  const lines = workflowCodeLines(workflow);
  validateWorkflowEvents(lines, errors);

  if (lines.some((line) => /^\s*pull_request_target\s*:/.test(line))) {
    errors.add(`${WORKFLOW_PATH}: pull_request_target is not allowed`);
  }
  if (!hasReadOnlyTopLevelPermissions(lines)) {
    errors.add(`${WORKFLOW_PATH}: top-level permissions must be exactly contents: read`);
  }
  if (lines.some((line) => (
    /^\s*permissions\s*:\s*write-all\s*$/.test(line)
    || /^\s*[A-Za-z][A-Za-z0-9-]*\s*:\s*write\s*$/.test(line)
  ))) {
    errors.add(`${WORKFLOW_PATH}: write permissions are not allowed`);
  }

  const actionReferences = lines.flatMap((line) => {
    const match = line.match(/^\s*uses:\s*([^\s]+)\s*$/);
    return match ? [match[1]] : [];
  });
  for (const reference of actionReferences) {
    const match = reference.match(/^([^@\s]+)@([0-9a-f]{40})$/);
    if (!match) {
      errors.add(`${WORKFLOW_PATH}: action ${reference} must use a full 40-character commit SHA`);
      continue;
    }
    const [, action, sha] = match;
    if (ALLOWED_WORKFLOW_ACTIONS[action] !== sha) {
      errors.add(`${WORKFLOW_PATH}: action ${reference} is not allowlisted`);
    }
  }

  for (const [action, sha] of Object.entries(ALLOWED_WORKFLOW_ACTIONS)) {
    const expectedReference = `${action}@${sha}`;
    const occurrences = actionReferences.filter((reference) => reference === expectedReference).length;
    if (occurrences !== 1) {
      errors.add(`${WORKFLOW_PATH}: expected exactly one use of ${expectedReference}`);
    }
  }

  const checkoutReference = `actions/checkout@${ALLOWED_WORKFLOW_ACTIONS['actions/checkout']}`;
  const checkoutStep = actionStepLines(lines, checkoutReference);
  if (!checkoutStep.some((line) => line.trim() === 'persist-credentials: false')) {
    errors.add(`${WORKFLOW_PATH}: checkout must set persist-credentials: false`);
  }

  const setupNodeReference = `actions/setup-node@${ALLOWED_WORKFLOW_ACTIONS['actions/setup-node']}`;
  const setupNodeStep = actionStepLines(lines, setupNodeReference);
  if (!setupNodeStep.some((line) => line.trim() === 'node-version: 24')) {
    errors.add(`${WORKFLOW_PATH}: setup-node must select Node.js 24`);
  }

  const runCommands = lines.flatMap((line) => {
    const match = line.match(/^\s*run:\s*(.+?)\s*$/);
    return match ? [match[1]] : [];
  });
  for (const command of REQUIRED_WORKFLOW_COMMANDS) {
    if (runCommands.filter((candidate) => candidate === command).length !== 1) {
      errors.add(`${WORKFLOW_PATH}: expected exactly one run command for ${command}`);
    }
  }
}

async function validatePublicTree(root, errors, relativeDirectory = '') {
  let entries;
  try {
    entries = await readdir(join(root, relativeDirectory), { withFileTypes: true });
  } catch {
    errors.add(`${relativeDirectory || '.'}: public tree is unreadable`);
    return;
  }

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (relativeDirectory === ''
      && entry.isDirectory()
      && IGNORED_TREE_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const relativePath = relativeDirectory === ''
      ? entry.name
      : join(relativeDirectory, entry.name);
    let entryStat;
    try {
      entryStat = await lstat(join(root, relativePath));
    } catch {
      errors.add(`${relativePath}: unreadable public-tree entry`);
      continue;
    }

    if (entryStat.isSymbolicLink()) {
      errors.add(`${relativePath}: symbolic links are not allowed in the public tree`);
    } else if (entryStat.isDirectory()) {
      if (!ALLOWED_PUBLIC_DIRECTORIES.has(relativePath)) {
        errors.add(`${relativePath}: unexpected directory is outside the public allowlist`);
        continue;
      }
      await validatePublicTree(root, errors, relativePath);
    } else if (!entryStat.isFile()) {
      errors.add(`${relativePath}: public-tree entries must be regular files or directories`);
    } else {
      if (!ALLOWED_PUBLIC_FILES.has(relativePath)) {
        errors.add(`${relativePath}: unexpected file is outside the public allowlist`);
      }
      if ((entryStat.mode & 0o111) !== 0) {
        errors.add(`${relativePath}: public files must not be executable`);
      } else if (isPublicTextPath(relativePath)) {
        try {
          const text = await readFile(join(root, relativePath), 'utf8');
          if (secretFinding(text)) {
            errors.add(`${relativePath}: contains a secret-like value`);
          }
        } catch {
          errors.add(`${relativePath}: public text file is unreadable`);
        }
      }
    }
  }
}

export async function validateCaseStudy(root = DEFAULT_ROOT) {
  const caseStudyRoot = resolve(root);
  const errors = new Set();
  const referencedAssets = new Set();

  await validatePublicTree(caseStudyRoot, errors);

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
    if (/<\/?(?!(?:p|img)\b)[a-z][a-z0-9-]*\b/i.test(markdown)
      || /\son[a-z]+\s*=/i.test(markdown)
      || /javascript\s*:/i.test(markdown)) {
      errors.add(`${documentPath}: unreviewed embedded HTML is not allowed`);
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
    let dimensions;
    let format;
    if (assetPath.endsWith('.png')) {
      dimensions = pngDimensions(data);
      format = 'PNG';
    } else if (assetPath.endsWith('.webp')) {
      dimensions = webpDimensions(data);
      format = 'WebP';
    } else {
      dimensions = svgDimensions(data);
      format = 'SVG';
      if (hasUnsafeSVGContent(data)) {
        errors.add(`${assetPath}: SVG active or external content is not allowed`);
      }
    }
    if (!dimensions) {
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
    || !licence.includes('All rights reserved')
    || !licence.includes('Third-party trademarks')
    || !licence.includes('claims no ownership')) {
    errors.add('LICENSE.md: must preserve the split between MIT code and protected content');
  }

  try {
    const provenance = await readFile(join(caseStudyRoot, 'ASSET_PROVENANCE.md'), 'utf8');
    const normalizedProvenance = provenance.replace(/\s+/g, ' ');
    if (!normalizedProvenance.includes('first-party product captures')
      || !normalizedProvenance.includes('No AI-generated product pixels')
      || !normalizedProvenance.includes('Spanish-language product snapshot')
      || !normalizedProvenance.includes('no advertising or cross-app tracking')
      || !normalizedProvenance.includes('not a claim of zero analytics')
      || !normalizedProvenance.includes('exact first-party export')
      || !normalizedProvenance.includes('not recolored, stretched')
      || !normalizedProvenance.includes('claims no ownership')
      || !normalizedProvenance.includes('not a guarantee')
      || !normalizedProvenance.includes('current real-world price')) {
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
    const security = await readFile(join(caseStudyRoot, 'SECURITY.md'), 'utf8');
    if (!security.includes('please do not open a public issue')
      || !security.includes('mailto:soporte@ogamlabs.com')
      || !security.includes('Automated checks reject unexpected files')
      || !security.includes('does not contain the CholloGas application, backend, credentials')) {
      errors.add('SECURITY.md: must preserve private, repository-scoped reporting');
    }
    if (/(?:file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\)/i.test(security)
      || secretFinding(security)) {
      errors.add('SECURITY.md: contains a local path or secret-like value');
    }
  } catch {
    errors.add('SECURITY.md: missing or unreadable');
  }

  try {
    const packageText = await readFile(join(caseStudyRoot, 'package.json'), 'utf8');
    const packageDefinition = JSON.parse(packageText);
    if (packageDefinition.private !== true || packageDefinition.type !== 'module') {
      errors.add('package.json: must remain private and use ES modules');
    }
    const scripts = packageDefinition.scripts ?? {};
    if (!sameMembers(Object.keys(scripts), Object.keys(EXPECTED_PACKAGE_SCRIPTS))
      || Object.entries(EXPECTED_PACKAGE_SCRIPTS).some(
        ([name, command]) => scripts[name] !== command,
      )) {
      errors.add('package.json: validation scripts must match the reviewed commands exactly');
    }
    const dependencySections = [
      packageDefinition.dependencies,
      packageDefinition.devDependencies,
      packageDefinition.optionalDependencies,
      packageDefinition.peerDependencies,
    ].filter(Boolean);
    if (dependencySections.some((dependencies) => Object.keys(dependencies).length > 0)) {
      errors.add('package.json: this validator must remain dependency-free');
    }
  } catch {
    errors.add('package.json: missing, unreadable or invalid JSON');
  }

  try {
    const workflowPath = join(caseStudyRoot, WORKFLOW_PATH);
    const workflowStat = await lstat(workflowPath);
    if (workflowStat.isSymbolicLink() || !workflowStat.isFile()) {
      errors.add(`${WORKFLOW_PATH}: must be a regular file, not a symbolic link`);
    } else {
      const workflow = await readFile(workflowPath, 'utf8');
      validateWorkflowText(workflow, errors);
    }
  } catch {
    errors.add(`${WORKFLOW_PATH}: missing or unreadable`);
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
    + `${result.referencedAssets.length} reviewed local visual assets.`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
