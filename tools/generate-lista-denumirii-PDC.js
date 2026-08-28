const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'components', 'Pe-Drumul-Credintei.json');
const out = path.join(__dirname, '..', 'components', 'lista-denumirii-PDC.json');

try {
  const raw = fs.readFileSync(src, 'utf8');
  const data = JSON.parse(raw);
  const rezultate = data.rezultate || {};
  const arr = Object.keys(rezultate).map(k => ({ denumire: String(rezultate[k].denumire || '').trim() }));
  fs.writeFileSync(out, JSON.stringify(arr, null, 2), 'utf8');
  console.log('Wrote', arr.length, 'entries to', out);
} catch (err) {
  console.error('Error generating lista-denumirii-PDC.json:', err.message);
  process.exit(1);
}
