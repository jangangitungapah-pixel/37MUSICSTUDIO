const fs = require('fs');

// 1. Fix DashboardPage.jsx Order
let jsx = fs.readFileSync('src/pages/DashboardPage.jsx', 'utf8');

// Extract Stats Cards
const statsStart = jsx.indexOf('{/* ===== Stats Cards ===== */}');
const statsEnd = jsx.indexOf('{/* ===== Action Modals ===== */}');
const statsHtml = jsx.slice(statsStart, statsEnd);
jsx = jsx.slice(0, statsStart) + jsx.slice(statsEnd);

// Find where to insert Stats Cards (after Header)
const headerEnd = jsx.indexOf('</MotionSection>', jsx.indexOf('{/* ===== Header & Toolbar ===== */}')) + '</MotionSection>'.length;

jsx = jsx.slice(0, headerEnd) + '\n\n      ' + statsHtml + jsx.slice(headerEnd);

// Ensure cols-4 uses auto-fit for dense packing
jsx = jsx.replace('className="app-smart-panel app-smart-grid cols-4"', 'className="app-smart-panel app-smart-grid cols-auto"');

fs.writeFileSync('src/pages/DashboardPage.jsx', jsx);
console.log('Moved Stats Cards to the top');

// 2. Fix CSS Grid Layout in DashboardPage.css
let css = fs.readFileSync('src/pages/DashboardPage.css', 'utf8');

if (!css.includes('.dash-command-grid {')) {
  css += `\n
/* Command Grid Dense Layout */
.dash-command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  align-items: start;
}
.dash-command-panel {
  margin: 0 !important;
  height: 100%;
}
`;
} else {
    // If it exists, let's just make sure the columns are responsive and dense
    css = css.replace(
        /\.dash-command-grid \{[\s\S]*?\}/,
        `.dash-command-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));\n  gap: 16px;\n  align-items: start;\n}`
    );
    css = css.replace(
        /\.dash-command-panel \{[\s\S]*?\}/,
        `.dash-command-panel {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  background: var(--glass-bg);\n  border: 1px solid var(--glass-border);\n  border-radius: 16px;\n  padding: 20px;\n  gap: 16px;\n}`
    );
}

// Ensure the main gap between sections is smaller for "ringkas" feel
css = css.replace('.dashboard-page {\n  gap: 24px;', '.dashboard-page {\n  gap: 16px;');

fs.writeFileSync('src/pages/DashboardPage.css', css);
console.log('Fixed DashboardPage.css layout');

// 3. Fix index.css for cols-4 and cols-auto missing rules
let indexCss = fs.readFileSync('src/index.css', 'utf8');
if (!indexCss.includes('.app-smart-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }')) {
    indexCss = indexCss.replace(
        /.app-smart-grid.cols-auto { grid-template-columns: repeat\(auto-fit, minmax\(250px, 1fr\)\); }/g,
        '.app-smart-grid.cols-auto { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }\n  .app-smart-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }'
    );
    fs.writeFileSync('src/index.css', indexCss);
    console.log('Added cols-4 to index.css');
}

