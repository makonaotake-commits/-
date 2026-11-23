// 体験の見本（experience/experience.src.html）に、ペルシャの線画（明・暗）を埋め込んで dist/experience.html を作る
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const brand = path.join(root, '..', 'docs', 'brand', 'assets', 'svg');
const names = {
  guide_peek: 'guide', pose_sit: 'poses', pose_loaf: 'poses', pose_stretch: 'poses', pose_window: 'poses',
  window_morning: 'room', window_noon: 'room', window_evening: 'room', window_night: 'room', weather_cloudy: 'room', weather_rain: 'room', weather_snow: 'room',
  floor: 'room', bed: 'room', toilet_back: 'room', toilet_front: 'room', bowl_food: 'room', bowl_water: 'room', cat_walk: 'room', cat_walk2: 'room', cat_walk3: 'room', shelf: 'room', wall_picture: 'room', paper_dots: 'diary', cat_bed: 'room',
  card_food: 'cards', card_water: 'cards', card_toilet: 'cards', card_energy: 'cards',
  diary_meal: 'diary', diary_drink: 'diary', diary_rest: 'diary', diary_window: 'diary',
  item_food: 'diary', item_water: 'diary', item_toilet: 'diary', item_energy: 'diary',
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
// 答えの絵（currentColor なので明暗で同じファイル）
for (const n of ['answer_food_0', 'answer_food_1', 'answer_food_2', 'answer_food_3', 'answer_water_1', 'answer_water_2', 'answer_water_3']) {
  const x = clean(fs.readFileSync(path.join(brand, 'answers', n + '.svg'), 'utf8'));
  art[n] = { l: x, d: x };
}
const src = fs.readFileSync(path.join(root, 'experience', 'experience.src.html'), 'utf8');
const out = src.replace('/*ART_JSON*/null', JSON.stringify(art));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'experience.html'), out);
console.log('dist/experience.html', Math.round(out.length / 1024), 'KB');
