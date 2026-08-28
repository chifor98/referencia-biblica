const fs = require('fs');
const path = require('path');

function walk(dir, files=[]) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp, files);
    else files.push(fp);
  });
  return files;
}

const root = process.cwd();
const all = walk(root).filter(f => f.endsWith('.js'));
let problems = [];
all.forEach(file => {
  const txt = fs.readFileSync(file, 'utf8');
  const re = /try\s*\{/g;
  let m;
  while ((m = re.exec(txt)) !== null) {
    const idx = m.index;
    // find the matching closing brace for this try block roughly by counting braces
    let i = idx + m[0].length;
    let depth = 1;
    for (; i < txt.length; i++) {
      const ch = txt[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          break;
        }
      }
    }
    const after = txt.slice(i+1, i+200); // get following 200 chars
    if (!/\bcatch\b/.test(after) && !/\bfinally\b/.test(after)) {
      // report context lines
      const beforeLines = txt.slice(Math.max(0, idx-120), idx+120).split('\n');
      problems.push({ file, pos: idx, snippet: beforeLines.join('\n') });
    }
  }
});

if (problems.length === 0) {
  console.log('No try blocks without catch/finally found (quick heuristic).');
  process.exit(0);
}
console.log('Found potential issues:');
problems.forEach(p => {
  console.log('---');
  console.log(p.file);
  console.log(p.snippet);
});
process.exit(0);
