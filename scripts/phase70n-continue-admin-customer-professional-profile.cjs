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
  return fs.readFileSync(fullPath, 'utf8');
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
  fs.writeFileSync(abs(relPath), content, 'utf8');
  console.log('Updated: ' + relPath);
}

function replaceRequired(source, searchValue, replaceValue, label) {
  if (!source.includes(searchValue)) {
    throw new Error('Snippet tidak ditemukan untuk ' + label + ':\n' + searchValue);
  }

  return source.replace(searchValue, replaceValue);
}

function insertBeforeOnce(source, marker, uniqueToken, insertion, label) {
  if (source.includes(uniqueToken)) {
    console.log('Skip, sudah ada: ' + uniqueToken);
    return source;
  }

  const index = source.indexOf(marker);
  if (index === -1) {
    throw new Error('Marker tidak ditemukan untuk ' + label + ': ' + marker);
  }

  return source.slice(0, index) + insertion + '\n' + source.slice(index);
}

function addLucideIcon(source, iconName) {
  const regex = /import\s*\{([\s\S]*?)\}\s*from\s*'lucide-react';/m;
  const match = source.match(regex);

  if (!match) {
    throw new Error('Import lucide-react tidak ditemukan.');
  }

  const body = match[1];

  if (new RegExp('\\b' + iconName + '\\b').test(body)) {
    return source;
  }

  const nextBody = body.trimEnd().replace(/\s*$/, ', ' + iconName + ' ');
  return source.replace(regex, 'import {' + nextBody + "} from 'lucide-react';");
}

function removePatchByTitle(source, title) {
  const marker = '/* ──────────────────────────────────────────────────────────────────────────\n   ' + title;
  const start = source.indexOf(marker);

  if (start === -1) return source;

  const next = source.indexOf(
    '/* ──────────────────────────────────────────────────────────────────────────',
    start + marker.length
  );
  const end = next === -1 ? source.length : next;

  console.log('Removed CSS patch: ' + title);
  return source.slice(0, start).trimEnd() + '\n\n' + source.slice(end).trimStart();
}

function appendPatch(relPath, title, patch) {
  let source = read(relPath);
  source = removePatchByTitle(source, title);
  write(relPath, source.trimEnd() + '\n\n' + patch + '\n');
}

/* ──────────────────────────────────────────────────────────────────────────
   1) Patch CustomersPage.jsx
   ────────────────────────────────────────────────────────────────────────── */

const customersPagePath = 'src/pages/CustomersPage.jsx';
let customersPage = read(customersPagePath);

customersPage = addLucideIcon(customersPage, 'Music2');

/**
 * Add option constants.
 */
if (!customersPage.includes('const clientTypeOptions = [')) {
  customersPage = replaceRequired(
    customersPage,
    [
      'const customerAlreadyMatchesBooking = (customers, booking) => (',
      '  customers.some((customer) => matchesCustomerBooking(customer, booking))',
      ');'
    ].join('\n'),
    [
      'const customerAlreadyMatchesBooking = (customers, booking) => (',
      '  customers.some((customer) => matchesCustomerBooking(customer, booking))',
      ');',
      '',
      "const clientTypeOptions = ['Band', 'Solo Artist', 'Content Creator', 'Podcaster', 'Producer', 'Komunitas', 'Umum'];",
      "const genreOptions = ['Pop', 'Rock', 'Metal', 'Indie', 'Jazz', 'Worship', 'Dangdut', 'EDM', 'Hip Hop', 'Podcast / Talk', 'Lainnya'];",
      "const needOptions = ['Rehearsal', 'Recording', 'Mixing', 'Podcast', 'Content', 'Event Prep', 'Lainnya'];",
      "const preferredTimeOptions = ['Pagi', 'Siang', 'Sore', 'Malam', 'Weekend', 'Fleksibel'];",
      "const paymentOptions = ['Cash', 'Transfer', 'QRIS', 'DP dulu', 'Fleksibel'];"
    ].join('\n'),
    'customer professional option constants'
  );
}

/**
 * Extend schema.
 */
