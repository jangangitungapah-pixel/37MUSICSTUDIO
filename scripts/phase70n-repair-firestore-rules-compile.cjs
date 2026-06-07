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

function findMatchingBrace(source, openBraceIndex) {
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let i = openBraceIndex; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) return i;
  }

  return -1;
}

function replaceBraceBlock(source, marker, replacement, label) {
  const start = source.indexOf(marker);

  if (start === -1) {
    throw new Error('Marker tidak ditemukan untuk ' + label + ': ' + marker);
  }

  const openBrace = source.indexOf('{', start);

  if (openBrace === -1) {
    throw new Error('Open brace tidak ditemukan untuk ' + label);
  }

  const closeBrace = findMatchingBrace(source, openBrace);

  if (closeBrace === -1) {
    throw new Error('Close brace tidak ditemukan untuk ' + label);
  }

  return source.slice(0, start) + replacement + source.slice(closeBrace + 1);
}

const rulesPath = 'firestore.rules';
let rules = read(rulesPath);

const selfUserCreateShape = [
  '    function selfUserCreateShape() {',
  '      return request.resource.data.keys().hasOnly([',
  "          'uid',",
  "          'email',",
  "          'username',",
  "          'displayName',",
  "          'phone',",
  "          'photoURL',",
  "          'role',",
  "          'status',",
  "          'provider',",
  "          'linkedCustomerId',",
  "          'projectName',",
  "          'clientType',",
  "          'primaryGenre',",
  "          'mainNeed',",
  "          'memberCount',",
  "          'preferredDuration',",
  "          'preferredTime',",
  "          'preferredDays',",
  "          'socialLink',",
  "          'gearNotes',",
  "          'invoiceName',",
  "          'paymentPreference',",
  "          'clientLevel',",
  "          'createdAt',",
  "          'lastLoginAt'",
  '        ])',
  '        && request.resource.data.uid == request.auth.uid',
  '        && request.resource.data.email == request.auth.token.email',
  "        && request.resource.data.role == 'client'",
  "        && request.resource.data.status == 'active';",
  '    }'
].join('\n');

const selfUserSafeUpdate = [
  '    function selfUserSafeUpdate() {',
  '      return request.resource.data.diff(resource.data).affectedKeys().hasOnly([',
  "          'username',",
  "          'displayName',",
  "          'phone',",
  "          'photoURL',",
  "          'fcmTokens',",
  "          'requiresPasswordChange',",
  "          'passwordUpdatedAt',",
  "          'lastLoginAt',",
  "          'provider',",
  "          'email',",
  "          'projectName',",
  "          'clientType',",
  "          'primaryGenre',",
  "          'mainNeed',",
  "          'memberCount',",
  "          'preferredDuration',",
  "          'preferredTime',",
  "          'preferredDays',",
  "          'socialLink',",
  "          'gearNotes',",
  "          'invoiceName',",
  "          'paymentPreference',",
  "          'clientLevel',",
  "          'profileUpdatedAt'",
  '        ])',
  '        && (',
  "          !request.resource.data.diff(resource.data).affectedKeys().hasAny(['requiresPasswordChange'])",
  '          || request.resource.data.requiresPasswordChange == false',
  '        )',
  '        && (',
  "          !request.resource.data.diff(resource.data).affectedKeys().hasAny(['email'])",
  '          || request.resource.data.email == request.auth.token.email',
  '        )',
  '        && (',
  "          !request.resource.data.diff(resource.data).affectedKeys().hasAny(['clientLevel'])",
  '          || (',
  "            !('clientLevel' in resource.data)",
  "            && request.resource.data.clientLevel == 'New'",
  '          )',
  '          || (',
  "            'clientLevel' in resource.data",
  '            && request.resource.data.clientLevel == resource.data.clientLevel',
  '          )',
  '        );',
  '    }'
].join('\n');

