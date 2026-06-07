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

function findHasOnlyList(source, functionMarker) {
  const fnStart = source.indexOf(functionMarker);
  if (fnStart === -1) {
    throw new Error('Function marker tidak ditemukan: ' + functionMarker);
  }

  const hasOnlyStart = source.indexOf('hasOnly([', fnStart);
  if (hasOnlyStart === -1) {
    throw new Error('hasOnly([ tidak ditemukan setelah marker: ' + functionMarker);
  }

  const listStart = source.indexOf('[', hasOnlyStart);
  const listEnd = source.indexOf('])', listStart);

  if (listStart === -1 || listEnd === -1) {
    throw new Error('List hasOnly tidak lengkap untuk marker: ' + functionMarker);
  }

  return { listStart, listEnd };
}

function addFieldsToHasOnly(source, functionMarker, fields, indent = '          ') {
  const { listStart, listEnd } = findHasOnlyList(source, functionMarker);
  const listContent = source.slice(listStart + 1, listEnd);

  const missing = fields.filter((field) => !listContent.includes("'" + field + "'"));

  if (missing.length === 0) {
    console.log('Skip, fields sudah ada di: ' + functionMarker);
    return source;
  }

  const insertion = missing.map((field) => indent + "'" + field + "',").join('\n') + '\n';

  return source.slice(0, listEnd) + insertion + source.slice(listEnd);
}

function insertBeforeRuleTerminator(source, marker, uniqueToken, insertion, label) {
  if (source.includes(uniqueToken)) {
    console.log('Skip, sudah ada: ' + uniqueToken);
    return source;
  }

  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Marker tidak ditemukan untuk ' + label + ': ' + marker);
  }

  const semiIndex = source.indexOf(';', markerIndex);
  if (semiIndex === -1) {
    throw new Error('Rule terminator ; tidak ditemukan untuk ' + label);
  }

  return source.slice(0, semiIndex) + insertion + source.slice(semiIndex);
}

const rulesPath = 'firestore.rules';
let rules = read(rulesPath);

const userProfessionalFields = [
  'projectName',
  'clientType',
  'primaryGenre',
  'mainNeed',
  'memberCount',
  'preferredDuration',
  'preferredTime',
  'preferredDays',
  'socialLink',
  'gearNotes',
  'invoiceName',
  'paymentPreference',
  'clientLevel'
];

const userProfessionalUpdateFields = [
  ...userProfessionalFields,
  'profileUpdatedAt'
];

const bookingRequestProfessionalFields = [
  'projectName',
  'clientType',
  'primaryGenre',
  'mainNeed',
  'memberCount',
  'preferredDuration',
  'preferredTime',
  'preferredDays',
  'socialLink',
  'gearNotes',
  'invoiceName',
  'paymentPreference',
  'clientLevel'
];

/**
 * 1) Allow professional fields during client user document create.
 * This is needed because useAuthStore now creates new client profiles with professional defaults.
 */
rules = addFieldsToHasOnly(
  rules,
  'function selfUserCreateShape()',
  userProfessionalFields,
  '          '
);

/**
 * 2) Allow professional fields during self profile update.
 * This fixes: Profil gagal disimpan: Missing or insufficient permissions.
 */
rules = addFieldsToHasOnly(
  rules,
  'function selfUserSafeUpdate()',
  userProfessionalUpdateFields,
  '          '
);

/**
 * 3) Add safety gate for clientLevel.
 * Client can keep/create New, but cannot self-promote to VIP/Regular/Partner via profile page.
 */
rules = insertBeforeRuleTerminator(
  rules,
  "          || request.resource.data.email == request.auth.token.email\n        )",
  'clientLevel == resource.data.clientLevel',
  [
    '',
    '        && (',
    "          !request.resource.data.diff(resource.data).affectedKeys().hasAny(['clientLevel'])",
    "          || request.resource.data.clientLevel == resource.data.clientLevel",
    "          || request.resource.data.clientLevel == 'New'",
    '        )'
  ].join('\n'),
  'selfUserSafeUpdate clientLevel guard'
);

/**
 * 4) Allow professional metadata in public booking request create.
 */
rules = addFieldsToHasOnly(
  rules,
  'allow create: if signedInGuestOrStaff()',
  bookingRequestProfessionalFields,
  '          '
);

/**
 * 5) Add optional type checks for professional booking request metadata.
 */
const bookingChecks = [
  '',
  "        && (!('projectName' in request.resource.data) || request.resource.data.projectName is string)",
  "        && (!('clientType' in request.resource.data) || request.resource.data.clientType is string)",
  "        && (!('primaryGenre' in request.resource.data) || request.resource.data.primaryGenre is string)",
  "        && (!('mainNeed' in request.resource.data) || request.resource.data.mainNeed is string)",
  "        && (!('memberCount' in request.resource.data) || request.resource.data.memberCount is string)",
  "        && (!('preferredDuration' in request.resource.data) || request.resource.data.preferredDuration is string)",
  "        && (!('preferredTime' in request.resource.data) || request.resource.data.preferredTime is string)",
  "        && (!('preferredDays' in request.resource.data) || request.resource.data.preferredDays is string)",
  "        && (!('socialLink' in request.resource.data) || request.resource.data.socialLink is string)",
  "        && (!('gearNotes' in request.resource.data) || request.resource.data.gearNotes is string)",
  "        && (!('invoiceName' in request.resource.data) || request.resource.data.invoiceName is string)",
  "        && (!('paymentPreference' in request.resource.data) || request.resource.data.paymentPreference is string)",
  "        && (!('clientLevel' in request.resource.data) || request.resource.data.clientLevel is string)"
].join('\n');

rules = insertBeforeRuleTerminator(
  rules,
  "        && (!('createdBy' in request.resource.data) || request.resource.data.createdBy is string)",
  "projectName' in request.resource.data) || request.resource.data.projectName is string",
  bookingChecks,
  'bookingRequests professional field type checks'
);

const requiredSnippets = [
  "'projectName'",
  "'clientType'",
  "'primaryGenre'",
  "'profileUpdatedAt'",
  "request.resource.data.projectName is string",
  "clientLevel == resource.data.clientLevel"
];

for (const snippet of requiredSnippets) {
  if (!rules.includes(snippet)) {
    throw new Error('firestore.rules belum lengkap. Missing: ' + snippet);
  }
}

write(rulesPath, rules);

const audit = [
  '37 Music Studio — Phase 7.0N Firestore Rules for Professional Profile',
  'Generated: ' + new Date().toISOString(),
  '',
  'Files touched:',
  '- firestore.rules',
  '',
  'Fixes:',
  '- Allows client profile save for professional profile fields.',
  '- Allows profileUpdatedAt self update.',
  '- Allows new client user document to include professional default fields.',
  '- Allows bookingRequests to carry professional metadata from client profile.',
  '- Adds booking request type checks for professional metadata.',
  '- Prevents client self-promotion by guarding clientLevel update.',
].join('\n');

fs.writeFileSync(abs('phase70n-professional-profile-firestore-rules-audit.txt'), audit, 'utf8');

console.log('Audit dibuat: phase70n-professional-profile-firestore-rules-audit.txt');
console.log('\nPhase 7.0N rules patch selesai bro.');
console.log('Sekarang deploy rules: firebase deploy --only firestore:rules');