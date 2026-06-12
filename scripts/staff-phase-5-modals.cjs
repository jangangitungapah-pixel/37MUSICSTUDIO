const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const FILES = {
  staffPageJsx: "src/pages/StaffPage.jsx",
  staffPageCss: "src/pages/StaffPage.css",
};

const CSS_START = "/* === START STAFF MODALS PHASE 5 === */";
const CSS_END = "/* === END STAFF MODALS PHASE 5 === */";

function abs(file) {
  return path.join(ROOT, file);
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function verifyFileExists(file) {
  if (!fs.existsSync(abs(file))) {
    throw new Error(`Required file not found: ${file}`);
  }
}

function readUtf8(file) {
  verifyFileExists(file);
  return fs.readFileSync(abs(file), "utf8");
}

function backupFile(file) {
  const target = abs(file);
  if (!fs.existsSync(target)) return;

  const backup = `${target}.bak-${nowStamp()}`;
  fs.copyFileSync(target, backup);
}

function writeIfChanged(file, content) {
  const target = abs(file);
  const previous = fs.existsSync(target)
    ? fs.readFileSync(target, "utf8")
    : null;

  if (previous === content) {
    console.log(`[unchanged] ${file}`);
    return false;
  }

  backupFile(file);
  fs.writeFileSync(target, content, "utf8");
  console.log(`[written] ${file}`);
  return true;
}

function verifyContains(content, needle, label) {
  if (!content.includes(needle)) {
    throw new Error(`Anchor not found: ${label} -> ${needle}`);
  }
}

function countOccurrences(content, needle) {
  return content.split(needle).length - 1;
}

function stripMarkedBlock(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 && end === -1) return content;

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Broken marker block: ${startMarker}`);
  }

  const afterEnd = end + endMarker.length;
  return `${content.slice(0, start).trimEnd()}\n\n${content
    .slice(afterEnd)
    .trimStart()}`;
}

function addClassTokenToExact(content, exactClass, token, label, minExpected = 1) {
  const exact = `className="${exactClass}"`;
  const already = `className="${exactClass} ${token}"`;

  if (content.includes(already)) {
    console.log(`[jsx] ${label} already patched.`);
    return content;
  }

  const count = countOccurrences(content, exact);

  if (count < minExpected) {
    throw new Error(
      `Expected at least ${minExpected} occurrence(s) for ${label}, found ${count}`
    );
  }

  return content.replaceAll(exact, already);
}

function patchJsx(content) {
  verifyContains(content, 'className="app-page staff-page"', "Staff page root");
  verifyContains(content, "<Modal", "Modal usage");
  verifyContains(content, "onSubmitStaff", "staff submit handler");
  verifyContains(content, "onSubmitResetPassword", "reset password submit handler");
  verifyContains(content, "register", "react-hook-form register");
  verifyContains(content, "errors", "react-hook-form errors");
  verifyContains(content, "handleRoleChange", "role change handler");
  verifyContains(content, "handlePermissionToggle", "permission toggle handler");
  verifyContains(content, "PERMISSIONS", "permissions list");
  verifyContains(content, "watchedRole", "watchedRole usage");
  verifyContains(content, "watchedPermissions", "watchedPermissions usage");
  verifyContains(content, "permission-grid", "permission grid class");
  verifyContains(content, "permission-card", "permission card class");
  verifyContains(content, "bf-actions", "form actions class");

  let next = content;

  next = addClassTokenToExact(
    next,
    "staff-form",
    "staff-form-modern",
    "staff form modern class",
    1
  );

  next = addClassTokenToExact(
    next,
    "bf-actions",
    "staff-modal-actions",
    "staff modal actions class",
    1
  );

  next = addClassTokenToExact(
    next,
    "permission-grid",
    "staff-permission-grid-modern",
    "staff permission grid modern class",
    1
  );

  verifyContains(next, "staff-form-modern", "staff form modern class added");
  verifyContains(next, "staff-modal-actions", "staff modal actions class added");
  verifyContains(
    next,
    "staff-permission-grid-modern",
    "permission grid modern class added"
  );

  verifyContains(next, "onSubmitStaff", "staff submit handler preserved");
  verifyContains(
    next,
    "onSubmitResetPassword",
    "reset password submit handler preserved"
  );
  verifyContains(next, "handleRoleChange", "role change handler preserved");
  verifyContains(
    next,
    "handlePermissionToggle",
    "permission toggle handler preserved"
  );

  return next;
}

function patchCss(content) {
  verifyContains(content, ".staff-form", "staff form selector");
  verifyContains(content, ".permission-grid", "permission grid selector");
  verifyContains(content, ".permission-card", "permission card selector");
  verifyContains(content, ".cf-error-message", "error message selector");
  verifyContains(content, "STAFF CARD GRID PHASE 4", "Phase 4 CSS marker");

  let next = stripMarkedBlock(content, CSS_START, CSS_END);

  const cssBlock = `
${CSS_START}

.staff-form-modern {
  display: grid;
  gap: 14px;
}

.staff-form-modern::before {
  content: "";
  display: block;
  height: 1px;
  margin-bottom: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--accent-cyan-rgb), 0.38),
    rgba(var(--accent-pink-rgb), 0.32),
    transparent
  );
  opacity: 0.8;
}

