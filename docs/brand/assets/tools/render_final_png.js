// 確定版の SVG（../final）から PNG を書き出す。node render_final_png.js
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const F=path.join(__dirname,'..','final');
const rd=f=>fs.readFileSync(path.join(F,f),'utf8');
const JOBS=[
 ['icon/app_icon_1024.svg','icon/app_icon_1024.png',1024,1024,false],
 ['icon/android_adaptive_foreground.svg','icon/android_adaptive_foreground.png',1024,1024,true],
 ['icon/android_adaptive_background.svg','icon/android_adaptive_background.png',1024,1024,false],
 ['icon/android_adaptive_monochrome.svg','icon/android_adaptive_monochrome.png',1024,1024,true],
 ['icon/notification_icon.svg','icon/notification_icon_96.png',96,96,true],
 ['logo/logo_mark_light.svg','logo/logo_mark_light.png',960,520,true],
 ['logo/logo_mark_dark.svg','logo/logo_mark_dark.png',960,520,true],
 ['splash/splash_light.svg','splash/splash_light.png',1024,704,true],
 ['splash/splash_dark.svg','splash/splash_dark.png',1024,704,true],
];
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 for(const [src,out,w,h,transparent] of JOBS){
  await p.setViewportSize({width:w,height:h});
  await p.setContent(`<html><body style="margin:0;background:transparent">${rd(src).replace('<svg ',`<svg width="${w}" height="${h}" `)}</body></html>`);
  await p.screenshot({path:path.join(F,out),omitBackground:transparent,clip:{x:0,y:0,width:w,height:h}});
 }
 // ワードマークつきのロゴ（Zen Maru Gothic Bold。Google Fonts から読み込んで描く）
 for(const [m,bg,fg] of [['light','#FBF5EA','#4D3F33'],['dark','#1F1A14','#F3E8D8']]){
  await p.setViewportSize({width:1600,height:420});
  await p.setContent(`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700&display=block"></head><body style="margin:0;background:transparent"><div id="l" style="display:inline-flex;align-items:center;gap:36px;padding:40px;white-space:nowrap;color:${fg};font:700 104px 'Zen Maru Gothic'">${rd(`logo/logo_mark_${m}.svg`).replace('<svg ','<svg width="480" height="260" ')}<span>ねこと、ゆっくり</span></div></body></html>`);
  await p.evaluate(()=>document.fonts.ready);
  const el=await p.$('#l'); await el.screenshot({path:path.join(F,`logo/logo_lockup_${m}.png`),omitBackground:true});
 }
 // セーフゾーンの確認（108dp キャンバス：見える範囲 72dp の正方形、セーフゾーン直径 66dp の円）と、マスクをかけた見え方
 await p.setViewportSize({width:1240,height:420});
 const fgS=rd('icon/android_adaptive_foreground.svg').replace('<svg ','<svg width="100%" height="100%" ');
 const cell=(mask,label)=>`<div style="text-align:center;font:14px sans-serif;color:#4D3F33"><div style="width:216px;height:216px;position:relative;background:#FBF5EA;${mask}overflow:hidden">${fgS}${label==='ガイド'?'<svg viewBox="0 0 108 108" width="216" height="216" style="position:absolute;inset:0"><rect x="18" y="18" width="72" height="72" fill="none" stroke="#3B7FD9" stroke-width=".6" stroke-dasharray="2 2"/><circle cx="54" cy="54" r="33" fill="none" stroke="#D9533B" stroke-width=".6"/></svg>':''}</div>${label}</div>`;
 await p.setContent(`<body style="margin:0;background:#fff;display:flex;gap:24px;padding:20px">${cell('','ガイド')}${cell('clip-path:circle(33.3% at 50% 50%);','円')}${cell('clip-path:inset(16.7% round 18%);','角丸の四角')}${cell('clip-path:inset(16.7% round 50% 50% 8% 50%);','しずく')}</body>`);
 await p.screenshot({path:path.join(F,'icon/android_safezone_check.png')});
 await b.close();})();