if (!customersPage.includes('projectName: z.string().optional()')) {
  customersPage = replaceRequired(
    customersPage,
    [
      '  status: z.enum([\'Active\', \'Inactive\']),',
      '  isVIP: z.boolean().optional(),',
      '  notes: z.string().optional()',
      '});'
    ].join('\n'),
    [
      "  status: z.enum(['Active', 'Inactive']),",
      '  isVIP: z.boolean().optional(),',
      '  notes: z.string().optional(),',
      '  projectName: z.string().optional(),',
      '  clientType: z.string().optional(),',
      '  primaryGenre: z.string().optional(),',
      '  mainNeed: z.string().optional(),',
      '  memberCount: z.string().optional(),',
      '  preferredDuration: z.string().optional(),',
      '  preferredTime: z.string().optional(),',
      '  preferredDays: z.string().optional(),',
      '  socialLink: z.string().optional(),',
      '  gearNotes: z.string().optional(),',
      '  invoiceName: z.string().optional(),',
      '  paymentPreference: z.string().optional(),',
      '  clientLevel: z.string().optional()',
      '});'
    ].join('\n'),
    'customer schema professional fields'
  );
}

/**
 * Extend useForm default values.
 */
if (customersPage.includes("      notes: ''\n    }")) {
  customersPage = customersPage.replace(
    "      notes: ''\n    }",
    [
      "      notes: '',",
      "      projectName: '',",
      "      clientType: '',",
      "      primaryGenre: '',",
      "      mainNeed: '',",
      "      memberCount: '',",
      "      preferredDuration: '',",
      "      preferredTime: '',",
      "      preferredDays: '',",
      "      socialLink: '',",
      "      gearNotes: '',",
      "      invoiceName: '',",
      "      paymentPreference: '',",
      "      clientLevel: 'New'",
      "    }"
    ].join('\n')
  );
}

/**
 * Extend handleOpenNew reset.
 */
if (customersPage.includes("reset({ name: '', phone: '', email: '', instagram: '', address: '', status: 'Active', isVIP: false, notes: '' });")) {
  customersPage = customersPage.replace(
    "reset({ name: '', phone: '', email: '', instagram: '', address: '', status: 'Active', isVIP: false, notes: '' });",
    [
      'reset({',
      "      name: '',",
      "      phone: '',",
      "      email: '',",
      "      instagram: '',",
      "      address: '',",
      "      status: 'Active',",
      '      isVIP: false,',
      "      notes: '',",
      "      projectName: '',",
      "      clientType: '',",
      "      primaryGenre: '',",
      "      mainNeed: '',",
      "      memberCount: '',",
      "      preferredDuration: '',",
      "      preferredTime: '',",
      "      preferredDays: '',",
      "      socialLink: '',",
      "      gearNotes: '',",
      "      invoiceName: '',",
      "      paymentPreference: '',",
      "      clientLevel: 'New'",
      '    });'
    ].join('\n')
  );
}

/**
 * Extend handleOpenEdit reset.
 */
if (!customersPage.includes("projectName: customer.projectName || ''")) {
  customersPage = replaceRequired(
    customersPage,
    [
      "      status: customer.status || 'Active',",
      '      isVIP: customer.isVIP || false,',
      "      notes: customer.notes || ''",
      '    });'
    ].join('\n'),
    [
      "      status: customer.status || 'Active',",
      '      isVIP: customer.isVIP || false,',
      "      notes: customer.notes || '',",
      "      projectName: customer.projectName || '',",
      "      clientType: customer.clientType || '',",
      "      primaryGenre: customer.primaryGenre || '',",
      "      mainNeed: customer.mainNeed || '',",
      "      memberCount: customer.memberCount || '',",
      "      preferredDuration: customer.preferredDuration || '',",
      "      preferredTime: customer.preferredTime || '',",
      "      preferredDays: customer.preferredDays || '',",
      "      socialLink: customer.socialLink || '',",
      "      gearNotes: customer.gearNotes || '',",
      "      invoiceName: customer.invoiceName || '',",
      "      paymentPreference: customer.paymentPreference || '',",
      "      clientLevel: customer.clientLevel || 'New'",
      '    });'
    ].join('\n'),
    'handleOpenEdit professional reset'
  );
}

/**
 * Search professional fields.
 */
