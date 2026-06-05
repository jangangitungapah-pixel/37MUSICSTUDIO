const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\hazel\\.gemini\\antigravity-ide\\brain\\6b710f94-61f9-49ab-8058-fee904dadbdf';
const files = ['implementation_plan.md', 'task.md', 'walkthrough.md'];

files.forEach(f => {
  const filePath = path.join(brainDir, f);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix MD041 for task.md
  if (f === 'task.md' && !content.startsWith('#')) {
    content = '# Tasks\n\n' + content;
  }

  // Fix MD009: trailing spaces
  content = content.replace(/[ \t]+$/gm, '');

  // Fix MD004: ul-style (use - instead of *)
  // Our task uses - so we should be consistent
  content = content.replace(/^(\s*)\* /gm, '$1- ');

  // Fix MD022/MD032: Ensure blank lines around headings and lists
  // This is a bit tricky with regex, but we can try to just format it better by adding blank lines before # if missing
  content = content.replace(/([^\n])\n(#+ .*)/g, '$1\n\n$2');
  
  // Ensure blank line after heading
  content = content.replace(/(#+ .*)\n([^\n])/g, (match, p1, p2) => {
    if (p2.startsWith('\n')) return match;
    return `${p1}\n\n${p2}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed markdown', f);
  }
});