const bookingRequestsBlock = [
  '    match /bookingRequests/{requestId} {',
  '      allow read: if hasPermission(\'calendar\')',
  '        || hasPermission(\'billing\')',
  '        || (',
  '          signedInNonAnonymous()',
  '          && resource.data.clientUid == request.auth.uid',
  '        );',
  '',
  '      allow create: if signedInGuestOrStaff()',
  '        && request.resource.data.keys().hasOnly([',
  "          'id',",
  "          'band',",
  "          'phone',",
  "          'date',",
  "          'hour',",
  "          'duration',",
  "          'estimatedPrice',",
  "          'source',",
  "          'status',",
  "          'createdAt',",
  "          'clientUid',",
  "          'clientEmail',",
  "          'clientName',",
  "          'clientPhone',",
  "          'linkedCustomerId',",
  "          'projectName',",
  "          'clientType',",
  "          'primaryGenre',",
  "          'mainNeed',",
  "          'memberCount',",
  "          'preferredDuration',",
  "          'preferredTime',",
  "          'preferredDays',",
  "          'socialLink',",
  "          'gearNotes',",
  "          'invoiceName',",
  "          'paymentPreference',",
  "          'clientLevel',",
  "          'createdBy'",
  '        ])',
  "        && request.resource.data.status == 'pending'",
  '        && request.resource.data.band is string',
  '        && request.resource.data.phone is string',
  '        && request.resource.data.date is string',
  '        && request.resource.data.hour is number',
  '        && request.resource.data.duration is number',
  '        && request.resource.data.estimatedPrice is number',
  '        && request.resource.data.source is string',
  '        && request.resource.data.createdAt is string',
  '        && (',
  "          !('clientUid' in request.resource.data)",
  "          || request.resource.data.clientUid == ''",
  '          || (',
  '            signedInNonAnonymous()',
  '            && request.resource.data.clientUid == request.auth.uid',
  '          )',
  '        )',
  "        && (!('clientEmail' in request.resource.data) || request.resource.data.clientEmail is string)",
  "        && (!('clientName' in request.resource.data) || request.resource.data.clientName is string)",
  "        && (!('clientPhone' in request.resource.data) || request.resource.data.clientPhone is string)",
  "        && (!('linkedCustomerId' in request.resource.data) || request.resource.data.linkedCustomerId is string)",
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
  "        && (!('clientLevel' in request.resource.data) || request.resource.data.clientLevel is string)",
  "        && (!('createdBy' in request.resource.data) || request.resource.data.createdBy is string);",
  '',
  '      allow update, delete: if hasPermission(\'calendar\') || hasPermission(\'billing\');',
  '    }'
].join('\n');

rules = replaceBraceBlock(
  rules,
  '    function selfUserCreateShape()',
  selfUserCreateShape,
  'selfUserCreateShape'
);

rules = replaceBraceBlock(
  rules,
  '    function selfUserSafeUpdate()',
  selfUserSafeUpdate,
  'selfUserSafeUpdate'
);

rules = replaceBraceBlock(
  rules,
  '    match /bookingRequests/{requestId}',
  bookingRequestsBlock,
  'bookingRequests block'
);

const badPatterns = [
  "'lastLoginAt'\n          'projectName'",
  "'email'\n          'projectName'",
  "'createdBy'\n          'projectName'",];

for (const badPattern of badPatterns) {
  if (rules.includes(badPattern)) {
    throw new Error('firestore.rules masih mengandung pola rusak: ' + badPattern);
  }
}

const requiredSnippets = [
  "          'projectName',",
  "          'clientType',",
  "          'primaryGenre',",
  "          'profileUpdatedAt'",
  "        && (!('projectName' in request.resource.data) || request.resource.data.projectName is string)",
  "        && request.resource.data.clientLevel == resource.data.clientLevel"
];

for (const snippet of requiredSnippets) {
  if (!rules.includes(snippet)) {
    throw new Error('firestore.rules belum lengkap. Missing: ' + snippet);
  }
}

write(rulesPath, rules);

const audit = [
  '37 Music Studio — Phase 7.0N Rules Repair Compile',
  'Generated: ' + new Date().toISOString(),
  '',
  'Files touched:',
  '- firestore.rules',
  '',
  'Fixes:',
  '- Rewrote selfUserCreateShape with valid comma-separated hasOnly fields.',
  '- Rewrote selfUserSafeUpdate with valid professional profile whitelist.',
  '- Rewrote bookingRequests block with professional metadata fields and type checks.',
  '- Removed broken inserted field syntax that caused Firestore compile errors.',
].join('\n');

fs.writeFileSync(abs('phase70n-repair-firestore-rules-compile-audit.txt'), audit, 'utf8');

console.log('Audit dibuat: phase70n-repair-firestore-rules-compile-audit.txt');
console.log('\nFirestore rules compile repair selesai bro.');
console.log('Sekarang jalankan: firebase deploy --only firestore:rules');
