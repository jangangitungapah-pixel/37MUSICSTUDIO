const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf8');

const polishCSS = `

/* ==========================================================
   FINAL UI POLISH (Micro-animations & Aesthetics)
   ========================================================== */

/* 1. Sleek Modern Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
[data-theme="light"] ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
}
[data-theme="light"] ::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* 2. Enhanced Card & Panel Hover Glow */
.app-card, .app-panel, .glass-panel {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease;
}
.app-card:hover, .app-panel:hover, .glass-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px 0 rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.12);
}
[data-theme="light"] .app-card:hover, 
[data-theme="light"] .app-panel:hover, 
[data-theme="light"] .glass-panel:hover {
  box-shadow: 0 12px 32px 0 rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.12);
}

/* 3. Primary Button Interactive Glow */
.btn-primary {
  position: relative;
  overflow: hidden;
  z-index: 1;
}
.btn-primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
  z-index: -1;
}
.btn-primary:hover::after {
  left: 100%;
}

/* 4. Table Row Smoothness */
.app-table tbody tr {
  transition: background-color 0.2s ease, transform 0.2s ease;
}
`;

if (!content.includes('FINAL UI POLISH')) {
  fs.writeFileSync('src/index.css', content + polishCSS);
  console.log('Applied Final UI Polish CSS.');
} else {
  console.log('Polish CSS already present.');
}
