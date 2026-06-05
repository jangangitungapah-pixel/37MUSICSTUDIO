const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf8');

// 1. Fix app-page-actions
content = content.replace(
  /\.app-page-actions \{\s*display: flex;\s*align-items: center;\s*gap: 12px;\s*\}/g,
  '.app-page-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}'
);

// 2. Append missing global utility classes (if not already there)
if (!content.includes('/* Smart Grid System')) {
  content += `

/* ==========================================================
   GLOBAL UTILITY CLASSES (Added from Audit)
   ========================================================== */

/* Smart Grid System - prevents crushing columns on mobile */
.app-smart-grid {
  display: grid;
  gap: 12px;
}

@media (min-width: 769px) {
  .app-smart-grid.cols-auto { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
  .app-smart-grid.cols-4 { grid-template-columns: repeat(4, 1fr); }
  .app-smart-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
  .app-smart-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1024px) {
  .app-smart-grid.cols-4 { grid-template-columns: repeat(2, 1fr); }
  .app-smart-grid.cols-3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .app-smart-grid { 
    grid-template-columns: 1fr !important; 
  }
  .app-stat-grid {
    grid-template-columns: 1fr !important;
  }
}

/* Prevent horizontal overflow table squish */
.app-table {
  min-width: 800px;
}
`;
}

fs.writeFileSync('src/index.css', content);
console.log('Appended fixes to index.css');