customersPage = customersPage.replace(
  "keys: ['name', 'phone', 'email', 'instagram', 'clientName', 'clientEmail', 'clientUid', 'linkedCustomerId', 'notes'],",
  "keys: ['name', 'phone', 'email', 'instagram', 'clientName', 'clientEmail', 'clientUid', 'linkedCustomerId', 'notes', 'projectName', 'clientType', 'primaryGenre', 'mainNeed', 'socialLink', 'gearNotes', 'invoiceName', 'paymentPreference'],"
);

/**
 * Link client account also copies pro fields.
 */
if (!customersPage.includes('projectName: selectedCustomer.projectName || clientAccount.projectName')) {
  customersPage = replaceRequired(
    customersPage,
    "      email: selectedCustomer.email || clientAccount.email || '',\n    };",
    [
      "      email: selectedCustomer.email || clientAccount.email || '',",
      "      projectName: selectedCustomer.projectName || clientAccount.projectName || clientAccount.clientName || '',",
      "      clientType: selectedCustomer.clientType || clientAccount.clientType || '',",
      "      primaryGenre: selectedCustomer.primaryGenre || clientAccount.primaryGenre || '',",
      "      mainNeed: selectedCustomer.mainNeed || clientAccount.mainNeed || '',",
      "      memberCount: selectedCustomer.memberCount || clientAccount.memberCount || '',",
      "      preferredDuration: selectedCustomer.preferredDuration || clientAccount.preferredDuration || '',",
      "      preferredTime: selectedCustomer.preferredTime || clientAccount.preferredTime || '',",
      "      preferredDays: selectedCustomer.preferredDays || clientAccount.preferredDays || '',",
      "      socialLink: selectedCustomer.socialLink || clientAccount.socialLink || '',",
      "      gearNotes: selectedCustomer.gearNotes || clientAccount.gearNotes || '',",
      "      invoiceName: selectedCustomer.invoiceName || clientAccount.invoiceName || '',",
      "      paymentPreference: selectedCustomer.paymentPreference || clientAccount.paymentPreference || '',",
      "      clientLevel: selectedCustomer.clientLevel || clientAccount.clientLevel || 'New',",
      '    };'
    ].join('\n'),
    'handleLinkClientAccount professional patch'
  );
}

/**
 * Customer row pro tags.
 */
if (!customersPage.includes('customer-pro-tags')) {
  customersPage = replaceRequired(
    customersPage,
    '                              {customer.notes && <span className="customer-note">{customer.notes}</span>}',
    [
      '                              {(customer.projectName || customer.clientType || customer.primaryGenre || customer.mainNeed) && (',
      '                                <span className="customer-pro-tags">',
      "                                  {[customer.projectName, customer.clientType, customer.primaryGenre, customer.mainNeed].filter(Boolean).slice(0, 3).join(' • ')}",
      '                                </span>',
      '                              )}',
      '                              {customer.notes && <span className="customer-note">{customer.notes}</span>}'
    ].join('\n'),
    'customer row professional tags'
  );
}

/**
 * Detail panel professional profile.
 */
const professionalDetailSection = [
  '              <div className="detail-section professional-profile-section">',
  '                <h4 className="section-title">Professional Profile</h4>',
  '                <div className="customer-pro-card">',
  '                  <div>',
  '                    <span>Project</span>',
  '                    <strong>{selectedCustomer.projectName || selectedCustomer.name}</strong>',
  '                  </div>',
  '                  <div>',
  '                    <span>Tipe</span>',
  '                    <strong>{selectedCustomer.clientType || \'-\'}</strong>',
  '                  </div>',
  '                  <div>',
  '                    <span>Genre</span>',
  '                    <strong>{selectedCustomer.primaryGenre || \'-\'}</strong>',
  '                  </div>',
  '                  <div>',
  '                    <span>Kebutuhan</span>',
  '                    <strong>{selectedCustomer.mainNeed || \'-\'}</strong>',
  '                  </div>',
  '                  <div>',
  '                    <span>Personel</span>',
  '                    <strong>{selectedCustomer.memberCount || \'-\'}</strong>',
  '                  </div>',
  '                  <div>',
  '                    <span>Durasi favorit</span>',
  '                    <strong>{selectedCustomer.preferredDuration ? selectedCustomer.preferredDuration + \' jam\' : \'-\'}</strong>',
  '                  </div>',
  '                  <div>',
  '                    <span>Waktu favorit</span>',
  '                    <strong>{selectedCustomer.preferredTime || selectedCustomer.preferredDays || \'-\'}</strong>',
  '                  </div>',
  '                  <div>',
  '                    <span>Pembayaran</span>',
  '                    <strong>{selectedCustomer.paymentPreference || \'-\'}</strong>',
  '                  </div>',
  '                </div>',
  '                {selectedCustomer.socialLink && <div className="detail-item"><AtSign size={14} /> <span>{selectedCustomer.socialLink}</span></div>}',
  '                {selectedCustomer.invoiceName && <div className="detail-item"><Mail size={14} /> <span>Invoice: {selectedCustomer.invoiceName}</span></div>}',
  '                {selectedCustomer.gearNotes && <p className="detail-notes gear-notes">{selectedCustomer.gearNotes}</p>}',
  '              </div>',
  ''
].join('\n');

