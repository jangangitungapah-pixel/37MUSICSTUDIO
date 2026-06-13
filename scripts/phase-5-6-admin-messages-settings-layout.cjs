const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

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

function stripMarkedBlock(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 && end === -1) return content;

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Broken marker block: ${startMarker}`);
  }

  const afterEnd = end + endMarker.length;
  return `${content.slice(0, start).trimEnd()}\n\n${content.slice(afterEnd).trimStart()}`;
}

function main() {
  console.log("== Phase 5.6 Admin Messages Settings-Like Layout Stabilization ==");
  console.log("Mode: CSS-only layout patch with container queries");

  const cssFile = "src/pages/ClientMessagesInbox.css";
  const jsxFile = "src/pages/ClientMessagesPage.jsx";

  let css = readUtf8(cssFile);
  const jsx = readUtf8(jsxFile);

  verifyContains(css, ".messages-inbox-page", "admin inbox page scope");
  verifyContains(css, ".messages-inbox-hero", "admin inbox hero");
  verifyContains(css, ".messages-inbox-metrics", "admin inbox metrics");
  verifyContains(css, ".messages-inbox-shell", "admin inbox shell");
  verifyContains(css, ".inbox-sidebar", "mailbox sidebar");
  verifyContains(css, ".inbox-folder-list", "folder list");
  verifyContains(css, ".inbox-list-panel", "list panel");
  verifyContains(css, ".inbox-detail-panel", "detail panel");
  verifyContains(css, ".inbox-search", "search input");
  verifyContains(css, "@media (max-width: 680px)", "mobile media query");

  verifyContains(jsx, "messages-page messages-inbox-page", "admin messages root class");
  verifyContains(jsx, "messages-inbox-hero", "hero JSX");
  verifyContains(jsx, "messages-inbox-shell", "shell JSX");
  verifyContains(jsx, "inbox-folder-list", "folder list JSX");
  verifyContains(jsx, "inbox-list-panel", "list panel JSX");
  verifyContains(jsx, "inbox-detail-panel", "detail panel JSX");

  const startMarker = "/* === START ADMIN MESSAGES SETTINGS-LIKE LAYOUT STABILIZATION PHASE 5.6 === */";
  const endMarker = "/* === END ADMIN MESSAGES SETTINGS-LIKE LAYOUT STABILIZATION PHASE 5.6 === */";

  css = stripMarkedBlock(css, startMarker, endMarker);

  const block = `
${startMarker}

/*
  Kiblat layout: Settings page.
  - Page shell vertical and calm.
  - Header readable before metrics.
  - Folder nav becomes a horizontal tab strip when the actual page container is narrow.
  - Uses container queries because app sidebar can shrink the content while viewport is still desktop-sized.
*/

.messages-inbox-page {
  width: 100%;
  max-width: 1180px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  container-type: inline-size;
}

.messages-inbox-page .messages-inbox-hero {
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
  gap: 18px;
  padding: clamp(18px, 2.4vw, 28px);
  border-radius: 24px;
}

.messages-inbox-page .messages-inbox-titleblock {
  min-width: 0;
}

.messages-inbox-page .messages-inbox-titleblock h1 {
  max-width: 100%;
  font-size: clamp(2.7rem, 7cqi, 5.6rem);
  line-height: 0.9;
  overflow-wrap: normal;
  text-wrap: balance;
}

.messages-inbox-page .messages-inbox-titleblock p {
  max-width: 820px;
  font-size: clamp(0.86rem, 1.5cqi, 1rem);
  line-height: 1.55;
  text-wrap: pretty;
}

.messages-inbox-page .messages-inbox-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
}

.messages-inbox-page .messages-metric-card {
  min-height: 96px;
  padding: 14px;
  border-radius: 18px;
}

.messages-inbox-page .messages-metric-card strong {
  font-size: clamp(1.9rem, 4cqi, 2.8rem);
}

.messages-inbox-page .messages-metric-card span,
.messages-inbox-page .messages-metric-card small {
  overflow-wrap: anywhere;
}

