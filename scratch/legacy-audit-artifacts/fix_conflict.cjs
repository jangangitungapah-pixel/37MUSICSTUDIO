const fs = require('fs');

const cssPath = 'c:\\Users\\hazel\\source\\repos\\37MUSICSTUDIO\\src\\pages\\CalendarPage.css';
let content = fs.readFileSync(cssPath, 'utf8');

const replacement = `/* ==========================================================
   DESKTOP SCOPED OVERRIDES
   Targetted fixes applied only to .calendar-page context.
   ========================================================== */

/* Header: satu baris di desktop */
.calendar-page .app-page-header {
  min-height: 52px;
  padding-bottom: 8px;
  margin-bottom: 0;
}
.calendar-page .app-page-header-left {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 14px !important;
}
.calendar-page .app-page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}
.calendar-page .tour-calendar-search {
  width: clamp(200px, 20vw, 320px);
}

/* Stats: 4 kolom di desktop */
.calendar-page .app-stat-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.calendar-page .app-stat-card {
  min-height: 72px;
  padding: 14px 16px;
}
.calendar-page .stat-icon {
  width: 36px;
  height: 36px;
}
.calendar-page .stat-value {
  font-size: 1.15rem;
}
.calendar-page .stat-label {
  font-size: 0.65rem;
  text-transform: uppercase;
}
.calendar-page .stat-breakdown {
  justify-content: center;
}
.calendar-page .breakdown-items {
  display: flex;
  flex-direction: row;
}

/* ══════════════════════════════════════════
   CALENDAR HEADER
   ══════════════════════════════════════════ */
.calendar-page-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.calendar-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.calendar-page .breakdown-item {
  margin-bottom: 0 !important;
}`;

// Use regex to replace the entire conflict block from <<<<<<< HEAD to .breakdown-item { ... }
const regex = /<<<<<<< HEAD[\s\S]*?\.calendar-page \.breakdown-item \{\s*margin-bottom: 0 !important;\s*\}/;
content = content.replace(regex, replacement);

fs.writeFileSync(cssPath, content, 'utf8');
console.log('Fixed merge conflict!');