customersPage = insertBeforeOnce(
  customersPage,
  '              {/* Membership Tier */}',
  'professional-profile-section',
  professionalDetailSection,
  'professional detail section'
);

/**
 * Admin modal professional form sections.
 */
const professionalFormSections = [
  '          {/* Section: Studio Profile */}',
  '          <div className="cf-section customer-pro-form-section">',
  '            <div className="cf-section-title"><Music2 size={12} /> Studio Profile</div>',
  '            <div className="cf-row">',
  '              <div className="cf-field">',
  '                <label className="cf-label">Nama Band / Project</label>',
  '                <input type="text" placeholder="contoh: Naufal Band" className="cf-input" {...register(\'projectName\')} />',
  '              </div>',
  '              <div className="cf-field">',
  '                <label className="cf-label">Tipe Client</label>',
  '                <select className="cf-input" {...register(\'clientType\')}>',
  '                  <option value="">Pilih tipe</option>',
  '                  {clientTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}',
  '                </select>',
  '              </div>',
  '            </div>',
  '            <div className="cf-row">',
  '              <div className="cf-field">',
  '                <label className="cf-label">Genre / Kategori</label>',
  '                <select className="cf-input" {...register(\'primaryGenre\')}>',
  '                  <option value="">Pilih genre</option>',
  '                  {genreOptions.map((option) => <option key={option} value={option}>{option}</option>)}',
  '                </select>',
  '              </div>',
  '              <div className="cf-field">',
  '                <label className="cf-label">Kebutuhan Utama</label>',
  '                <select className="cf-input" {...register(\'mainNeed\')}>',
  '                  <option value="">Pilih kebutuhan</option>',
  '                  {needOptions.map((option) => <option key={option} value={option}>{option}</option>)}',
  '                </select>',
  '              </div>',
  '            </div>',
  '            <div className="cf-row">',
  '              <div className="cf-field">',
  '                <label className="cf-label">Jumlah Personel</label>',
  '                <input type="text" placeholder="contoh: 4" className="cf-input" {...register(\'memberCount\')} />',
  '              </div>',
  '              <div className="cf-field">',
  '                <label className="cf-label">Social / Portfolio</label>',
  '                <input type="text" placeholder="Instagram, YouTube, Spotify..." className="cf-input" {...register(\'socialLink\')} />',
  '              </div>',
  '            </div>',
  '          </div>',
  '',
  '          {/* Section: Booking Preference */}',
  '          <div className="cf-section customer-pro-form-section">',
  '            <div className="cf-section-title"><Clock size={12} /> Booking Preference</div>',
  '            <div className="cf-row">',
  '              <div className="cf-field">',
  '                <label className="cf-label">Durasi Favorit</label>',
  '                <select className="cf-input" {...register(\'preferredDuration\')}>',
  '                  <option value="">Pilih durasi</option>',
  '                  <option value="1">1 jam</option>',
  '                  <option value="2">2 jam</option>',
  '                  <option value="3">3 jam</option>',
  '                  <option value="4">4 jam</option>',
  '                  <option value="5">5 jam</option>',
  '                </select>',
  '              </div>',
  '              <div className="cf-field">',
  '                <label className="cf-label">Waktu Favorit</label>',
  '                <select className="cf-input" {...register(\'preferredTime\')}>',
  '                  <option value="">Pilih waktu</option>',
  '                  {preferredTimeOptions.map((option) => <option key={option} value={option}>{option}</option>)}',
  '                </select>',
  '              </div>',
  '            </div>',
  '            <div className="cf-row">',
  '              <div className="cf-field">',
  '                <label className="cf-label">Hari Favorit</label>',
  '                <input type="text" placeholder="contoh: Sabtu malam" className="cf-input" {...register(\'preferredDays\')} />',
  '              </div>',
  '              <div className="cf-field">',
  '                <label className="cf-label">Preferensi Pembayaran</label>',
  '                <select className="cf-input" {...register(\'paymentPreference\')}>',
  '                  <option value="">Pilih metode</option>',
  '                  {paymentOptions.map((option) => <option key={option} value={option}>{option}</option>)}',
  '                </select>',
  '              </div>',
  '            </div>',
  '            <div className="cf-row">',
  '              <div className="cf-field">',
  '                <label className="cf-label">Nama Invoice</label>',
  '                <input type="text" placeholder="nama untuk invoice" className="cf-input" {...register(\'invoiceName\')} />',
  '              </div>',
  '              <div className="cf-field">',
  '                <label className="cf-label">Level Client</label>',
  '                <input type="text" placeholder="New / Regular / VIP / Partner" className="cf-input" {...register(\'clientLevel\')} />',
  '              </div>',
  '            </div>',
  '            <div className="cf-field">',
  '              <label className="cf-label">Catatan Gear / Setup</label>',
  '              <textarea placeholder="Mic extra, DI box, keyboard, setup drum, request operator..." className="cf-input cf-textarea" rows="2" {...register(\'gearNotes\')} />',
  '            </div>',
  '          </div>',
  ''
].join('\n');

