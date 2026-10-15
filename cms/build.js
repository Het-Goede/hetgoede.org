// Bouwt index.html en fr.html uit cms/ (sjablonen en teksten) (beheerd via het CMS op /admin).
// Draait automatisch bij elke publicatie op Netlify. Bewerk de teksten in het CMS, niet in index.html of fr.html.
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const root = path.join(__dirname, '..');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const links = s => s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => '<a href="' + u.replace(/"/g, '&quot;') + '">' + t + '</a>');
const inline = s => links(esc(s).trim()).replace(/\r?\n/g, '<br>');
const attr = s => esc(s).trim().replace(/"/g, '&quot;').replace(/\r?\n/g, ' ');
const blok = s => String(s).split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(Boolean).map(p => '<p>' + inline(p) + '</p>').join('');

function bouw(template, content, uit) {
  const t = fs.readFileSync(path.join(dir, template), 'utf8');
  const c = JSON.parse(fs.readFileSync(path.join(dir, content), 'utf8'));
  const ontbreekt = [];
  let html = t.replace(/\{\{(a:)?([a-z0-9_]+)\}\}/g, (m, a, key) => {
    if (c[key] === undefined || c[key] === null || String(c[key]).trim() === '') { ontbreekt.push(key); return ''; }
    return a ? attr(c[key]) : inline(c[key]);
  });
  if (!Array.isArray(c.faq) || !c.faq.length) ontbreekt.push('faq');
  const faq = (c.faq || []).filter(f => f && f.vraag && f.antwoord).map(f =>
    '<details>\n      <summary><span class="vr">' + inline(f.vraag) + '</span></summary>\n      <div class="body">' + blok(f.antwoord) + '</div>\n    </details>'
  ).join('\n    ');
  html = html.replace('<!--FAQ-->', faq);
  if (ontbreekt.length) throw new Error(content + ': lege velden: ' + ontbreekt.join(', '));
  fs.writeFileSync(path.join(root, uit), html);
  console.log('Gebouwd:', uit);
}

bouw('sjabloon-nl.html', 'nl.json', 'index.html');
bouw('sjabloon-fr.html', 'fr.json', 'fr.html');
