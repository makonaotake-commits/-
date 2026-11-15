// Web 版の書き出し（dist/）を、1つの HTML ファイル（dist/prototype.html）にまとめる。
// 公開先（Artifact）が <!doctype>・<html>・<head>・<body> を付けるため、ここでは中身だけを書き出す。
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const m = index.match(/<script src="\/?(_expo\/static\/js\/web\/[^"]+\.js)" defer><\/script>/);
if (!m) throw new Error('バンドルの script タグが見つかりません');
const js = fs.readFileSync(path.join(dist, m[1]), 'utf8').replace(/<\/script/gi, '<\\/script');

// フォントは scripts/web-fonts.py が作った dist/fonts.css（同梱フォントを埋め込んだもの）を使う。外部からは読み込まない。
const fontsCss = fs.readFileSync(path.join(dist, 'fonts.css'), 'utf8');

const html = `<title>Nyan Kidney 試作</title>
<meta name="description" content="慢性腎臓病の猫の記録アプリの試作（タップして確かめる用）" />
<style id="app-fonts">
${fontsCss}
</style>
<style id="expo-reset">
  :root { color-scheme: light; --bg: #FBF5EA; --fg: #4D3F33; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; --bg: #1F1A14; --fg: #F3E8D8; } }
  :root[data-theme="dark"] { color-scheme: dark; --bg: #1F1A14; --fg: #F3E8D8; }
  html, body { height: 100%; background: var(--bg); color: var(--fg); }
  body { overflow-y: auto; }
  #root { display: flex; min-height: 100%; flex: 1; }
</style>
<noscript>JavaScript を有効にすると試作が動きます。</noscript>
<div id="root"></div>
<script>
${js}
</script>
`;
fs.writeFileSync(path.join(dist, 'prototype.html'), html);
console.log('dist/prototype.html', Math.round(html.length / 1024), 'KB');
