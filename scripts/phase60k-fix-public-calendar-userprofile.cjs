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
    throw new Error(`File tidak ditemukan: ${relPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function backup(relPath) {
  const fullPath = abs(relPath);
  if (!fs.existsSync(fullPath)) return;

  const backupPath = `${fullPath}.bak-${stamp}`;
  fs.copyFileSync(fullPath, backupPath);
  console.log(`Backup dibuat: ${path.relative(root, backupPath)}`);
}

function write(relPath, content) {
  backup(relPath);
  fs.writeFileSync(abs(relPath), content, 'utf8');
  console.log(`Updated: ${relPath}`);
}

const filePath = 'src/pages/PublicCalendarPage.jsx';
let source = read(filePath);

/**
 * 1) Pastikan userProfile ikut diambil dari useAuthStore.
 */
source = source.replace(
  'const { user, logout, loginGuest, isAuthLoaded, loading: authLoading } = useAuthStore();',
  'const { user, userProfile, logout, loginGuest, isAuthLoaded, loading: authLoading } = useAuthStore();'
);

/**
 * 2) Replace openModal block secara lebih fleksibel.
 */
const openModalRegex = /  \/\/ Open booking modal\s*\n  const openModal = \(dateStr, hour, triggerElement\) => \{[\s\S]*?\n  \};\s*\n\n  \/\/ Send WA/;

const openModalReplacement = `  // Open booking modal
  const openModal = (dateStr, hour, triggerElement) => {
    lastSlotButtonRef.current = triggerElement || null;

    const savedClientName =
      userProfile?.displayName ||
      userProfile?.username ||
      user?.displayName ||
      '';

    const savedClientPhone = userProfile?.phone || '';

    setSelectedSlot({ dateStr, hour });
    setBandName(savedClientName);
    setCustomerPhone(savedClientPhone);
    setDuration(2);
    setFormErrors({});
    setModalOpen(true);
  };

  // Send WA`;

if (!openModalRegex.test(source)) {
  throw new Error('Block openModal tidak ditemukan. Cek struktur PublicCalendarPage.jsx.');
}

source = source.replace(openModalRegex, openModalReplacement);

/**
 * 3) Replace addRequest payload agar request booking punya metadata client.
 */
const addRequestRegex = /await addRequest\(\{\s*band: bandName\.trim\(\),\s*phone: customerPhone\.trim\(\),\s*date: selectedSlot\.dateStr,\s*hour: selectedSlot\.hour,\s*duration,\s*estimatedPrice: priceEst,\s*source: 'public-calendar',\s*\}\);/;

const addRequestReplacement = `await addRequest({
        band: bandName.trim(),
        phone: customerPhone.trim(),
        date: selectedSlot.dateStr,
        hour: selectedSlot.hour,
        duration,
        estimatedPrice: priceEst,
        source: 'public-calendar',
        clientUid: user && !user.isAnonymous ? user.uid : '',
        clientEmail: user && !user.isAnonymous ? (user.email || userProfile?.email || '') : '',
        clientName:
          userProfile?.displayName ||
          userProfile?.username ||
          user?.displayName ||
          bandName.trim(),
        clientPhone: customerPhone.trim(),
        linkedCustomerId: userProfile?.linkedCustomerId || '',
        createdBy: user && !user.isAnonymous ? user.uid : 'public-guest',
      });`;

if (!addRequestRegex.test(source)) {
  throw new Error('Payload addRequest lama tidak ditemukan. Kemungkinan sudah berubah manual.');
}

source = source.replace(addRequestRegex, addRequestReplacement);

/**
 * 4) Sanity check: userProfile harus kepakai lebih dari sekali.
 */
const usageCount = (source.match(/\\buserProfile\\b/g) || []).length;

if (usageCount < 2) {
  throw new Error(`userProfile masih belum kepakai cukup. Count: ${usageCount}`);
}

write(filePath, source);

const audit = [
  '37 Music Studio — Phase 6.0K Lint Fix PublicCalendar userProfile',
  `Generated: ${new Date().toISOString()}`,
  '',
  'Fixed:',
  '- userProfile now used to prefill booking modal name/phone.',
  '- booking request payload now stores client metadata.',
  '- ESLint no-unused-vars for userProfile should be resolved.',
].join('\\n');

fs.writeFileSync(abs('phase60k-public-calendar-userprofile-fix-audit.txt'), audit, 'utf8');
console.log('Audit dibuat: phase60k-public-calendar-userprofile-fix-audit.txt');

console.log('\\nPhase 6.0K-LINT-FIX selesai bro.');
console.log('PublicCalendarPage.jsx sekarang memakai userProfile beneran.');
console.log('Lanjut otomatis: npm run lint -> npm test -> npm run build');