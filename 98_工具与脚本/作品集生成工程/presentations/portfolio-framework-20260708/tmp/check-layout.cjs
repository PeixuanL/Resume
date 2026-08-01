const fs = require('fs');
const path = require('path');
const dir = 'C:/cursor/Resume/work/presentations/portfolio-framework-20260708/tmp/preview';
const bad = [];
function walk(o, slide) {
  if (!o || typeof o !== 'object') return;
  const f = o.frame || o.position;
  if (f && typeof f.left === 'number' && typeof f.top === 'number' && typeof f.width === 'number' && typeof f.height === 'number') {
    if (f.left < -1 || f.top < -1 || f.left + f.width > 1281 || f.top + f.height > 721) {
      bad.push({ slide, name: o.name || o.id || o.type, f });
    }
  }
  for (const v of Object.values(o)) walk(v, slide);
}
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.layout.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  walk(j, file);
}
console.log(JSON.stringify({ badCount: bad.length, bad: bad.slice(0, 20) }, null, 2));
