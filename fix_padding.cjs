const fs = require('fs');

// First fix app-table-toolbar padding
let indexCss = fs.readFileSync('src/index.css', 'utf8');

indexCss = indexCss.replace(
  /\.app-table-toolbar \{[\s\S]*?margin-bottom: 20px;\s*flex-wrap: wrap;\s*\}/,
  `.app-table-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 16px;\n  margin-bottom: 20px;\n  flex-wrap: wrap;\n  padding: 24px 24px 0 24px;\n}`
);

// Fix the mobile padding for app-table-toolbar to be smaller
indexCss = indexCss.replace(
  /align-items: flex-start;\s*\}/g,
  `align-items: flex-start;\n    padding: 16px 16px 0 16px;\n  }`
);

fs.writeFileSync('src/index.css', indexCss);
console.log('Fixed padding in index.css');