customersPage = insertBeforeOnce(
  customersPage,
  '          {/* Section: Status & VIP */}',
  'customer-pro-form-section',
  professionalFormSections,
  'professional modal form sections'
);

const requiredCustomerPageSnippets = [
  'clientTypeOptions',
  'projectName',
  'Professional Profile',
  'Booking Preference',
  'customer-pro-card',
  'customer-pro-tags',
  'customer-pro-form-section',
  'Music2',
];

for (const snippet of requiredCustomerPageSnippets) {
  if (!customersPage.includes(snippet)) {
    throw new Error('CustomersPage belum lengkap. Missing: ' + snippet);
  }
}

write(customersPagePath, customersPage);

/* ──────────────────────────────────────────────────────────────────────────
   2) CSS patch Client Portal
   ────────────────────────────────────────────────────────────────────────── */

const clientCssPatch = [
  '/* ──────────────────────────────────────────────────────────────────────────',
  '   37 PROFESSIONAL CLIENT PROFILE 7.0N',
  '   --------------------------------------------------------------------------',
  '   Adds professional client profile fields and identity card polish.',
  '   ────────────────────────────────────────────────────────────────────────── */',
  '',
  '.client-profile-pro-layout {',
  '  grid-template-columns: minmax(0, 1fr) minmax(310px, 0.45fr) !important;',
  '}',
  '',
  '.client-identity-card {',
  '  align-content: start;',
  '}',
  '',
  '.client-id-meta-grid {',
  '  grid-column: 1 / -1;',
  '  display: grid;',
  '  grid-template-columns: repeat(2, minmax(0, 1fr));',
  '  gap: 7px;',
  '  margin-top: 10px;',
  '}',
  '',
  '.client-id-meta-grid span {',
  '  min-height: 34px;',
  '  display: inline-flex;',
  '  align-items: center;',
  '  justify-content: center;',
  '  padding: 0 9px;',
  '  border-radius: 999px;',
  '  color: var(--client-muted-strong);',
  '  background: rgba(255,255,255,0.040);',
  '  border: 1px solid rgba(255,255,255,0.070);',
  '  font-size: 0.72rem;',
  '  font-weight: 850;',
  '}',
  '',
  '.client-profile-section-block {',
  '  display: grid;',
  '  gap: 12px;',
  '  padding: 14px;',
  '  border-radius: 22px;',
  '  border: 1px solid rgba(255,255,255,0.070);',
  '  background:',
  '    radial-gradient(circle at 0% 0%, rgba(239,197,110,0.060), transparent 42%),',
  '    rgba(255,255,255,0.022);',
  '}',
  '',
  '.client-profile-section-title {',
  '  display: inline-flex;',
  '  align-items: center;',
  '  gap: 8px;',
  '  color: var(--client-gold);',
  '  font-size: 0.72rem;',
  '  font-weight: 950;',
  '  letter-spacing: 0.075em;',
  '  text-transform: uppercase;',
  '}',
  '',
  '.client-profile-form-grid.two {',
  '  display: grid;',
  '  grid-template-columns: repeat(2, minmax(0, 1fr));',
  '  gap: 12px;',
  '}',
  '',
  '.client-profile-input-wrap select,',
  '.client-profile-input-wrap textarea {',
  '  width: 100%;',
  '  border: 0;',
  '  outline: 0;',
  '  color: var(--client-ink);',
  '  background: transparent;',
  '  font: inherit;',
  '  font-weight: 760;',
  '}',
  '',
  '.client-profile-input-wrap.textarea-wrap {',
  '  align-items: flex-start;',
  '  padding-top: 12px;',
  '  min-height: 112px !important;',
  '}',
  '',
  '.client-profile-input-wrap.textarea-wrap textarea {',
  '  min-height: 90px;',
  '  resize: vertical;',
  '  line-height: 1.45;',
  '}',
  '',
  '.client-profile-readiness-list.pro {',
  '  max-height: none;',
  '}',
  '',
  '[data-theme="light"] .client-profile-section-block,',
  '[data-theme="light"] .client-id-meta-grid span {',
  '  background: rgba(255,255,255,0.58);',
  '  border-color: rgba(78,54,28,0.085);',
  '}',
  '',
  '@media (max-width: 980px) {',
  '  .client-profile-pro-layout {',
  '    grid-template-columns: 1fr !important;',
  '  }',
  '}',
  '',
  '@media (max-width: 720px) {',
  '  .client-profile-form-grid.two,',
  '  .client-id-meta-grid {',
  '    grid-template-columns: 1fr;',
  '  }',
  '',
  '  .client-profile-section-block {',
  '    padding: 12px;',
  '    border-radius: 20px;',
  '  }',
  '}'
].join('\n');