.messages-inbox-page .messages-inbox-shell {
  grid-template-columns: 220px minmax(280px, 0.9fr) minmax(340px, 1.1fr);
  gap: 12px;
  padding: 12px;
  border-radius: 24px;
}

.messages-inbox-page .inbox-sidebar,
.messages-inbox-page .inbox-list-panel,
.messages-inbox-page .inbox-detail-panel {
  border-radius: 20px;
}

.messages-inbox-page .inbox-sidebar {
  gap: 12px;
  padding: 12px;
}

.messages-inbox-page .inbox-folder-btn {
  min-height: 54px;
  border-radius: 16px;
}

.messages-inbox-page .inbox-list-toolbar {
  gap: 10px;
  padding: 12px;
}

.messages-inbox-page .inbox-search {
  min-width: 0;
}

.messages-inbox-page .inbox-search input {
  min-width: 0;
  font-size: 0.8rem;
}

.messages-inbox-page .inbox-empty-state,
.messages-inbox-page .inbox-detail-empty {
  min-height: 280px;
}

/* Container responsive: fires when the admin content area shrinks because the app sidebar is open. */
@container (max-width: 980px) {
  .messages-inbox-page {
    max-width: 760px;
    gap: 16px;
  }

  .messages-inbox-page .messages-inbox-hero {
    padding: 18px;
  }

  .messages-inbox-page .messages-inbox-titleblock h1 {
    font-size: clamp(2.4rem, 8cqi, 4.1rem);
  }

  .messages-inbox-page .messages-inbox-metrics {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .messages-inbox-page .messages-metric-card {
    min-height: 70px;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    align-content: center;
  }

  .messages-inbox-page .messages-metric-card span {
    grid-column: 1;
  }

  .messages-inbox-page .messages-metric-card strong {
    grid-column: 2;
    grid-row: 1 / span 2;
    justify-self: end;
    font-size: 2rem;
  }

  .messages-inbox-page .messages-metric-card small {
    grid-column: 1;
  }

  .messages-inbox-page .messages-inbox-shell {
    grid-template-columns: 1fr;
    min-height: unset;
    overflow: visible;
  }

  .messages-inbox-page .inbox-sidebar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
  }

  .messages-inbox-page .inbox-sidebar-header {
    min-height: 44px;
    padding: 0;
  }

  .messages-inbox-page .inbox-folder-list {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    min-width: 0;
    overflow-x: auto;
    padding: 2px 2px 4px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .messages-inbox-page .inbox-folder-list::-webkit-scrollbar {
    display: none;
  }

  .messages-inbox-page .inbox-folder-list::after {
    content: "";
    flex: 0 0 4px;
  }

  .messages-inbox-page .inbox-folder-btn {
    flex: 0 0 auto;
    width: auto;
    min-width: 156px;
    max-width: 180px;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    min-height: 58px;
    padding: 8px;
  }

  .messages-inbox-page .inbox-folder-copy strong,
  .messages-inbox-page .inbox-folder-copy small {
    white-space: normal;
    line-height: 1.25;
  }

  .messages-inbox-page .inbox-sidebar-note {
    display: none;
  }

  .messages-inbox-page .inbox-message-list {
    max-height: none;
    min-height: 280px;
  }

  .messages-inbox-page .inbox-list-panel,
  .messages-inbox-page .inbox-detail-panel {
    min-height: 320px;
    max-height: none;
  }
}

/* Narrow dashboard column: keeps the page readable instead of turning title into a vertical noodle. */
@container (max-width: 560px) {
  .messages-inbox-page {
    max-width: 100%;
    gap: 14px;
  }

  .messages-inbox-page .messages-inbox-hero,
  .messages-inbox-page .messages-inbox-shell {
    border-radius: 20px;
  }

  .messages-inbox-page .messages-inbox-hero {
    padding: 16px;
  }

  .messages-inbox-page .messages-kicker {
    min-height: 28px;
    font-size: 0.66rem;
  }

  .messages-inbox-page .messages-inbox-titleblock h1 {
    font-size: clamp(2.1rem, 13cqi, 3.2rem);
    line-height: 0.92;
    letter-spacing: 0.005em;
  }

  .messages-inbox-page .messages-inbox-titleblock p {
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .messages-inbox-page .messages-metric-card {
    min-height: 64px;
    padding: 12px;
    border-radius: 16px;
  }

  .messages-inbox-page .messages-metric-card strong {
    font-size: 1.85rem;
  }

  .messages-inbox-page .messages-inbox-shell {
    padding: 10px;
  }

  .messages-inbox-page .inbox-sidebar {
    grid-template-columns: 1fr;
    padding: 10px;
  }

  .messages-inbox-page .inbox-sidebar-header {
    justify-content: space-between;
  }

  .messages-inbox-page .inbox-folder-btn {
    min-width: 148px;
  }

  .messages-inbox-page .inbox-list-toolbar {
    padding: 10px;
  }

  .messages-inbox-page .inbox-list-toolbar > div {
    align-items: flex-start;
  }

  .messages-inbox-page .inbox-search {
    min-height: 40px;
  }

  .messages-inbox-page .inbox-empty-state,
  .messages-inbox-page .inbox-detail-empty {
    min-height: 240px;
    padding: 18px;
  }

  .messages-inbox-page .inbox-detail-header,
  .messages-inbox-page .inbox-message-reader,
  .messages-inbox-page .inbox-reply-composer {
    padding-inline: 14px;
  }
}

/* Viewport fallback for browsers or layouts that do not fully honor container behavior. */
@media (max-width: 980px) {
  .messages-inbox-page {
    max-width: 760px;
    margin-inline: auto;
  }

  .messages-inbox-page .messages-inbox-hero {
    grid-template-columns: 1fr;
  }

  .messages-inbox-page .messages-inbox-shell {
    grid-template-columns: 1fr;
    min-height: unset;
    overflow: visible;
  }

  .messages-inbox-page .inbox-sidebar {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .messages-inbox-page .inbox-folder-list {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .messages-inbox-page .inbox-folder-list::-webkit-scrollbar {
    display: none;
  }

  .messages-inbox-page .inbox-sidebar-note {
    display: none;
  }
}

@media (max-width: 680px) {
  .messages-inbox-page {
    padding-inline: 0;
  }

  .messages-inbox-page .messages-inbox-metrics {
    grid-template-columns: 1fr;
  }

  .messages-inbox-page .inbox-sidebar {
    grid-template-columns: 1fr;
  }

  .messages-inbox-page .inbox-folder-btn {
    min-width: 148px;
  }

  .messages-inbox-page .inbox-list-panel,
  .messages-inbox-page .inbox-detail-panel {
    min-height: 300px;
  }
}

${endMarker}
`;

  const nextCss = `${css.trimEnd()}\n\n${block.trim()}\n`;

  verifyContains(nextCss, startMarker, "CSS start marker");
  verifyContains(nextCss, endMarker, "CSS end marker");
  verifyContains(nextCss, "container-type: inline-size", "container query setup");
  verifyContains(nextCss, "@container (max-width: 980px)", "container medium layout");
  verifyContains(nextCss, "@container (max-width: 560px)", "container narrow layout");
  verifyContains(nextCss, ".messages-inbox-page .inbox-folder-list", "folder list responsive CSS");
  verifyContains(nextCss, ".messages-inbox-page .messages-inbox-shell", "shell responsive CSS");
  verifyContains(nextCss, ".messages-inbox-page .messages-metric-card", "metric card responsive CSS");

  const changed = writeIfChanged(cssFile, nextCss);

  if (changed) {
    console.log("✅ Phase 5.6 complete: admin messages layout aligned with Settings page rhythm.");
  } else {
    console.log("✅ Phase 5.6 already applied. No changes needed.");
  }

  console.log("📄 Patched:", cssFile);
}

try {
  main();
} catch (error) {
  console.error("❌ Phase 5.6 failed.");
  console.error(error.message);
  process.exit(1);
}