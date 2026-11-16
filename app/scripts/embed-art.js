// ペルシャの線画（docs/brand/assets/svg/{light,dark}/）を、アプリに同梱する TS ファイルに書き出す。
// 素材が更新されたら：node scripts/embed-art.js（SVG は手で直さない。brand_guide.md §5-4）
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'docs', 'brand', 'assets', 'svg');
const KINDS = ['guide', 'poses', 'seasons', 'daypart'];
const out = {};
for (const scheme of ['light', 'dark']) {
  out[scheme] = {};
  for (const k of KINDS) {
    const dir = path.join(SRC, scheme, k);
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.svg')).sort()) {
      out[scheme][f.replace(/\.svg$/, '')] = fs.readFileSync(path.join(dir, f), 'utf8').trim();
    }
  }
}
const body = `// 自動生成：scripts/embed-art.js（元：docs/brand/assets/svg/）。手で編集しない。\nexport const ART = ${JSON.stringify(out, null, 2)} as const;\n\nexport type ArtName = keyof (typeof ART)['light'];\n`;
fs.writeFileSync(path.join(__dirname, '..', 'src', 'art', 'artData.ts'), body);
console.log('src/art/artData.ts', Object.keys(out.light).join(', '));
