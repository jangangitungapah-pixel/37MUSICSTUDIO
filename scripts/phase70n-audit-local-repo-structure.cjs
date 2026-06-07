const fs = require('fs');
const path = require('path');

const root = process.cwd();

function abs(relPath) {
  return path.join(root, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function read(relPath) {
  if (!exists(relPath)) return '';
  return fs.readFileSync(abs(relPath), 'utf8');
}

function linesOf(content) {
  return content.split(/\r?\n/);
}

function findAllLines(content, patterns) {
  const lines = linesOf(content);
  const result = [];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      const matched = typeof pattern === 'string'
        ? line.includes(pattern)
        : pattern.test(line);

      if (matched) {
        result.push({
          line: index + 1,
          text: line,
          pattern: String(pattern),
        });
        break;
      }
    }
  });

  return result;
}

function getSnippet(content, lineNumber, before = 6, after = 12) {
  const lines = linesOf(content);
  const start = Math.max(0, lineNumber - before - 1);
  const end = Math.min(lines.length, lineNumber + after);

  return lines
    .slice(start, end)
    .map((line, index) => {
      const realLine = start + index + 1;
      return String(realLine).padStart(4, ' ') + ' | ' + line;
    })
    .join('\n');
}

function extractBlockByMarker(content, marker, label, before = 4, after = 24) {
  const lineIndex = linesOf(content).findIndex((line) => line.includes(marker));

  if (lineIndex === -1) {
    return [
      '--- ' + label + ' ---',
      'NOT FOUND: ' + marker,
      '',
    ].join('\n');
  }

  return [
    '--- ' + label + ' ---',
    getSnippet(content, lineIndex + 1, before, after),
    '',
  ].join('\n');
}

function section(title) {
  return [
    '',
    '============================================================',
    title,
    '============================================================',
    '',
  ].join('\n');
}

function summarizeFile(relPath, content) {
  const lineCount = linesOf(content).length;
  const sizeKb = Buffer.byteLength(content, 'utf8') / 1024;

  return [
    'File: ' + relPath,
    'Exists: ' + exists(relPath),
    'Lines: ' + lineCount,
    'Size: ' + sizeKb.toFixed(1) + ' KB',
    '',
  ].join('\n');
}

function tokenStatus(content, tokens) {
  return tokens
    .map((token) => {
      const count = (content.match(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      return '- ' + token + ': ' + (count > 0 ? 'YES (' + count + ')' : 'NO');
    })
    .join('\n');
}

const files = {
  customers: 'src/pages/CustomersPage.jsx',
  customersCss: 'src/pages/CustomersPage.css',
  authStore: 'src/store/useAuthStore.js',
  customerStore: 'src/store/useCustomerStore.js',
  clientProfile: 'src/pages/ClientProfilePage.jsx',
  publicCalendar: 'src/pages/PublicCalendarPage.jsx',
  clientPortalCss: 'src/pages/ClientPortal.css',
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, relPath]) => [key, read(relPath)])
);

let report = '';
report += '37 Music Studio — Local Repo Audit for Phase 7.0N\n';
report += 'Generated: ' + new Date().toISOString() + '\n';
report += 'Root: ' + root + '\n';

report += section('FILE SUMMARY');
for (const relPath of Object.values(files)) {
  report += summarizeFile(relPath, read(relPath));
}

report += section('CUSTOMERS PAGE — KEY TOKENS');
report += tokenStatus(contents.customers, [
  'customerSchema',
  'z.object',
  'validateWithZod',
  'useForm',
  'defaultValues',
  'handleOpenNew',
  'handleOpenEdit',
  'handleLinkClientAccount',
  'clientTypeOptions',
  'projectName',
  'Professional Profile',
  'Booking Preference',
  'customer-pro-card',
  'customer-pro-tags',
  'customer-pro-form-section',
  'Music2',
]) + '\n';

report += section('CUSTOMERS PAGE — MARKER LINE MAP');
const customerMarkers = findAllLines(contents.customers, [
  'customerSchema',
  'z.object',
  'validateWithZod',
  'useForm',
  'defaultValues',
  'handleOpenNew',
  'handleOpenEdit',
  'handleLinkClientAccount',
  'Fuse',
  'keys:',
  'Membership Tier',
  'Section: Status',
  'Section: Kontak',
  'Section: Studio Profile',
  'Section: Booking Preference',
  'Professional Profile',
  '<Modal',
]);

if (customerMarkers.length === 0) {
  report += 'No markers found.\n';
} else {
  report += customerMarkers
    .map((item) => String(item.line).padStart(4, ' ') + ' | ' + item.text.trim())
    .join('\n') + '\n';
}

