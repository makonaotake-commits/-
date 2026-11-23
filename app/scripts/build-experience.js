// 体験の見本（experience/experience.src.html）に、ペルシャの線画（明・暗）を埋め込んで dist/experience.html を作る
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const brand = path.join(root, '..', 'docs', 'brand', 'assets', 'svg');
const names = {
  guide_peek: 'guide', pose_sit: 'poses', pose_loaf: 'poses', pose_stretch: 'poses', pose_peek: 'poses', pose_window: 'poses',
  daypart_morning: 'daypart', daypart_noon: 'daypart', daypart_night: 'daypart',
  season_spring: 'seasons', season_summer: 'seasons', season_autumn: 'seasons', season_winter: 'seasons',
};
const clean = (x) => x.replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+role="img"/, '').replace(/\s+aria-label="[^"]*"/, ' aria-hidden="true"').trim();
const art = {};
for (const [n, dir] of Object.entries(names)) {
  art[n] = {
    l: clean(fs.readFileSync(path.join(brand, 'light', dir, n + '.svg'), 'utf8')),
    d: clean(fs.readFileSync(path.join(brand, 'dark', dir, n + '.svg'), 'utf8')),
  };
}
const src = fs.readFileSync(path.join(root, 'experience', 'experience.src.html'), 'utf8');
const out = src.replace('/*ART_JSON*/null', JSON.stringify(art));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'experience.html'), out);
console.log('dist/experience.html', Math.round(out.length / 1024), 'KB');
