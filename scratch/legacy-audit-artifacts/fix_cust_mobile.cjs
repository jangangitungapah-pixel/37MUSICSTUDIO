const fs = require('fs');

// 1. Fix CustomersPage.jsx
let jsx = fs.readFileSync('src/pages/CustomersPage.jsx', 'utf8');

// Move status-dot to next to customer-name
jsx = jsx.replace(
  /<span className="customer-name">\{customer\.name\}<\/span>/,
  '<div style={{display: \'flex\', alignItems: \'center\', gap: \'6px\'}}>\n                          <span className="customer-name">{customer.name}</span>\n                          <span className={`status-dot ${customer.status.toLowerCase()}`}></span>\n                        </div>'
);

// Remove the old status dot from mobile-card-right
jsx = jsx.replace(
  /<span className={`status-dot \$\{customer\.status\.toLowerCase\(\)\}`\}><\/span>\s*/,
  ''
);

fs.writeFileSync('src/pages/CustomersPage.jsx', jsx);
console.log('Fixed CustomersPage.jsx layout');

// 2. Fix CustomersPage.css for mobile layout
let css = fs.readFileSync('src/pages/CustomersPage.css', 'utf8');

css = css.replace(
  /\.filter-tab \{ padding: 10px 14px; font-size: 0\.82rem; white-space: nowrap; \}/,
  '.filter-tab { padding: 10px 14px !important; font-size: 0.82rem !important; white-space: nowrap; }'
);
css = css.replace(
  /\.filter-tabs \{ overflow-x: auto; padding: 0 12px; \}/,
  '.filter-tabs { overflow-x: auto !important; padding: 0 12px !important; margin: 0 -12px !important; }'
);

// Reduce padding inside mobile-customer-card
css = css.replace(
  /padding: 12px 14px;\n\s*border-radius: 13px;/,
  'padding: 10px 12px;\n  border-radius: 12px;'
);

fs.writeFileSync('src/pages/CustomersPage.css', css);
console.log('Fixed CustomersPage.css layout');