report += section('CUSTOMERS PAGE — IMPORTANT SNIPPETS');
report += extractBlockByMarker(contents.customers, 'z.object', 'Schema around z.object', 8, 28);
report += extractBlockByMarker(contents.customers, 'useForm({', 'useForm defaultValues', 4, 36);
report += extractBlockByMarker(contents.customers, 'const handleOpenNew', 'handleOpenNew', 4, 28);
report += extractBlockByMarker(contents.customers, 'const handleOpenEdit', 'handleOpenEdit', 4, 36);
report += extractBlockByMarker(contents.customers, 'const handleLinkClientAccount', 'handleLinkClientAccount', 4, 40);
report += extractBlockByMarker(contents.customers, 'keys:', 'Fuse search keys', 4, 16);
report += extractBlockByMarker(contents.customers, 'customer-name-cell', 'Customer table name cell', 8, 24);
report += extractBlockByMarker(contents.customers, 'Detail Sidebar', 'Detail sidebar start', 8, 40);
report += extractBlockByMarker(contents.customers, 'Membership Tier', 'Membership tier marker', 10, 24);
report += extractBlockByMarker(contents.customers, 'Section: Status & VIP', 'Modal Status & VIP marker', 12, 36);

report += section('AUTH STORE — KEY TOKENS');
report += tokenStatus(contents.authStore, [
  'updateUserProfile',
  'extraProfileData',
  'projectName',
  'clientType',
  'primaryGenre',
  'mainNeed',
  'profileUpdatedAt',
  'linkedCustomerId',
]) + '\n';
report += extractBlockByMarker(contents.authStore, 'updateUserProfile', 'Auth updateUserProfile', 4, 80);

report += section('CLIENT PROFILE PAGE — KEY TOKENS');
report += tokenStatus(contents.clientProfile, [
  'Professional client profile',
  'Studio Profile',
  'Booking Preference',
  'Simpan Professional Profile',
  'projectName',
  'clientType',
  'primaryGenre',
  'mainNeed',
  'profileReadinessItems',
  'completionScore',
]) + '\n';
report += extractBlockByMarker(contents.clientProfile, 'profileReadinessItems', 'Client profile readiness', 6, 34);
report += extractBlockByMarker(contents.clientProfile, 'Studio Profile', 'Client profile Studio Profile section', 10, 60);
report += extractBlockByMarker(contents.clientProfile, 'Booking Preference', 'Client profile Booking Preference section', 10, 70);

report += section('PUBLIC CALENDAR — KEY TOKENS');
report += tokenStatus(contents.publicCalendar, [
  'clientType: userProfile?.clientType',
  'primaryGenre: userProfile?.primaryGenre',
  'gearNotes: userProfile?.gearNotes',
  'projectName: userProfile?.projectName',
  'addRequest',
  'clientUid',
  'linkedCustomerId',
]) + '\n';
report += extractBlockByMarker(contents.publicCalendar, 'await addRequest({', 'Public calendar request payload', 8, 52);

report += section('CUSTOMER STORE — KEY TOKENS');
report += tokenStatus(contents.customerStore, [
  'buildCustomerMetadataPatch',
  'projectName',
  'clientType',
  'primaryGenre',
  'mainNeed',
  'gearNotes',
  'paymentPreference',
  'clientLevel',
  'ensureCustomerFromBooking',
]) + '\n';
report += extractBlockByMarker(contents.customerStore, 'buildCustomerMetadataPatch', 'Customer metadata patch', 4, 70);
report += extractBlockByMarker(contents.customerStore, 'ensureCustomerFromBooking', 'Ensure customer from booking', 4, 90);

report += section('CSS — KEY TOKENS');
report += 'ClientPortal.css:\n';
report += tokenStatus(contents.clientPortalCss, [
  '37 PROFESSIONAL CLIENT PROFILE 7.0N',
  'client-profile-pro-layout',
  'client-profile-section-block',
  'client-id-meta-grid',
]) + '\n\n';

report += 'CustomersPage.css:\n';
report += tokenStatus(contents.customersCss, [
  '37 ADMIN CUSTOMER PROFESSIONAL PROFILE 7.0N',
  'customer-pro-tags',
  'professional-profile-section',
  'customer-pro-card',
  'customer-pro-form-section',
]) + '\n';

report += section('BACKUP FILES');
const backupFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    if (stat.isFile() && item.includes('.bak-')) {
      backupFiles.push(path.relative(root, full));
    }
  }
}
walk(abs('src'));
report += backupFiles.length
  ? backupFiles.slice(-80).join('\n') + '\n'
  : 'No .bak files found under src.\n';

const outputPath = abs('phase70n-local-repo-structure-audit.txt');
fs.writeFileSync(outputPath, report, 'utf8');

console.log(report);
console.log('\nAudit report saved to: phase70n-local-repo-structure-audit.txt');
console.log('\nNEXT: Paste the output from CUSTOMERS PAGE — IMPORTANT SNIPPETS, especially schema/useForm/handleOpenNew/handleOpenEdit/Modal markers.');