.staff-form-modern .bf-row {
  gap: 12px;
}

.staff-form-modern .form-group {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.staff-form-modern .bf-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 820;
  letter-spacing: 0.025em;
}

.staff-form-modern .bf-required {
  color: var(--accent-pink);
}

.staff-form-modern .bf-input {
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 15px;
  color: var(--text-primary);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.065), rgba(255, 255, 255, 0.026)),
    rgba(0, 0, 0, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.075),
    0 10px 24px rgba(0, 0, 0, 0.12);
  font-size: 0.88rem;
  transition:
    border-color var(--fluent-duration-fast) var(--fluent-curve-easy-ease),
    box-shadow var(--fluent-duration-fast) var(--fluent-curve-easy-ease),
    background var(--fluent-duration-fast) var(--fluent-curve-easy-ease);
}

.staff-form-modern .bf-input:hover {
  border-color: rgba(var(--accent-cyan-rgb), 0.22);
}

.staff-form-modern .bf-input:focus {
  border-color: rgba(var(--accent-cyan-rgb), 0.42);
  background:
    linear-gradient(135deg, rgba(var(--accent-cyan-rgb), 0.08), rgba(255, 255, 255, 0.028)),
    rgba(0, 0, 0, 0.12);
  box-shadow:
    0 0 0 3px rgba(var(--accent-cyan-rgb), 0.11),
    inset 0 1px 0 rgba(255, 255, 255, 0.095);
}

.staff-form-modern select.bf-input {
  cursor: pointer;
}

.staff-form-modern .cf-error-message {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 5px 8px;
  border: 1px solid rgba(var(--accent-pink-rgb), 0.22);
  border-radius: 999px;
  color: rgba(255, 190, 204, 0.96);
  background: rgba(var(--accent-pink-rgb), 0.08);
  font-size: 0.72rem;
  font-weight: 720;
  line-height: 1.2;
}

.staff-form-modern .staff-permission-grid-modern {
  max-height: min(42vh, 360px);
  overflow: auto;
  padding: 2px 4px 4px 2px;
  gap: 9px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--accent-cyan-rgb), 0.42) transparent;
}

.staff-form-modern .staff-permission-grid-modern::-webkit-scrollbar {
  width: 8px;
}

.staff-form-modern .staff-permission-grid-modern::-webkit-scrollbar-track {
  background: transparent;
}

.staff-form-modern .staff-permission-grid-modern::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: rgba(var(--accent-cyan-rgb), 0.38);
  background-clip: content-box;
}

