const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf8');

// Remove all text-size-adjust references to stop lint errors
content = content.replace(/\s*-webkit-text-size-adjust:\s*100%;/g, '');
content = content.replace(/\s*text-size-adjust:\s*100%;/g, '');

fs.writeFileSync('src/index.css', content, 'utf8');
console.log('Removed text-size-adjust from index.css');
