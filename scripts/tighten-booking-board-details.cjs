const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'src', 'pages', 'bookingadmin.jsx');

function fail(message) {
  console.error(`❌ UI-POLISH.BOOKING.2 gagal.\n${message}`);
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

function findMatching(content, openIndex, openChar, closeChar) {
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = openIndex; index < content.length; index += 1) {
    const char = content[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = '';
      }

      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === openChar) {
      depth += 1;
    }

    if (char === closeChar) {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function getFunctionRange(content, functionName) {
  const signature = `function ${functionName}`;
  const startIndex = content.indexOf(signature);

  if (startIndex === -1) {
    fail(`Function tidak ditemukan: ${functionName}`);
  }

  const paramOpenIndex = content.indexOf('(', startIndex);
  const paramCloseIndex = findMatching(content, paramOpenIndex, '(', ')');
  const bodyOpenIndex = content.indexOf('{', paramCloseIndex);
  const bodyCloseIndex = findMatching(content, bodyOpenIndex, '{', '}');

  if (
    paramOpenIndex === -1 ||
    paramCloseIndex === -1 ||
    bodyOpenIndex === -1 ||
    bodyCloseIndex === -1
  ) {
    fail(`Scanner gagal membaca function ${functionName}.`);
  }

  return {
    startIndex,
    endIndex: bodyCloseIndex + 1,
  };
}

function replaceFunction(content, functionName, nextFunction) {
  const range = getFunctionRange(content, functionName);

  return `${content.slice(0, range.startIndex)}${nextFunction}${content.slice(range.endIndex)}`;
}

function replaceRequired(content, from, to, label) {
  if (!content.includes(from)) {
    fail(`Anchor tidak ditemukan: ${label}`);
  }

  return content.replace(from, to);
}

function assertRequired(content, needles, label) {
  for (const needle of needles) {
    if (!content.includes(needle)) {
      fail(`${label} wajib tidak ada: ${needle}`);
    }
  }
}

function assertForbidden(content, needles, label) {
  for (const needle of needles) {
    if (content.includes(needle)) {
      fail(`${label} tidak boleh ada: ${needle}`);
    }
  }
}

const nextSelectedSlotPanel = `function SelectedSlotPanel({
  bookings,
  selectedSlot,
}) {
  if (!hasSelectedSlot(selectedSlot)) {
    return null;
  }

  const booking = getBookingForSlot(bookings, selectedSlot.dateKey, selectedSlot.timeKey);
  const statusTone = booking ? getToneByStatus(booking.status) : 'cyan';
  const statusLabel = booking ? getStatusLabel(booking.status) : 'Kosong';
  const displayName = booking?.customerName || booking?.title || 'Slot kosong';
  const sessionLabel = booking?.sessionType || booking?.title || 'Belum ada booking';
  const selectedLabel = selectedSlot.label + ' • ' + selectedSlot.timeKey;

  return (
    <AdminPanel
      className="booking-selected-slot-panel grid gap-2 p-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:p-3"
      variant={booking ? 'solid' : 'flat'}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={cn(
          'grid size-9 shrink-0 place-items-center rounded-[1rem] border shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)]',
          booking
            ? 'border-studio-accent/30 bg-studio-accent/10 text-studio-accent'
            : 'border-studio-cyan/30 bg-studio-cyan/10 text-studio-cyan',
        )}>
          {booking ? (
            <ReceiptText size={16} strokeWidth={2.35} aria-hidden="true" />
          ) : (
            <Plus size={16} strokeWidth={2.35} aria-hidden="true" />
          )}
        </span>

        <span className="grid min-w-0 gap-0.5">
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)] sm:text-[0.66rem]">
            Slot terpilih
          </span>

          <strong className="truncate text-sm font-semibold tracking-[-0.025em] text-[var(--ui-text-strong)] sm:text-base">
            {displayName}
          </strong>

          <span className="truncate text-xs font-medium text-[var(--ui-text-muted)]">
            {selectedLabel} • {sessionLabel}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap sm:justify-end">
        <AdminBadge className="min-h-8 justify-center px-2 text-[0.58rem] uppercase tracking-[0.08em] sm:text-[0.66rem]" tone={statusTone}>
          {statusLabel}
        </AdminBadge>

        {booking ? (
          <>
            <AdminBadge className="min-h-8 justify-center px-2 text-[0.58rem] uppercase tracking-[0.08em] sm:text-[0.66rem]" tone="strong">
              {formatCurrency(booking.totalPrice)}
            </AdminBadge>

            <AdminBadge className="min-h-8 justify-center px-2 text-[0.58rem] uppercase tracking-[0.08em] sm:text-[0.66rem]" tone={booking.remainingPayment > 0 ? 'accent' : 'cyan'}>
              Sisa {formatCurrency(booking.remainingPayment)}
            </AdminBadge>
          </>
        ) : (
          <>
            <AdminBadge className="min-h-8 justify-center px-2 text-[0.58rem] uppercase tracking-[0.08em] sm:text-[0.66rem]" tone="strong">
              Siap booking
            </AdminBadge>

            <AdminBadge className="min-h-8 justify-center px-2 text-[0.58rem] uppercase tracking-[0.08em] sm:text-[0.66rem]" tone="cyan">
              Tap slot
            </AdminBadge>
          </>
        )}
      </div>
    </AdminPanel>
  );
}`;

function main() {
  console.log('🎛️ UI-POLISH.BOOKING.2: tighten booking board details');

  const current = readFile(FILE);

  assertRequired(current, [
    'function CalendarGrid({',
    'function SelectedSlotPanel({',
    'function BookingAdmin()',
    'handleBookingSubmit',
    'handleEditBookingSubmit',
    'handleDeleteBooking',
    'handleMarkBookingPaid',
    '<CalendarToolbar',
    '<CalendarGrid',
    '<SelectedSlotPanel',
    '<BookingModal',
    '<BookingDetailModal',
  ], 'Booking page anchor');

  let next = current;

  next = replaceRequired(
    next,
    "booking-board-header flex items-center justify-between gap-2 border-b border-[var(--ui-border-strong)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3",
    "booking-board-header flex items-center justify-between gap-2 border-b border-[var(--ui-border-strong)] px-2.5 py-2 sm:gap-3 sm:px-3.5 sm:py-2.5",
    'board header compact spacing',
  );

  next = replaceRequired(
    next,
    "booking-board-icon grid size-9 shrink-0 place-items-center rounded-[1rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] sm:size-10 sm:rounded-2xl",
    "booking-board-icon grid size-8 shrink-0 place-items-center rounded-[0.95rem] border border-[var(--ui-border)] bg-[var(--ui-control)] text-studio-accent shadow-[var(--ui-shadow-control)] ring-1 ring-[var(--ui-ring)] sm:size-9 sm:rounded-[1rem]",
    'board icon compact',
  );

  next = replaceRequired(
    next,
    "truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ui-text-strong)]",
    "truncate text-sm font-semibold tracking-[-0.025em] text-[var(--ui-text-strong)]",
    'board title tracking',
  );

  next = replaceRequired(
    next,
    "booking-board-subtitle truncate text-xs font-medium text-[var(--ui-text-muted)]",
    "booking-board-subtitle truncate text-[0.68rem] font-medium text-[var(--ui-text-muted)] sm:text-xs",
    'board subtitle compact',
  );

  next = replaceRequired(
    next,
    "hidden items-center gap-2 text-xs font-semibold text-[var(--ui-text-muted)] sm:flex",
    "hidden items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)] px-2.5 py-1.5 text-[0.66rem] font-semibold text-[var(--ui-text-muted)] ring-1 ring-[var(--ui-ring)] sm:flex",
    'board legend chip shell',
  );

  next = replaceRequired(
    next,
    'Pending\n          <span className="ml-2 size-2 rounded-full bg-studio-purple" />\n          DP\n          <span className="ml-2 size-2 rounded-full bg-studio-cyan" />\n          Lunas',
    'Pending\n          <span className="ml-1.5 size-2 rounded-full bg-studio-purple" />\n          DP\n          <span className="ml-1.5 size-2 rounded-full bg-studio-cyan" />\n          Lunas',
    'board legend spacing',
  );

  next = replaceFunction(next, 'SelectedSlotPanel', nextSelectedSlotPanel);

  assertRequired(next, [
    "booking-board-header flex items-center justify-between gap-2 border-b border-[var(--ui-border-strong)] px-2.5 py-2",
    "booking-board-icon grid size-8",
    "booking-board-subtitle truncate text-[0.68rem]",
    "hidden items-center gap-1.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-control)]",
    "function SelectedSlotPanel({",
    "Slot terpilih",
    "Siap booking",
    "Tap slot",
    "Sisa {formatCurrency(booking.remainingPayment)}",
  ], 'Booking board detail visual guard');

  assertRequired(next, [
    'handleBookingSubmit',
    'handleEditBookingSubmit',
    'handleDeleteBooking',
    'handleMarkBookingPaid',
    'addManualBooking',
    'updateManualBooking',
    'deleteManualBooking',
    'recordBookingAuditLog',
    '<CalendarToolbar',
    '<CalendarGrid',
    '<SelectedSlotPanel',
    '<BookingModal',
    '<BookingDetailModal',
  ], 'Booking logic guard');

  assertForbidden(next, [
    'export export function',
    'isDarkMode ?',
    "mode === 'dark' ?",
    'updateBillingTransaction(',
    'createBillingTransaction(',
    'stockMovement',
    'inventoryItemId: form',
  ], 'Forbidden booking mutation/theme branching');

  writeIfChanged(FILE, next);

  console.log('');
  console.log('✅ UI-POLISH.BOOKING.2 selesai.');
  console.log('   Booking board header dan selected slot panel dibuat lebih rapih.');
  console.log('   Tidak mengubah create/edit/delete booking, payment logic, billing, inventory, route, auth, atau Firestore.');
}

main();