const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'scripts', 'finalize-neo-studio-os-qa.cjs');

function fail(message) {
  console.error(`❌ Hotfix UI-OVERHAUL.9.1 gagal.\n${message}`);
  process.exit(1);
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`File tidak ditemukan: ${path.relative(ROOT, filePath)}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

function backupFile(filePath) {
  const backupPath = `${filePath}.bak-${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function writeIfChanged(filePath, nextContent) {
  const currentContent = readFile(filePath);

  if (currentContent === nextContent) {
    console.log(`⏭️  Tidak berubah: ${path.relative(ROOT, filePath)}`);
    return false;
  }

  const backupPath = backupFile(filePath);
  fs.writeFileSync(filePath, nextContent, 'utf8');

  console.log(`✅ Update: ${path.relative(ROOT, filePath)}`);
  console.log(`   Backup: ${path.relative(ROOT, backupPath)}`);
  return true;
}

function main() {
  console.log('🩹 Hotfix UI-OVERHAUL.9.1: flexible final QA contract anchor');

  const current = readFile(FILE);

  const oldBlock = `  ensureRequiredAnchors('Design contract', contractContent, [
    '# Neo Studio OS Design Contract',
    'UI-OVERHAUL.9',
    'Final visual QA and dead CSS cleanup',
    'Tidak boleh mengubah tanpa konfirmasi eksplisit',
  ]);`;

  const newBlock = `  ensureRequiredAnchors('Design contract', contractContent, [
    '# Neo Studio OS Design Contract',
    'UI-OVERHAUL.9',
    'Final visual QA and dead CSS cleanup',
  ]);

  if (!contractContent.includes('tanpa konfirmasi eksplisit')) {
    fail('Design contract belum punya guardrail konfirmasi eksplisit.');
  }`;

  if (!current.includes(oldBlock)) {
    fail('Anchor old Design contract verifier tidak ditemukan di finalize script.');
  }

  const next = current.replace(oldBlock, newBlock);

  const required = [
    "ensureRequiredAnchors('Design contract', contractContent, [",
    "'Final visual QA and dead CSS cleanup'",
    "contractContent.includes('tanpa konfirmasi eksplisit')",
    "Design contract belum punya guardrail konfirmasi eksplisit.",
  ];

  for (const needle of required) {
    if (!next.includes(needle)) {
      fail(`Verifikasi hotfix gagal, teks wajib tidak ada: ${needle}`);
    }
  }

  if (next.includes("'Tidak boleh mengubah tanpa konfirmasi eksplisit',")) {
    fail('Anchor exact lama masih ada.');
  }

  writeIfChanged(FILE, next);

  console.log('');
  console.log('✅ Hotfix UI-OVERHAUL.9.1 selesai.');
  console.log('   Final QA sekarang menerima variasi kalimat contract selama memuat “tanpa konfirmasi eksplisit”.');
}

main();