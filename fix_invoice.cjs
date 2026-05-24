const fs = require('fs');

let css = fs.readFileSync('src/pages/BillingPage.css', 'utf8');

// The CSS contains a duplicate block of INVOICE V2 styles around line 764 to 800.
// Let's remove the first block and fix the selector in the second block.

const block1Start = css.indexOf('/* =============================================\n   INVOICE V2 — Premium Print-ready Invoice\n   ============================================= */');
const block2Start = css.indexOf('/* =============================================\n   INVOICE V2 — Premium Digital & Thermal Invoice\n   ============================================= */');

if (block1Start !== -1 && block2Start !== -1 && block1Start < block2Start) {
  css = css.slice(0, block1Start) + css.slice(block2Start);
}

// Now fix the modal override selector
css = css.replace(
  /\.billing-page \.modal-content\.invoice-modal-wide,\n\.invoice-modal-wide \.modal-content \{/g,
  '.modal-content.invoice-modal-wide {'
);

fs.writeFileSync('src/pages/BillingPage.css', css);
console.log('Fixed invoice modal CSS in BillingPage.css');