appendPatch(
  'src/pages/ClientPortal.css',
  '37 PROFESSIONAL CLIENT PROFILE 7.0N',
  clientCssPatch
);

/* ──────────────────────────────────────────────────────────────────────────
   3) CSS patch Admin Customers
   ────────────────────────────────────────────────────────────────────────── */

const customersCssPatch = [
  '/* ──────────────────────────────────────────────────────────────────────────',
  '   37 ADMIN CUSTOMER PROFESSIONAL PROFILE 7.0N',
  '   --------------------------------------------------------------------------',
  '   Adds professional customer profile display and form polish to admin portal.',
  '   ────────────────────────────────────────────────────────────────────────── */',
  '',
  '.customer-pro-tags {',
  '  display: inline-flex;',
  '  width: fit-content;',
  '  max-width: 100%;',
  '  margin-top: 4px;',
  '  padding: 3px 8px;',
  '  border-radius: 999px;',
  '  color: var(--accent-cyan);',
  '  background: rgba(0, 240, 255, 0.075);',
  '  border: 1px solid rgba(0, 240, 255, 0.14);',
  '  font-size: 0.68rem;',
  '  font-weight: 800;',
  '  white-space: nowrap;',
  '  overflow: hidden;',
  '  text-overflow: ellipsis;',
  '}',
  '',
  '.professional-profile-section {',
  '  border: 1px solid rgba(0, 240, 255, 0.11);',
  '  border-radius: 18px;',
  '  padding: 12px;',
  '  background:',
  '    radial-gradient(circle at 0% 0%, rgba(0, 240, 255, 0.08), transparent 42%),',
  '    rgba(255,255,255,0.020);',
  '}',
  '',
  '.customer-pro-card {',
  '  display: grid;',
  '  grid-template-columns: repeat(2, minmax(0, 1fr));',
  '  gap: 8px;',
  '}',
  '',
  '.customer-pro-card > div {',
  '  min-height: 62px;',
  '  display: grid;',
  '  align-content: center;',
  '  gap: 4px;',
  '  padding: 10px;',
  '  border-radius: 14px;',
  '  border: 1px solid rgba(255,255,255,0.065);',
  '  background: rgba(255,255,255,0.025);',
  '}',
  '',
  '.customer-pro-card span {',
  '  color: var(--text-muted);',
  '  font-size: 0.66rem;',
  '  font-weight: 850;',
  '  text-transform: uppercase;',
  '  letter-spacing: 0.05em;',
  '}',
  '',
  '.customer-pro-card strong {',
  '  color: var(--text-primary);',
  '  font-size: 0.86rem;',
  '  font-weight: 900;',
  '  overflow: hidden;',
  '  text-overflow: ellipsis;',
  '  white-space: nowrap;',
  '}',
  '',
  '.detail-notes.gear-notes {',
  '  margin-top: 9px;',
  '  padding: 10px;',
  '  border-radius: 14px;',
  '  border: 1px solid rgba(255,255,255,0.065);',
  '  background: rgba(255,255,255,0.025);',
  '}',
  '',
  '.customer-pro-form-section {',
  '  border: 1px solid rgba(0, 240, 255, 0.10);',
  '  border-radius: 18px;',
  '  padding: 12px;',
  '  background:',
  '    radial-gradient(circle at 0% 0%, rgba(0, 240, 255, 0.06), transparent 42%),',
  '    rgba(255,255,255,0.012);',
  '}',
  '',
  '.customer-pro-form-section select.cf-input {',
  '  appearance: none;',
  '}',
  '',
  '@media (max-width: 720px) {',
  '  .customer-pro-card {',
  '    grid-template-columns: 1fr;',
  '  }',
  '',
  '  .customer-pro-tags {',
  '    white-space: normal;',
  '  }',
  '}'
].join('\n');

