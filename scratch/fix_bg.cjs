const fs = require('fs');
const path = require('path');
const dirs = ['src', 'src/pages'];

dirs.forEach(d => {
  fs.readdirSync(d).filter(f => f.endsWith('.css')).forEach(f => {
    let fp = path.join(d, f);
    let c = fs.readFileSync(fp, 'utf8');
    let orig = c;
    
    // Replace hex dark backgrounds
    c = c.replace(/background:\s*#0c0c10/gi, 'background: var(--bg-dark)');
    c = c.replace(/background:\s*#17171d/gi, 'background: var(--bg-surface)');
    
    // Replace rgba dark backgrounds with rgba(var(--bg-surface-rgb), a)
    c = c.replace(/rgba\(\s*([1-4]?\d)\s*,\s*([1-4]?\d)\s*,\s*([1-4]?\d)\s*,\s*([0-9.]+)\)/g, (match, r, g, b, a) => {
      let rInt = parseInt(r);
      let gInt = parseInt(g);
      let bInt = parseInt(b);
      // If it's a dark gray/blackish color (not pure black because pure black is often an overlay/shadow)
      if (rInt >= 8 && rInt <= 45 && gInt >= 8 && gInt <= 45 && bInt >= 8 && bInt <= 55) {
        return `rgba(var(--bg-surface-rgb), ${a})`;
      }
      return match;
    });

    if (orig !== c) {
      fs.writeFileSync(fp, c);
      console.log('Fixed ' + fp);
    }
  });
});
