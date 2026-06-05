const fs = require('fs');

const files = [
  'src/index.css',
  'src/pages/CalendarPage.css',
  'src/pages/LandingPage.css',
  'src/pages/MaintenancePage.css',
  'src/pages/SettingsPage.css'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Remove unsupported properties completely to satisfy IDE linter
  content = content.replace(/\s*-webkit-overflow-scrolling:\s*touch;/g, '');
  content = content.replace(/\s*scrollbar-width:\s*none;/g, '');

  fs.writeFileSync(file, content, 'utf8');
});
console.log('Cleaned up unsupported properties');
