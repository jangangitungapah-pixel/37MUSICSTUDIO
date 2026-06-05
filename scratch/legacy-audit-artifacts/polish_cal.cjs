const fs = require('fs');

let content = fs.readFileSync('src/pages/CalendarPage.css', 'utf8');

content = content.replace(
  /\[data-theme="light"\] .stat-card {[\s\S]*?\[data-theme="light"\] .cal-smart-panel {/m,
  `[data-theme="light"] .stat-card {
  background: #ffffff;
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 4px 16px rgba(0,0,0,0.03);
}
[data-theme="light"] .stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }

[data-theme="light"] .cal-smart-panel {`
);

content = content.replace(
  /\[data-theme="light"\] .cal-smart-alert {[\s\S]*?\[data-theme="light"\] .calendar-toolbar {/m,
  `[data-theme="light"] .cal-smart-alert {
  background: rgba(255, 152, 0, 0.08);
  border-color: rgba(255, 152, 0, 0.25);
  color: #d84315;
}

[data-theme="light"] .calendar-container {
  background: #ffffff;
  border-color: rgba(0,0,0,0.06);
  box-shadow: 0 8px 32px rgba(0,0,0,0.04);
}
[data-theme="light"] .calendar-toolbar {`
);

content = content.replace(
  /\[data-theme="light"\] .filter-chip {[\s\S]*?\[data-theme="light"\] .filter-chip.active.pending/m,
  `[data-theme="light"] .filter-chip {
  background: transparent;
  border-color: rgba(0,0,0,0.15);
  color: var(--text-secondary);
}
[data-theme="light"] .filter-chip:hover {
  background: rgba(0,0,0,0.04);
  color: var(--text-primary);
}
[data-theme="light"] .filter-chip.active { background: #ffffff; border-color: rgba(0,0,0,0.25); color: var(--text-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
[data-theme="light"] .filter-chip.active.confirmed { border-color: #2e7d32; background: #e8f5e9; color: #2e7d32; }
[data-theme="light"] .filter-chip.active.dp        { border-color: #f57f17; background: #fff8e1; color: #f57f17; }
[data-theme="light"] .filter-chip.active.pending`
);

content = content.replace(
  /\[data-theme="light"\] .grid-corner-cell,[\s\S]*?\[data-theme="light"\] .grid-cell.today-col-highlight/m,
  `[data-theme="light"] .grid-corner-cell,
[data-theme="light"] .grid-header-cell,
[data-theme="light"] .time-label,
[data-theme="light"] .time-label.even-row { background: #f8f9fa; color: var(--text-secondary); }

[data-theme="light"] .grid-header-cell { border-bottom-color: rgba(0,0,0,0.08); border-right-color: rgba(0,0,0,0.06); }
[data-theme="light"] .grid-header-cell.today { background: rgba(0,153,187,0.06); }
[data-theme="light"] .grid-header-cell.today .day-number { background: #0099bb; color: #ffffff; box-shadow: 0 4px 12px rgba(0,153,187,0.3); }
[data-theme="light"] .grid-cell { border-right-color: rgba(0,0,0,0.05); border-bottom-color: rgba(0,0,0,0.05); }
[data-theme="light"] .grid-cell.even-row { background: rgba(0,0,0,0.01); }
[data-theme="light"] .grid-cell.today-col-highlight`
);

fs.writeFileSync('src/pages/CalendarPage.css', content);
console.log('Polished light mode calendar css');
