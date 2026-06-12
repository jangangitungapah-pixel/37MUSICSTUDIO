const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCRIPT_PATH = path.join(ROOT, 'scripts', 'polish-customer-activity-timeline.cjs');

function fail(message) {
  console.error(`❌ Hotfix 2CUST-Q script gagal.\n${message}`);
  process.exit(1);
}

if (!fs.existsSync(SCRIPT_PATH)) {
  fail('Script scripts/polish-customer-activity-timeline.cjs tidak ditemukan.');
}

const current = fs.readFileSync(SCRIPT_PATH, 'utf8');

const oldBlock = `  if (content.includes('<CustomerActivityTimeline')) {
    return content;
  }`;

const newBlock = `  if (/<CustomerActivityTimeline(\\s|>)/.test(content)) {
    return content;
  }`;

if (current.includes(newBlock)) {
  console.log('⏭️  Script 2CUST-Q sudah pernah di-hotfix.');
  process.exit(0);
}

if (!current.includes(oldBlock)) {
  fail('Anchor bug lama tidak ditemukan. Kemungkinan script sudah berubah, jangan lanjut blind patch.');
}

const next = current.replace(oldBlock, newBlock);

fs.writeFileSync(SCRIPT_PATH, next, 'utf8');

console.log('✅ Hotfix selesai.');
console.log('   Guard <CustomerActivityTimeline sekarang tidak akan salah match <CustomerActivityTimelineCard.');