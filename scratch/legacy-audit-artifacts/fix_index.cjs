const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf8');

// 1. Fix text-size-adjust
content = content.replace(/-webkit-text-size-adjust:\s*100%;/g, '-webkit-text-size-adjust: 100%;\n  text-size-adjust: 100%;');

// 2. Fix backdrop-filter orders (must have -webkit- before normal)
// Just do a simple global pass to fix all
content = content.replace(/backdrop-filter:\s*(.*?);\s*-webkit-backdrop-filter:\s*(.*?);/g, '-webkit-backdrop-filter: $2;\n  backdrop-filter: $1;');

// 3. Add -webkit-backdrop-filter if missing
content = content.replace(/(?<!-webkit-)(backdrop-filter:\s*[^;]+;)/g, (match, p1, offset, string) => {
   let context = string.substring(Math.max(0, offset - 100), offset);
   if (context.includes('-webkit-backdrop-filter')) return match; 
   return `-webkit-${p1}\n  ${p1}`;
});

// 4. Add the app-smart-grid and app-table utility classes
const utilityClasses = `

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
  .app-smart-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
  .app-smart-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .app-smart-grid { 
    grid-template-columns: 1fr !important; 
  }
}

/* Prevent horizontal overflow table squish */
.app-table {
  min-width: 800px;
}
`;

if (!content.includes('app-smart-grid')) {
  content += utilityClasses;
}

fs.writeFileSync('src/index.css', content, 'utf8');
console.log('Fixed src/index.css');
