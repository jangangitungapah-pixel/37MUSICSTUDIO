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
  let original = content;

  // Fix: backdrop-filter order
  content = content.replace(/backdrop-filter:\s*(.*?);\s*-webkit-backdrop-filter:\s*(.*?);/g, 
    '-webkit-backdrop-filter: $2;\n  backdrop-filter: $1;');
  
  // Fix: Add -webkit-backdrop-filter if missing
  content = content.replace(/(?<!-webkit-)(backdrop-filter:\s*[^;]+;)/g, (match, p1, offset, string) => {
     let context = string.substring(Math.max(0, offset - 100), offset);
     if (context.includes('-webkit-backdrop-filter')) return match; 
     return `-webkit-${p1}\n  ${p1}`;
  });

  // Fix: user-select order
  content = content.replace(/user-select:\s*(.*?);\s*-webkit-user-select:\s*(.*?);/g, 
    '-webkit-user-select: $2;\n  user-select: $1;');
    
  // Fix: missing -webkit-user-select
  content = content.replace(/(?<!-webkit-)(user-select:\s*[^;]+;)/g, (match, p1, offset, string) => {
     let context = string.substring(Math.max(0, offset - 100), offset);
     if (context.includes('-webkit-user-select')) return match;
     return `-webkit-${p1}\n  ${p1}`;
  });

  // Fix: mask-image order
  content = content.replace(/mask-image:\s*(.*?);\s*-webkit-mask-image:\s*(.*?);/g, 
    '-webkit-mask-image: $2;\n  mask-image: $1;');

  // Fix: text-size-adjust
  content = content.replace(/-webkit-text-size-adjust:\s*([^;]+);/g, (match, p1, offset, string) => {
     let contextAfter = string.substring(offset, Math.min(string.length, offset + 100));
     if (contextAfter.includes('text-size-adjust')) return match;
     return `${match}\n  text-size-adjust: ${p1};`;
  });
  
  // Remove unsupported -webkit-overflow-scrolling
  content = content.replace(/-webkit-overflow-scrolling:\s*touch;\s*/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
