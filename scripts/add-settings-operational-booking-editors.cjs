const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'src', 'pages', 'settingsadmin.jsx');

function fail(message) {
  console.error(`❌ SETTINGS.6 gagal.\n${message}`);
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

function insertAfterFunction(content, functionName, insertContent) {
  if (content.includes('function OperationalPolicyEditor(')) {
    return content;
  }

  const range = getFunctionRange(content, functionName);

  return `${content.slice(0, range.endIndex)}\n\n${insertContent}\n${content.slice(range.endIndex)}`;
}

function replaceOnce(content, before, after, label) {
  if (!content.includes(before)) {
    fail(`Anchor tidak ditemukan: ${label}`);
  }

  return content.replace(before, after);
}

const policyEditorComponents = `function parseSettingsList(value) {
  return String(value || '')
    .split(/[\\\\n,]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function PolicyNumberField({
  helper = '',
  label,
  min = 0,
  name,
  step = 1,
  value,
  onChange,
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
      {label}
      <input
        className="min-h-10 w-full min-w-0 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
        min={min}
        name={name}
        step={step}
        type="number"
        value={value ?? 0}
        onChange={(event) => onChange(name, Number(event.target.value))}
      />
      {helper ? (
        <span className="text-[0.68rem] font-medium normal-case leading-5 tracking-normal text-[var(--ui-text-soft)]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function PolicyTextAreaField({
  helper = '',
  label,
  name,
  value,
  onChange,
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
      {label}
      <textarea
        className="min-h-[5.5rem] w-full min-w-0 resize-y rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] transition placeholder:text-[var(--ui-text-soft)] focus:border-studio-accent/55 focus:ring-4 focus:ring-studio-accent/20"
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {helper ? (
        <span className="text-[0.68rem] font-medium normal-case leading-5 tracking-normal text-[var(--ui-text-soft)]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function WeeklyHoursEditor({
  weeklyHours,
  onChange,
}) {
  const weekDays = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <section className="grid gap-2">
      {weekDays.map((item) => {
        const day = weeklyHours?.[item.key] || { open: false, start: '10:00', end: '22:00' };

        return (
          <div
            className="grid min-w-0 gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-2.5 ring-1 ring-[var(--ui-ring)] md:grid-cols-[minmax(0,1.1fr)_9rem_9rem] md:items-center"
            key={item.key}
          >
            <AppearanceToggleField
              checked={Boolean(day.open)}
              helper={day.open ? 'Hari aktif untuk jadwal studio.' : 'Hari ini dianggap tutup.'}
              label={item.label}
              name={item.key + '.open'}
              onChange={(_name, checked) => onChange(item.key, 'open', checked)}
            />

            <label className="grid min-w-0 gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              Start
              <input
                className="min-h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] disabled:opacity-50"
                disabled={!day.open}
                type="time"
                value={day.start || '10:00'}
                onChange={(event) => onChange(item.key, 'start', event.target.value)}
              />
            </label>

            <label className="grid min-w-0 gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ui-text-muted)]">
              End
              <input
                className="min-h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] px-3 text-sm font-semibold normal-case tracking-normal text-[var(--ui-text-strong)] outline-none ring-1 ring-[var(--ui-ring)] disabled:opacity-50"
                disabled={!day.open}
                type="time"
                value={day.end || '22:00'}
                onChange={(event) => onChange(item.key, 'end', event.target.value)}
              />
            </label>
          </div>
        );
      })}
    </section>
  );
}

function OperationalPolicyEditor({
  draft,
  isDirty,
  isSaving,
  lastSavedAt,
  saveError,
  saveStatus,
  validation,
  onChange,
  onDiscard,
  onListChange,
  onSave,
  onWeeklyHoursChange,
}) {
  const safeDraft = draft || adminSettingsRepository.getDefaultStudioSettings().operationalPolicy;
  const canSave = isDirty && !isSaving && validation.isValid;

  const timezoneOptions = [
    { value: 'Asia/Jakarta', label: 'Asia/Jakarta' },
  ];

  return (
    <AdminPanel className="grid gap-3 p-3" variant="default">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="grid gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              Operational Policy editor
            </h2>
            <AdminBadge tone={isDirty ? 'purple' : 'cyan'}>
              {isDirty ? 'Draft changed' : 'Clean'}
            </AdminBadge>
            <AdminBadge tone={validation.isValid ? 'cyan' : 'accent'}>
              {validation.isValid ? 'Valid' : 'Needs review'}
            </AdminBadge>
          </div>

          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Save hanya mengubah operationalPolicy. Booking lama tidak dihapus, tidak digeser, dan tidak diubah otomatis.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
          <AdminButton
            className="min-w-[6.5rem]"
            disabled={!isDirty || isSaving}
            icon={RotateCcw}
            size="sm"
            variant="secondary"
            onClick={onDiscard}
          >
            Discard
          </AdminButton>
          <AdminButton
            className="min-w-[8rem]"
            disabled={!canSave}
            icon={Save}
            size="sm"
            variant="primary"
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save operational'}
          </AdminButton>
        </div>
      </div>

      {validation.errors.length > 0 ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {validation.errors[0]}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {saveError}
        </div>
      ) : null}

      {saveStatus === 'saved' ? (
        <div className="rounded-md border border-studio-cyan/30 bg-studio-cyan/10 p-3 text-xs font-semibold leading-5 text-studio-cyan">
          Operational policy tersimpan. Efek integrasi ke Booking baru akan dilakukan di fase khusus.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="grid min-w-0 gap-3">
          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3 first:border-t-0 first:pt-0">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Schedule rules
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <AppearanceChoiceField
                  helper="Timezone MVP untuk seluruh jadwal studio."
                  label="Timezone"
                  name="timezone"
                  options={timezoneOptions}
                  value={safeDraft.timezone}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Minimal 15 menit." label="Slot minutes" min={15} name="slotMinutes" value={safeDraft.slotMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Jeda antar sesi." label="Buffer minutes" min={0} name="bufferMinutes" value={safeDraft.bufferMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Batas booking sebelum jam sesi." label="Lead minutes" min={0} name="minLeadMinutes" value={safeDraft.minLeadMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Berapa hari ke depan booking boleh dibuat." label="Max advance days" min={1} name="maxAdvanceDays" value={safeDraft.maxAdvanceDays} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Toleransi keterlambatan." label="Grace minutes" min={0} name="gracePeriodMinutes" value={safeDraft.gracePeriodMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-3">
                <PolicyNumberField helper="Durasi default saat booking baru." label="Default session" min={15} name="defaultSessionDurationMinutes" value={safeDraft.defaultSessionDurationMinutes} onChange={onChange} />
              </div>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.allowBookingOutsideHours}
                helper="Jika aktif nanti booking baru boleh dibuat di luar jam buka dengan warning."
                label="Allow outside hours"
                name="allowBookingOutsideHours"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.showClosedDaysInCalendar}
                helper="Tampilkan hari tutup pada calendar agar operator tetap punya konteks."
                label="Show closed days"
                name="showClosedDaysInCalendar"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Weekly hours
            </h3>
            <WeeklyHoursEditor weeklyHours={safeDraft.weeklyHours} onChange={onWeeklyHoursChange} />
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Calendar exceptions
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-3">
              <PolicyTextAreaField
                helper="Pisahkan dengan koma atau baris baru. Format disarankan YYYY-MM-DD."
                label="Holiday dates"
                name="holidayDates"
                value={(safeDraft.holidayDates || []).join(', ')}
                onChange={onListChange}
              />
              <PolicyTextAreaField
                helper="Tanggal blackout tidak boleh dipakai untuk booking baru di fase integrasi."
                label="Blackout dates"
                name="blackoutDates"
                value={(safeDraft.blackoutDates || []).join(', ')}
                onChange={onListChange}
              />
              <PolicyTextAreaField
                helper="Tanggal buka khusus di luar pola weekly hours."
                label="Special open dates"
                name="specialOpenDates"
                value={(safeDraft.specialOpenDates || []).join(', ')}
                onChange={onListChange}
              />
            </div>
          </section>
        </div>

        <aside className="grid min-w-0 gap-3">
          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Booking safety
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              New bookings only
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Policy ini tidak mengubah booking lama. Integrasi enforcement masuk fase terpisah.
            </span>
          </div>

          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Save state
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              {isSaving ? 'Saving operational...' : saveStatus === 'saved' ? 'Saved' : isDirty ? 'Unsaved draft' : 'No draft changes'}
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Last saved: {formatSettingsTimestamp(lastSavedAt)}
            </span>
          </div>
        </aside>
      </div>
    </AdminPanel>
  );
}

function BookingPolicyEditor({
  draft,
  isDirty,
  isSaving,
  lastSavedAt,
  saveError,
  saveStatus,
  validation,
  onChange,
  onDiscard,
  onSave,
}) {
  const safeDraft = draft || adminSettingsRepository.getDefaultStudioSettings().bookingPolicy;
  const canSave = isDirty && !isSaving && validation.isValid;

  const bookingStatusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'dp', label: 'DP' },
    { value: 'paid', label: 'Paid' },
  ];

  const paymentStatusOptions = [
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'dp', label: 'DP' },
    { value: 'paid', label: 'Paid' },
  ];

  const depositTypeOptions = [
    { value: 'fixed', label: 'Fixed amount' },
    { value: 'percentage', label: 'Percentage' },
  ];

  return (
    <AdminPanel className="grid gap-3 p-3" variant="default">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="grid gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 text-base font-semibold tracking-[-0.035em] text-[var(--ui-text-strong)]">
              Booking Policy editor
            </h2>
            <AdminBadge tone={isDirty ? 'purple' : 'cyan'}>
              {isDirty ? 'Draft changed' : 'Clean'}
            </AdminBadge>
            <AdminBadge tone={validation.isValid ? 'cyan' : 'accent'}>
              {validation.isValid ? 'Valid' : 'Needs review'}
            </AdminBadge>
          </div>

          <p className="m-0 text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
            Save hanya mengubah bookingPolicy. Tidak ada booking lama yang berubah status, payment, atau jadwalnya.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
          <AdminButton
            className="min-w-[6.5rem]"
            disabled={!isDirty || isSaving}
            icon={RotateCcw}
            size="sm"
            variant="secondary"
            onClick={onDiscard}
          >
            Discard
          </AdminButton>
          <AdminButton
            className="min-w-[8rem]"
            disabled={!canSave}
            icon={Save}
            size="sm"
            variant="primary"
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save booking'}
          </AdminButton>
        </div>
      </div>

      {validation.errors.length > 0 ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {validation.errors[0]}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-md border border-studio-accent/30 bg-studio-accent/10 p-3 text-xs font-semibold leading-5 text-studio-accent">
          {saveError}
        </div>
      ) : null}

      {saveStatus === 'saved' ? (
        <div className="rounded-md border border-studio-cyan/30 bg-studio-cyan/10 p-3 text-xs font-semibold leading-5 text-studio-cyan">
          Booking policy tersimpan. Enforcement ke booking baru akan masuk phase integrasi.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="grid min-w-0 gap-3">
          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3 first:border-t-0 first:pt-0">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Defaults
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Status booking default untuk booking baru."
                  label="Default booking status"
                  name="defaultBookingStatus"
                  options={bookingStatusOptions}
                  value={safeDraft.defaultBookingStatus}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Status payment default untuk booking baru."
                  label="Default payment"
                  name="defaultPaymentStatus"
                  options={paymentStatusOptions}
                  value={safeDraft.defaultPaymentStatus}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <AppearanceChoiceField
                  helper="Jenis deposit default saat deposit diwajibkan."
                  label="Deposit type"
                  name="defaultDepositType"
                  options={depositTypeOptions}
                  value={safeDraft.defaultDepositType}
                  onChange={onChange}
                />
              </div>
              <div className="md:col-span-4">
                <PolicyNumberField helper="Nominal atau persentase sesuai deposit type." label="Deposit amount" min={0} name="defaultDepositAmount" value={safeDraft.defaultDepositAmount} onChange={onChange} />
              </div>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.allowOverlap}
                helper="Jika aktif nanti booking overlap bisa dibuat. Default aman sebaiknya off."
                label="Allow overlap"
                name="allowOverlap"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.requireDeposit}
                helper="Booking baru bisa diwajibkan punya DP di fase integrasi."
                label="Require deposit"
                name="requireDeposit"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Required customer fields
            </h3>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.requireCustomerName}
                helper="Nama customer wajib untuk booking baru."
                label="Require customer name"
                name="requireCustomerName"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.requireCustomerPhone}
                helper="Nomor telepon wajib untuk booking baru."
                label="Require customer phone"
                name="requireCustomerPhone"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.requireCustomerEmail}
                helper="Email customer wajib jika fase CRM mengaktifkannya."
                label="Require customer email"
                name="requireCustomerEmail"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.customerSourceRequired}
                helper="Source customer wajib dipilih."
                label="Require customer source"
                name="customerSourceRequired"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Cancellation and no-show
            </h3>

            <div className="grid min-w-0 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <PolicyNumberField helper="Jam sebelum sesi untuk batas cancel." label="Cancel cutoff hours" min={0} name="cancellationCutoffHours" value={safeDraft.cancellationCutoffHours} onChange={onChange} />
              </div>
              <div className="md:col-span-4">
                <PolicyNumberField helper="Menit setelah jadwal untuk tanda no-show." label="No-show threshold" min={0} name="noShowThresholdMinutes" value={safeDraft.noShowThresholdMinutes} onChange={onChange} />
              </div>
              <div className="md:col-span-4">
                <PolicyNumberField helper="Belum dieksekusi otomatis pada phase ini." label="Auto cancel minutes" min={0} name="autoCancelAfterMinutes" value={safeDraft.autoCancelAfterMinutes} onChange={onChange} />
              </div>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.cancellationAllowed}
                helper="Mengatur policy cancel untuk booking baru."
                label="Cancellation allowed"
                name="cancellationAllowed"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.noShowEnabled}
                helper="Hanya policy. Belum ada auto mutation booking."
                label="No-show policy"
                name="noShowEnabled"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.autoCancelUnpaid}
                helper="Policy saja. Tidak menjalankan auto cancel di phase ini."
                label="Auto cancel unpaid"
                name="autoCancelUnpaid"
                onChange={onChange}
              />
            </div>
          </section>

          <section className="grid gap-3 border-t border-[var(--ui-border)] pt-3">
            <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
              Notes and operator guard
            </h3>

            <div className="grid min-w-0 gap-2 md:grid-cols-2">
              <AppearanceToggleField
                checked={safeDraft.bookingNoteRequired}
                helper="Catatan booking wajib diisi jika aktif."
                label="Require booking note"
                name="bookingNoteRequired"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.operatorNoteRequired}
                helper="Catatan operator wajib untuk aksi tertentu di fase lanjutan."
                label="Require operator note"
                name="operatorNoteRequired"
                onChange={onChange}
              />
              <AppearanceToggleField
                checked={safeDraft.bookingReminderEnabled}
                helper="Policy reminder. Template dan channel ada di Notifications."
                label="Booking reminder"
                name="bookingReminderEnabled"
                onChange={onChange}
              />
            </div>
          </section>
        </div>

        <aside className="grid min-w-0 gap-3">
          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-control)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Historical safety
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              No old booking mutation
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Settings ini hanya tersimpan sebagai policy. Enforcement ke Booking dibuat terpisah dan wajib audit.
            </span>
          </div>

          <div className="grid gap-2 rounded-md border border-[var(--ui-border)] bg-[var(--ui-glass-soft)] p-3 ring-1 ring-[var(--ui-ring)]">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
              Save state
            </span>
            <strong className="text-sm font-semibold text-[var(--ui-text-strong)]">
              {isSaving ? 'Saving booking policy...' : saveStatus === 'saved' ? 'Saved' : isDirty ? 'Unsaved draft' : 'No draft changes'}
            </strong>
            <span className="text-xs font-medium leading-5 text-[var(--ui-text-muted)]">
              Last saved: {formatSettingsTimestamp(lastSavedAt)}
            </span>
          </div>
        </aside>
      </div>
    </AdminPanel>
  );
}`;

const operationalBookingStateBlock = `  const [operationalPolicyDraft, setOperationalPolicyDraft] = useState(null);
  const [operationalPolicySaveState, setOperationalPolicySaveState] = useState({
    errorMessage: '',
    isSaving: false,
    status: 'idle',
  });
  const [bookingPolicyDraft, setBookingPolicyDraft] = useState(null);
  const [bookingPolicySaveState, setBookingPolicySaveState] = useState({
    errorMessage: '',
    isSaving: false,
    status: 'idle',
  });`;

const operationalBookingSyncEffects = `  useEffect(() => {
    const nextOperationalPolicy = settingsState.settings.operationalPolicy;

    setOperationalPolicyDraft((currentDraft) => {
      const previousOperationalPolicy = currentOperationalPolicyRef.current;
      const draftWasDirty = currentDraft
        ? JSON.stringify(currentDraft) !== JSON.stringify(previousOperationalPolicy)
        : false;

      return draftWasDirty ? currentDraft : nextOperationalPolicy;
    });
    currentOperationalPolicyRef.current = nextOperationalPolicy;
  }, [settingsState.settings.operationalPolicy]);

  useEffect(() => {
    const nextBookingPolicy = settingsState.settings.bookingPolicy;

    setBookingPolicyDraft((currentDraft) => {
      const previousBookingPolicy = currentBookingPolicyRef.current;
      const draftWasDirty = currentDraft
        ? JSON.stringify(currentDraft) !== JSON.stringify(previousBookingPolicy)
        : false;

      return draftWasDirty ? currentDraft : nextBookingPolicy;
    });
    currentBookingPolicyRef.current = nextBookingPolicy;
  }, [settingsState.settings.bookingPolicy]);

`;

const operationalBookingDraftDeclarations = `  const safeOperationalPolicyDraft = operationalPolicyDraft || settingsState.settings.operationalPolicy;
  const isOperationalPolicyDirty = useMemo(
    () => JSON.stringify(safeOperationalPolicyDraft) !== JSON.stringify(settingsState.settings.operationalPolicy),
    [safeOperationalPolicyDraft, settingsState.settings.operationalPolicy],
  );
  const operationalPolicyValidation = useMemo(
    () => adminSettingsRepository.validateSettingsSection('operationalPolicy', safeOperationalPolicyDraft),
    [safeOperationalPolicyDraft],
  );
  const safeBookingPolicyDraft = bookingPolicyDraft || settingsState.settings.bookingPolicy;
  const isBookingPolicyDirty = useMemo(
    () => JSON.stringify(safeBookingPolicyDraft) !== JSON.stringify(settingsState.settings.bookingPolicy),
    [safeBookingPolicyDraft, settingsState.settings.bookingPolicy],
  );
  const bookingPolicyValidation = useMemo(
    () => adminSettingsRepository.validateSettingsSection('bookingPolicy', safeBookingPolicyDraft),
    [safeBookingPolicyDraft],
  );
  const hasSettingsDraft = isStudioProfileDirty || isAppearancePolicyDirty || isOperationalPolicyDirty || isBookingPolicyDirty;`;

const operationalBookingHandlers = `  const handleOperationalPolicyChange = (name, value) => {
    setOperationalPolicyDraft((currentDraft) => ({
      ...(currentDraft || settingsState.settings.operationalPolicy),
      [name]: value,
    }));
    setOperationalPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleOperationalWeeklyHoursChange = (dayKey, fieldName, value) => {
    setOperationalPolicyDraft((currentDraft) => {
      const baseDraft = currentDraft || settingsState.settings.operationalPolicy;
      const currentDay = baseDraft.weeklyHours?.[dayKey] || { open: false, start: '10:00', end: '22:00' };

      return {
        ...baseDraft,
        weeklyHours: {
          ...baseDraft.weeklyHours,
          [dayKey]: {
            ...currentDay,
            [fieldName]: value,
          },
        },
      };
    });
    setOperationalPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleOperationalPolicyListChange = (name, value) => {
    handleOperationalPolicyChange(name, parseSettingsList(value));
  };
  const handleDiscardOperationalPolicy = () => {
    setOperationalPolicyDraft(settingsState.settings.operationalPolicy);
    setOperationalPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleSaveOperationalPolicy = async () => {
    const validation = adminSettingsRepository.validateSettingsSection('operationalPolicy', safeOperationalPolicyDraft);

    if (!validation.isValid) {
      setOperationalPolicySaveState({
        errorMessage: validation.errors[0] || 'Operational Policy belum valid.',
        isSaving: false,
        status: 'error',
      });
      return;
    }

    setOperationalPolicySaveState({
      errorMessage: '',
      isSaving: true,
      status: 'saving',
    });

    try {
      const nextSettings = await adminSettingsRepository.updateStudioSettingsSection(
        'operationalPolicy',
        safeOperationalPolicyDraft,
        adminUser,
      );
      setOperationalPolicyDraft(nextSettings.operationalPolicy);
      setOperationalPolicySaveState({
        errorMessage: '',
        isSaving: false,
        status: 'saved',
      });
    } catch (error) {
      setOperationalPolicySaveState({
        errorMessage: error?.validation?.errors?.[0] || error?.message || 'Operational Policy gagal disimpan.',
        isSaving: false,
        status: 'error',
      });
    }
  };
  const handleBookingPolicyChange = (name, value) => {
    setBookingPolicyDraft((currentDraft) => ({
      ...(currentDraft || settingsState.settings.bookingPolicy),
      [name]: value,
    }));
    setBookingPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleDiscardBookingPolicy = () => {
    setBookingPolicyDraft(settingsState.settings.bookingPolicy);
    setBookingPolicySaveState({
      errorMessage: '',
      isSaving: false,
      status: 'idle',
    });
  };
  const handleSaveBookingPolicy = async () => {
    const validation = adminSettingsRepository.validateSettingsSection('bookingPolicy', safeBookingPolicyDraft);

    if (!validation.isValid) {
      setBookingPolicySaveState({
        errorMessage: validation.errors[0] || 'Booking Policy belum valid.',
        isSaving: false,
        status: 'error',
      });
      return;
    }

    setBookingPolicySaveState({
      errorMessage: '',
      isSaving: true,
      status: 'saving',
    });

    try {
      const nextSettings = await adminSettingsRepository.updateStudioSettingsSection(
        'bookingPolicy',
        safeBookingPolicyDraft,
        adminUser,
      );
      setBookingPolicyDraft(nextSettings.bookingPolicy);
      setBookingPolicySaveState({
        errorMessage: '',
        isSaving: false,
        status: 'saved',
      });
    } catch (error) {
      setBookingPolicySaveState({
        errorMessage: error?.validation?.errors?.[0] || error?.message || 'Booking Policy gagal disimpan.',
        isSaving: false,
        status: 'error',
      });
    }
  };
`;

const operationalBookingRender = `      <OperationalPolicyEditor
        draft={safeOperationalPolicyDraft}
        isDirty={isOperationalPolicyDirty}
        isSaving={operationalPolicySaveState.isSaving}
        lastSavedAt={settingsState.settings.updatedAt}
        saveError={operationalPolicySaveState.errorMessage}
        saveStatus={operationalPolicySaveState.status}
        validation={operationalPolicyValidation}
        onChange={handleOperationalPolicyChange}
        onDiscard={handleDiscardOperationalPolicy}
        onListChange={handleOperationalPolicyListChange}
        onSave={handleSaveOperationalPolicy}
        onWeeklyHoursChange={handleOperationalWeeklyHoursChange}
      />

      <BookingPolicyEditor
        draft={safeBookingPolicyDraft}
        isDirty={isBookingPolicyDirty}
        isSaving={bookingPolicySaveState.isSaving}
        lastSavedAt={settingsState.settings.updatedAt}
        saveError={bookingPolicySaveState.errorMessage}
        saveStatus={bookingPolicySaveState.status}
        validation={bookingPolicyValidation}
        onChange={handleBookingPolicyChange}
        onDiscard={handleDiscardBookingPolicy}
        onSave={handleSaveBookingPolicy}
      />

`;

function main() {
  console.log('🗓️ SETTINGS.6: add operational and booking policy editors');

  const current = readFile(FILE);

  assertRequired(current, [
    "import { useTheme } from '../theme/ThemeProvider.jsx';",
    "key: 'operationalPolicy'",
    "key: 'bookingPolicy'",
    "key: 'appearancePolicy'",
    "function AppearanceChoiceField(",
    "function AppearanceToggleField(",
    "function AppearancePolicyEditor(",
    "const [appearancePolicyDraft, setAppearancePolicyDraft] = useState(null);",
    "const currentAppearancePolicyRef = useRef(settingsState.settings.appearancePolicy);",
    "const hasSettingsDraft = isStudioProfileDirty || isAppearancePolicyDirty;",
    "<AppearancePolicyEditor",
    "<SettingsSnapshotPanel",
  ], 'settingsadmin.jsx SETTINGS.5 anchor');

  let next = current;

  next = next.replace(
    "Settings write pada SETTINGS.5 hanya Studio Profile dan Appearance per section.",
    "Settings write pada SETTINGS.6 hanya Studio Profile, Appearance, Operational, dan Booking Policy per section.",
  );

  next = next.replace(
    "const isEditableNow = ['studioProfile', 'appearancePolicy'].includes(section.key);",
    "const isEditableNow = ['studioProfile', 'appearancePolicy', 'operationalPolicy', 'bookingPolicy'].includes(section.key);",
  );

  next = next.replace(
    '            SETTINGS.5\n',
    '            SETTINGS.6\n',
  );

  next = next.replace(
    'Profile + Appearance',
    'Profile + UI + Booking rules',
  );

  next = next.replace(
    'Edit profil studio dan appearance policy tanpa merusak preferensi lokal ThemeProvider.',
    'Edit profil studio, appearance, jam operasional, dan booking policy tanpa mengubah data historis.',
  );

  next = insertAfterFunction(next, 'AppearancePolicyEditor', policyEditorComponents);

  if (!next.includes(operationalBookingStateBlock)) {
    next = replaceOnce(
      next,
      `  const [appearancePolicySaveState, setAppearancePolicySaveState] = useState({
    errorMessage: '',
    isSaving: false,
    status: 'idle',
  });
  const currentStudioProfileRef = useRef(settingsState.settings.studioProfile);
  const currentAppearancePolicyRef = useRef(settingsState.settings.appearancePolicy);`,
      `  const [appearancePolicySaveState, setAppearancePolicySaveState] = useState({
    errorMessage: '',
    isSaving: false,
    status: 'idle',
  });
${operationalBookingStateBlock}
  const currentStudioProfileRef = useRef(settingsState.settings.studioProfile);
  const currentAppearancePolicyRef = useRef(settingsState.settings.appearancePolicy);
  const currentOperationalPolicyRef = useRef(settingsState.settings.operationalPolicy);
  const currentBookingPolicyRef = useRef(settingsState.settings.bookingPolicy);`,
      'insert operational booking state',
    );
  }

  if (!next.includes('currentOperationalPolicyRef.current = nextOperationalPolicy;')) {
    next = replaceOnce(
      next,
      `  const readinessSummary = useMemo(`,
      `${operationalBookingSyncEffects}  const readinessSummary = useMemo(`,
      'insert operational booking sync effects',
    );
  }

  if (!next.includes('const safeOperationalPolicyDraft = operationalPolicyDraft || settingsState.settings.operationalPolicy;')) {
    next = replaceOnce(
      next,
      "  const hasSettingsDraft = isStudioProfileDirty || isAppearancePolicyDirty;",
      operationalBookingDraftDeclarations,
      'insert operational booking draft declarations',
    );
  }

  if (!next.includes('const handleSaveOperationalPolicy = async () => {')) {
    next = replaceOnce(
      next,
      `  const systemCards = useMemo(() => [`,
      `${operationalBookingHandlers}  const systemCards = useMemo(() => [`,
      'insert operational booking handlers',
    );
  }

  if (!next.includes('<OperationalPolicyEditor')) {
    next = replaceOnce(
      next,
      `      <SettingsSnapshotPanel
        settings={settingsState.settings}
        validation={settingsValidation}
      />`,
      `${operationalBookingRender}      <SettingsSnapshotPanel
        settings={settingsState.settings}
        validation={settingsValidation}
      />`,
      'insert operational booking editor render',
    );
  }

  next = next.replace(
    'Studio Profile dan Appearance punya editor aktif; section lain tetap kontrak visual read-only.',
    'Studio Profile, Appearance, Operational, dan Booking Policy punya editor aktif; section lain tetap kontrak visual read-only.',
  );

  assertRequired(next, [
    'function OperationalPolicyEditor(',
    'function BookingPolicyEditor(',
    'function WeeklyHoursEditor(',
    'function PolicyNumberField(',
    'parseSettingsList',
    'const [operationalPolicyDraft, setOperationalPolicyDraft] = useState(null);',
    'const [bookingPolicyDraft, setBookingPolicyDraft] = useState(null);',
    'const currentOperationalPolicyRef = useRef(settingsState.settings.operationalPolicy);',
    'const currentBookingPolicyRef = useRef(settingsState.settings.bookingPolicy);',
    "updateStudioSettingsSection(\n        'operationalPolicy'",
    "updateStudioSettingsSection(\n        'bookingPolicy'",
    '<OperationalPolicyEditor',
    '<BookingPolicyEditor',
    'SETTINGS.6',
    'No old booking mutation',
    'New bookings only',
    'allowOverlap',
    'requireDeposit',
    'weeklyHours',
    'holidayDates',
    'blackoutDates',
    'slotMinutes',
    'maxAdvanceDays',
  ], 'SETTINGS.6 verification');

  assertForbidden(next, [
    'createManualBooking(',
    'updateManualBooking(',
    'deleteManualBooking(',
    'createBillingTransaction(',
    'updateBillingTransaction(',
    'autoSyncBookingPayment: true',
    "deleteMode: 'hard-delete'",
    'deleteMode: "hard-delete"',
  ], 'SETTINGS.6 forbidden behavior');

  writeIfChanged(FILE, next);

  console.log('');
  console.log('✅ SETTINGS.6 selesai.');
  console.log('   Operational Policy editor ditambahkan.');
  console.log('   Booking Policy editor ditambahkan.');
  console.log('   Save per section tetap lewat adminSettingsRepository.');
  console.log('   Booking lama tidak disentuh.');
}

main();