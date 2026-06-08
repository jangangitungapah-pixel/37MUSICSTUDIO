const fs = require('fs');
const path = require('path');

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

function abs(relPath) {
  return path.join(root, relPath);
}

function read(relPath) {
  const fullPath = abs(relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error('File tidak ditemukan: ' + relPath);
  }

  return fs.readFileSync(fullPath, 'utf8').replace(/\r\n/g, '\n');
}

function backup(relPath) {
  const fullPath = abs(relPath);
  if (!fs.existsSync(fullPath)) return;

  const backupPath = fullPath + '.bak-' + stamp;
  fs.copyFileSync(fullPath, backupPath);
  console.log('Backup dibuat: ' + path.relative(root, backupPath));
}

function write(relPath, content) {
  backup(relPath);
  fs.writeFileSync(abs(relPath), content.replace(/\r?\n/g, '\n'), 'utf8');
  console.log('Updated: ' + relPath);
}

const pagePath = 'src/pages/PublicCalendarPage.jsx';
let page = read(pagePath);

if (!page.includes('const getPublicPhotoCaption =')) {
  throw new Error('Helper getPublicPhotoCaption tidak ditemukan.');
}

/**
 * Repair broken regex caused by previous import cleanup script.
 * Broken:
 *   /\d{6
 * }/.test(rawCaption)
 *
 * Correct:
 *   /\d{6,}/.test(rawCaption)
 */
page = page.replace(
  /\/\\d\{6\s*\n\s*\}\/\.test\(rawCaption\)/g,
  '/\\\\d{6,}/.test(rawCaption)'
);

/**
 * Safety: if somehow the line still has a malformed digit regex,
 * rewrite the whole helper block with a clean version.
 */
if (/\/\\d\{6\s*\n/.test(page) || page.includes('/\\d{6\n')) {
  page = page.replace(
    /const getPublicPhotoCaption = \(photo, index = 0\) => \{[\s\S]*?\n\};/,
    `const getPublicPhotoCaption = (photo, index = 0) => {
  const rawCaption = String(photo?.caption || '').trim();
  const looksLikeFileName =
    /\\d{6,}/.test(rawCaption) ||
    /\\.(jpg|jpeg|png|webp|gif)$/i.test(rawCaption) ||
    rawCaption.split(/\\s+/).length > 6;

  if (!rawCaption || rawCaption.length > 52 || looksLikeFileName) {
    return 'Studio angle ' + String(index + 1).padStart(2, '0');
  }

  return rawCaption;
};`
  );
}

/**
 * Tidy blank lines inside lucide import after unused icon removal.
 */
page = page.replace(
  /import \{([\s\S]*?)\} from 'lucide-react';/,
  (match, body) => {
    const items = body
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return `import {
  ${items.join(',\n  ')},
} from 'lucide-react';`;
  }
);

/**
 * Safety checks.
 */
if (page.includes('/\\d{6\n') || /\/\\d\{6\s*\n/.test(page)) {
  throw new Error('Regex caption masih patah.');
}

if (!page.includes('/\\d{6,}/.test(rawCaption)')) {
  throw new Error('Regex caption clean belum ditemukan.');
}

[
  'CheckCircle2',
  'Music2',
  'Sparkles',
  'UserRound',
].forEach((icon) => {
  if (new RegExp(`\\b${icon}\\b`).test(page)) {
    throw new Error('Unused icon masih ada: ' + icon);
  }
});

if (!page.includes('pc-modern')) {
  throw new Error('PublicCalendarPage.jsx bukan versi Tailwind rewrite.');
}

write(pagePath, page);

const audit = [
  '37 Music Studio — Phase 8.1A Public Calendar Parse Regex Fix',
  'Generated: ' + new Date().toISOString(),
  '',
  'Files touched:',
  '- src/pages/PublicCalendarPage.jsx',
  '',
  'Fixes:',
  '- Repaired broken regex in getPublicPhotoCaption.',
  '- Normalized lucide-react import formatting.',
  '- Kept unused icon imports removed.',
].join('\n');

fs.writeFileSync(abs('phase81a-fix-public-calendar-parse-regex-audit.txt'), audit, 'utf8');

console.log('Audit dibuat: phase81a-fix-public-calendar-parse-regex-audit.txt');
console.log('Phase 8.1A-PARSE-FIX selesai. Lanjut otomatis: syntax check -> lint -> test -> build -> git commit -> git push');