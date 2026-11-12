// Web 版の書き出し（dist/）を、1つの HTML ファイル（dist/prototype.html）にまとめる。
// 公開先（Artifact）が <!doctype>・<html>・<head>・<body> を付けるため、ここでは中身だけを書き出す。
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const m = index.match(/<script src="\/?(_expo\/static\/js\/web\/[^"]+\.js)" defer><\/script>/);
if (!m) throw new Error('バンドルの script タグが見つかりません');
const js = fs.readFileSync(path.join(dist, m[1]), 'utf8').replace(/<\/script/gi, '<\\/script');

const fontsUrl = 'https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Zen+Maru+Gothic:wght@500;700&display=swap';

const html = `<title>Nyan Kidney 試作</title>
<meta name="description" content="慢性腎臓病の猫の記録アプリの試作（タップして確かめる用）" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${fontsUrl}" />
<style id="expo-reset">
  :root { color-scheme: light; }
  html, body { height: 100%; background: #FAF6F0; color: #4A4038; }
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
