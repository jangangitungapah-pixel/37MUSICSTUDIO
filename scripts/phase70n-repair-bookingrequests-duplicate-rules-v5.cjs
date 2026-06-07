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
  const backupPath = fullPath + '.bak-' + stamp;
  fs.copyFileSync(fullPath, backupPath);
  console.log('Backup dibuat: ' + path.relative(root, backupPath));
}

function write(relPath, content) {
  backup(relPath);
  fs.writeFileSync(abs(relPath), content.replace(/\r?\n/g, '\n'), 'utf8');
  console.log('Updated: ' + relPath);
}

const rulesPath = 'firestore.rules';
let rules = read(rulesPath);

const bookingStartMarker = '    match /bookingRequests/{requestId} {';
const clientMessagesMarker = '    match /clientMessages/{messageId} {';

const bookingStart = rules.indexOf(bookingStartMarker);
const clientMessagesStart = rules.indexOf(clientMessagesMarker, bookingStart);

if (bookingStart === -1) {
  throw new Error('Block bookingRequests tidak ditemukan.');
}

if (clientMessagesStart === -1) {
  throw new Error('Block clientMessages setelah bookingRequests tidak ditemukan.');
}

const cleanBookingRequestsBlock = [
  '    match /bookingRequests/{requestId} {',
  "      allow read: if hasPermission('calendar')",
  "        || hasPermission('billing')",
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
  "      allow update, delete: if hasPermission('calendar') || hasPermission('billing');",
  '    }',
  '',
].join('\n');

rules =
  rules.slice(0, bookingStart) +
  cleanBookingRequestsBlock +
  rules.slice(clientMessagesStart);

const bookingCount = (rules.match(/match \/bookingRequests\/\{requestId\}/g) || []).length;
const clientMessagesCount = (rules.match(/match \/clientMessages\/\{messageId\}/g) || []).length;

if (bookingCount !== 1) {
  throw new Error('Jumlah block bookingRequests harus 1, sekarang: ' + bookingCount);
}

if (clientMessagesCount !== 1) {
  throw new Error('Jumlah block clientMessages harus 1, sekarang: ' + clientMessagesCount);
}

if (!rules.includes("          'projectName',")) {
  throw new Error('projectName belum ada di whitelist.');
}

if (!rules.includes("        && (!('projectName' in request.resource.data) || request.resource.data.projectName is string)")) {
  throw new Error('projectName type check belum ada.');
}

write(rulesPath, rules);

const audit = [
  '37 Music Studio — Phase 7.0N Rules Repair v5',
  'Generated: ' + new Date().toISOString(),
  '',
  'Files touched:',
  '- firestore.rules',
  '',
  'Fix:',
  '- Replaced bookingRequests section from first bookingRequests marker until clientMessages marker.',
  '- Removed duplicate broken bookingRequests leftovers.',
  '- Kept professional profile metadata whitelist and type checks.',
].join('\n');

fs.writeFileSync(abs('phase70n-repair-bookingrequests-duplicate-rules-v5-audit.txt'), audit, 'utf8');

console.log('Audit dibuat: phase70n-repair-bookingrequests-duplicate-rules-v5-audit.txt');
console.log('bookingRequests rules sudah dibersihkan.');