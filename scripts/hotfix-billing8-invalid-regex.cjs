const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'scripts', 'add-customer-billing-history.cjs');

function fail(message) {
  console.error(`❌ HOTFIX BILLING.8.3 gagal.\n${message}`);
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

const safePatchCustomerPageFunction = `function patchCustomerPage(content) {
  let next = content;

  if (!next.includes('function CustomerBillingHistoryPanel(')) {
    next = insertBeforeFunction(next, 'CustomerDetailPanel', customerBillingHelpers);
  }

  if (!next.includes('billingTransactions = [],\\n  customer,')) {
    const panelSignatureIndex = next.indexOf('function CustomerDetailPanel({');

    if (panelSignatureIndex === -1) {
      fail('Signature CustomerDetailPanel tidak ditemukan.');
    }

    const customerPropIndex = next.indexOf('  customer,', panelSignatureIndex);

    if (customerPropIndex === -1) {
      fail('Prop customer di CustomerDetailPanel tidak ditemukan.');
    }

    next = next.slice(0, customerPropIndex) + '  billingTransactions = [],\\n' + next.slice(customerPropIndex);
  }

  if (!next.includes('const customerBillingHistory = getCustomerBillingHistory(customer, billingTransactions);')) {
    const filteredHistoryNeedle = 'const filteredHistoryBookings = getFilteredCustomerBookings(customer, historyFilter);';
    const filteredHistoryIndex = next.indexOf(filteredHistoryNeedle);

    if (filteredHistoryIndex === -1) {
      fail('Anchor filteredHistoryBookings tidak ditemukan.');
    }

    const insertIndex = filteredHistoryIndex + filteredHistoryNeedle.length;

    next = next.slice(0, insertIndex) + '\\n  const customerBillingHistory = getCustomerBillingHistory(customer, billingTransactions);' + next.slice(insertIndex);
  }

  if (!next.includes('<CustomerBillingHistoryPanel billingHistory={customerBillingHistory} />')) {
    const paymentSummaryNeedle = '<CustomerPaymentSummary customer={customer} />';
    const paymentSummaryIndex = next.indexOf(paymentSummaryNeedle);

    if (paymentSummaryIndex === -1) {
      fail('Anchor CustomerPaymentSummary tidak ditemukan.');
    }

    const insertIndex = paymentSummaryIndex + paymentSummaryNeedle.length;

    next = next.slice(0, insertIndex) + '\\n\\n      <CustomerBillingHistoryPanel billingHistory={customerBillingHistory} />' + next.slice(insertIndex);
  }

  if (!next.includes('billingTransactions = [],\\n    bookingLoadError')) {
    const detailAdminRange = getFunctionRange(next, 'CustomerDetailAdmin');
    const detailAdminText = next.slice(detailAdminRange.startIndex, detailAdminRange.endIndex);
    const contextStartIndex = detailAdminText.indexOf('const {');

    if (contextStartIndex === -1) {
      fail('Context destructuring CustomerDetailAdmin tidak ditemukan.');
    }

    const insertIndex = detailAdminRange.startIndex + contextStartIndex + 'const {'.length;

    next = next.slice(0, insertIndex) + '\\n    billingTransactions = [],' + next.slice(insertIndex);
  }

  if (!next.includes('billingTransactions={billingTransactions}')) {
    const detailAdminRange = getFunctionRange(next, 'CustomerDetailAdmin');
    const detailPanelIndex = next.indexOf('<CustomerDetailPanel', detailAdminRange.startIndex);

    if (detailPanelIndex === -1 || detailPanelIndex > detailAdminRange.endIndex) {
      fail('Usage CustomerDetailPanel di CustomerDetailAdmin tidak ditemukan.');
    }

    const customerPropNeedle = '          customer={selectedCustomer}';
    const customerPropIndex = next.indexOf(customerPropNeedle, detailPanelIndex);

    if (customerPropIndex === -1 || customerPropIndex > detailAdminRange.endIndex) {
      fail('Prop customer pada usage CustomerDetailPanel tidak ditemukan.');
    }

    next = next.slice(0, customerPropIndex) + '          billingTransactions={billingTransactions}\\n' + next.slice(customerPropIndex);
  }

  return next;
}`;

function main() {
  console.log('🩹 HOTFIX BILLING.8.3: replace invalid regex patcher');

  const current = readFile(FILE);

  const startAnchor = 'function patchCustomerPage(content) {';
  const endAnchor = '\nfunction verifyPlan(content)';

  const startIndex = current.indexOf(startAnchor);
  const endIndex = current.indexOf(endAnchor, startIndex);

  if (startIndex === -1) {
    fail('Start function patchCustomerPage tidak ditemukan.');
  }

  if (endIndex === -1) {
    fail('End anchor function verifyPlan tidak ditemukan.');
  }

  const next = current.slice(0, startIndex) + safePatchCustomerPageFunction + current.slice(endIndex);

  const requiredAfter = [
    'function patchCustomerPage(content)',
    'panelSignatureIndex',
    'filteredHistoryNeedle',
    'paymentSummaryNeedle',
    "getFunctionRange(next, 'CustomerDetailAdmin')",
    'billingTransactions={billingTransactions}',
  ];

  for (const needle of requiredAfter) {
    if (!next.includes(needle)) {
      fail(`Verifikasi hotfix gagal. Teks wajib tidak ada: ${needle}`);
    }
  }

  const forbiddenBrokenRegexFragments = [
    '/function\\\\s+CustomerDetailPanel',
    '/const\\\\s+filteredHistoryBookings',
    '/<CustomerPaymentSummary\\\\s+customer',
    '/export\\\\s+function\\\\s+CustomerDetailAdmin',
  ];

  for (const needle of forbiddenBrokenRegexFragments) {
    if (next.includes(needle)) {
      fail(`Regex literal invalid masih ada: ${needle}`);
    }
  }

  writeIfChanged(FILE, next);

  console.log('');
  console.log('✅ HOTFIX BILLING.8.3 selesai.');
  console.log('   patchCustomerPage di script BILLING.8 sekarang tidak memakai regex literal.');
  console.log('   Source app belum disentuh oleh hotfix ini.');
}

main();