.staff-form-modern .permission-card {
  min-height: 48px;
  padding: 10px 11px;
  border: 1px solid rgba(255, 255, 255, 0.085);
  border-radius: 15px;
  background:
    radial-gradient(circle at top left, rgba(var(--accent-cyan-rgb), 0.075), transparent 38%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.058), rgba(255, 255, 255, 0.022));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 10px 22px rgba(0, 0, 0, 0.12);
  transition:
    transform var(--fluent-duration-fast) var(--fluent-curve-easy-ease),
    border-color var(--fluent-duration-fast) var(--fluent-curve-easy-ease),
    background var(--fluent-duration-fast) var(--fluent-curve-easy-ease);
}

.staff-form-modern .permission-card:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--accent-cyan-rgb), 0.22);
  background:
    radial-gradient(circle at top left, rgba(var(--accent-cyan-rgb), 0.12), transparent 38%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.068), rgba(255, 255, 255, 0.026));
}

.staff-form-modern .permission-card.active,
.staff-form-modern .permission-card[aria-pressed="true"] {
  border-color: rgba(var(--accent-pink-rgb), 0.34);
  background:
    radial-gradient(circle at top left, rgba(var(--accent-pink-rgb), 0.16), transparent 38%),
    linear-gradient(135deg, rgba(var(--accent-cyan-rgb), 0.1), rgba(255, 255, 255, 0.026));
}

.staff-form-modern .permission-card:disabled,
.staff-form-modern .permission-card.disabled {
  cursor: not-allowed;
  opacity: 0.58;
  filter: grayscale(0.22);
}

.staff-form-modern .permission-icon {
  width: 30px;
  height: 30px;
  border-radius: 11px;
  background:
    radial-gradient(circle at 28% 24%, rgba(var(--accent-cyan-rgb), 0.24), transparent 42%),
    rgba(255, 255, 255, 0.055);
}

.staff-form-modern .permission-icon svg {
  width: 15px;
  height: 15px;
}

.staff-form-modern .permission-label {
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 760;
  line-height: 1.25;
}

.staff-form-modern .staff-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 2px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.075);
}

.staff-form-modern .staff-modal-actions .btn-secondary,
.staff-form-modern .staff-modal-actions .btn-primary {
  min-height: 39px;
  padding: 9px 15px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 820;
}

.staff-form-modern .staff-modal-actions .btn-secondary {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: rgba(255, 255, 255, 0.052);
}

.staff-form-modern .staff-modal-actions .btn-primary {
  box-shadow:
    0 12px 28px rgba(var(--accent-pink-rgb), 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

@media (min-width: 760px) {
  .staff-form-modern .staff-permission-grid-modern {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1120px) {
  .staff-form-modern .staff-permission-grid-modern {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .staff-form-modern {
    gap: 12px;
  }

  .staff-form-modern .bf-row {
    grid-template-columns: 1fr;
    gap: 11px;
  }

  .staff-form-modern .bf-input {
    min-height: 40px;
    border-radius: 14px;
    font-size: 0.86rem;
  }

  .staff-form-modern .staff-permission-grid-modern {
    grid-template-columns: 1fr;
    max-height: 34vh;
    gap: 8px;
  }

  .staff-form-modern .permission-card {
    min-height: 46px;
    padding: 9px 10px;
    border-radius: 14px;
  }

  .staff-form-modern .staff-modal-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .staff-form-modern .staff-modal-actions .btn-secondary,
  .staff-form-modern .staff-modal-actions .btn-primary {
    width: 100%;
    justify-content: center;
  }
}

${CSS_END}
`;

  return `${next.trimEnd()}\n\n${cssBlock.trim()}\n`;
}

function main() {
  console.log("[staff-phase-5-modals] Starting...");

  const jsx = readUtf8(FILES.staffPageJsx);
  const css = readUtf8(FILES.staffPageCss);

  const nextJsx = patchJsx(jsx);
  const nextCss = patchCss(css);

  writeIfChanged(FILES.staffPageJsx, nextJsx);
  writeIfChanged(FILES.staffPageCss, nextCss);

  console.log("[staff-phase-5-modals] Done.");
}

main();