appendPatch(
  'src/pages/CustomersPage.css',
  '37 ADMIN CUSTOMER PROFESSIONAL PROFILE 7.0N',
  customersCssPatch
);

/* ──────────────────────────────────────────────────────────────────────────
   4) Sanity checks
   ────────────────────────────────────────────────────────────────────────── */

const checks = [
  ['src/store/useAuthStore.js', ['extraProfileData', 'projectName', 'profileUpdatedAt']],
  ['src/pages/ClientProfilePage.jsx', ['Professional client profile', 'Studio Profile', 'Booking Preference', 'Simpan Professional Profile']],
  ['src/pages/PublicCalendarPage.jsx', ['clientType: userProfile?.clientType', 'gearNotes: userProfile?.gearNotes']],
  ['src/store/useCustomerStore.js', ['primaryGenre', 'paymentPreference', 'clientLevel']],
  ['src/pages/CustomersPage.jsx', ['Professional Profile', 'customer-pro-card', 'Booking Preference', 'clientTypeOptions']],
  ['src/pages/ClientPortal.css', ['37 PROFESSIONAL CLIENT PROFILE 7.0N']],
  ['src/pages/CustomersPage.css', ['37 ADMIN CUSTOMER PROFESSIONAL PROFILE 7.0N']],
];

for (const [filePath, snippets] of checks) {
  const content = read(filePath);
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      throw new Error(filePath + ' missing snippet: ' + snippet);
    }
  }
}

const audit = [
  '37 Music Studio — Phase 7.0N Continue Admin Customer Professional Profile',
  'Generated: ' + new Date().toISOString(),
  '',
  'Files touched:',
  '- src/pages/CustomersPage.jsx',
  '- src/pages/ClientPortal.css',
  '- src/pages/CustomersPage.css',
  '',
  'Fixed:',
  '- Continued after previous partial success.',
  '- Added admin Customers professional profile form fields.',
  '- Added Professional Profile detail section.',
  '- Added table professional tags.',
  '- Added admin/customer CSS polish.',
  '- Added client profile CSS polish.',
  '',
  'Previous script already patched:',
  '- src/store/useAuthStore.js',
  '- src/pages/ClientProfilePage.jsx',
  '- src/pages/PublicCalendarPage.jsx',
  '- src/store/useCustomerStore.js',
].join('\n');

fs.writeFileSync(abs('phase70n-continue-admin-customer-professional-profile-audit.txt'), audit, 'utf8');

console.log('Audit dibuat: phase70n-continue-admin-customer-professional-profile-audit.txt');
console.log('\nPhase 7.0N continuation selesai bro.');
console.log('Admin Customers + CSS sudah nyambung ke Professional Client Profile.');
console.log('Lanjut otomatis: npm run lint -> npm test -> npm run build');