// ペルシャの確定データ（docs/brand/assets/final/）を、アプリの assets/ にコピーする。
// 素材が更新されたら：node scripts/sync-brand-assets.js（画像は手で直さない）
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'docs', 'brand', 'assets', 'final');
const DST = path.join(__dirname, '..', 'assets');
const files = [
  ['icon/app_icon_1024.png', 'icon.png'],
  ['icon/android_adaptive_foreground.png', 'adaptive-foreground.png'],
  ['icon/android_adaptive_monochrome.png', 'adaptive-monochrome.png'],
  ['icon/notification_icon_96.png', 'notification-icon.png'],
  ['splash/splash_light.png', 'splash-light.png'],
  ['splash/splash_dark.png', 'splash-dark.png'],
];
fs.mkdirSync(DST, { recursive: true });
for (const [from, to] of files) {
  fs.copyFileSync(path.join(SRC, from), path.join(DST, to));
  console.log(`assets/${to} ← final/${from}`);
}
