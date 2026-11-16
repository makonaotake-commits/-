// 「ねこと、ゆっくり」線画アセットの生成（タッチ a：細い線＋しっぽのベタ）
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const OUT=process.argv[2];
const PAL={
 light:{ink:"#4D3F33",surface:"#FFFDF8",bg:"#FBF5EA",primary:"#87602F",primaryTint:"#F3E3C8",accentTint:"#E2EDE8"},
 dark:{ink:"#F3E8D8",surface:"#2A231B",bg:"#1F1A14",primary:"#E2B87F",primaryTint:"#3E3222",accentTint:"#263530"},
};
const SW=1.8;
function A(c,extra=""){return `fill="none" stroke="${c.ink}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;}
const G=pat=>`pathLength="100" stroke-dasharray="${pat}"`;
const eyes=(c,cx,cy)=>`<circle cx="${cx-5}" cy="${cy}" r="2" fill="${c.ink}"/><circle cx="${cx+5}" cy="${cy}" r="2" fill="${c.ink}"/><circle cx="${cx}" cy="${cy+4}" r="1.2" fill="${c.ink}"/>`;
const ears=(c,cx,cy)=>`<path d="M${cx-11} ${cy-7} Q${cx-11} ${cy-17} ${cx-4} ${cy-13}" ${A(c)}/><path d="M${cx+4} ${cy-13} Q${cx+11} ${cy-17} ${cx+11} ${cy-7}" ${A(c)}/>`;
const tail=(c,d)=>`<g id="tail"><path d="${d}" fill="none" stroke="${c.ink}" stroke-width="${SW*3}" stroke-linecap="round"/></g>`;
const ground=(c,y,x1,x2)=>{const m=Math.round((x1+x2)/2);return `<path d="M${x1} ${y} H${m-3} M${m+3} ${y} H${x2}" ${A(c)} stroke-opacity=".7"/>`;};
// ---- 毛色（2026-11-16 追加）----
// アプリの選択肢：white しろ／tabby キジトラ／black くろ／calico 三毛／brown 茶／gray グレー
// ルール：ベタ（ink の塗り）はしっぽ1か所のまま。柄は「線」か「淡い面」で入れる。くろだけは顔を ink で塗る例外（brand_guide §5-1）。
// 柄は頭の中だけに入れる（体は線画のまま）。clipPath は使わない（Web で id が重なるため）。
const FURS=["white","tabby","black","calico","brown","gray"];
const FURCOL={
 light:{tabby:"#E8DCC8",brown:"#EBCFA3",gray:"#DDD8D1",calicoA:"#E9C08A",calicoB:"#9A8468"},
 dark:{tabby:"#3B3228",brown:"#5A4630",gray:"#3F3B36",calicoA:"#6E5434",calicoB:"#8E7B62"},
};
let FUR="white", MODE="light";
const faceFill=c=>FUR==="black"?(MODE==="dark"?"#0E0C09":c.ink):FUR==="tabby"?FURCOL[MODE].tabby:FUR==="brown"?FURCOL[MODE].brown:FUR==="gray"?FURCOL[MODE].gray:c.surface;
const faceInk=c=>(FUR==="black"&&MODE==="light")?c.surface:c.ink; // くろ：明るい表示では目・鼻を地の色に。暗い表示は顔を地より暗く塗り、目・鼻は ink のまま
const furPattern=(c,cx,top,r,eyeY)=>{
 if(FUR==="tabby"){const w="stroke-width=\"1.4\"";return `<path d="M${cx-3.2} ${top+2.6} l0.6 3.6 M${cx} ${top+2.2} v4.2 M${cx+3.2} ${top+2.6} l-0.6 3.6" ${A(c)} ${w}/>`+(eyeY!=null?`<path d="M${cx-r+2.2} ${eyeY+1.5} h3 M${cx+r-2.2} ${eyeY+1.5} h-3" ${A(c)} ${w}/>`:"");}
 if(FUR==="calico") return `<ellipse cx="${cx-r*0.42}" cy="${top+r*0.42}" rx="${r*0.3}" ry="${r*0.26}" fill="${FURCOL[MODE].calicoA}"/><ellipse cx="${cx+r*0.46}" cy="${top+r*0.36}" rx="${r*0.24}" ry="${r*0.2}" fill="${FURCOL[MODE].calicoB}"/>`;
 return "";
};
// 頭：fill → 柄 → すきまのある輪郭 → 耳 → 目
const furHead=(c,{cx,cy,r,half=false,dash="70 7 23",earsSvg="",eyesSvg=""})=>{
 const top=cy-r;
 const shape=half?`d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}"`:null;
 const fillEl=half?`<path ${shape} fill="${faceFill(c)}"/>`:`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${faceFill(c)}"/>`;
 const lineEl=half?`<path ${shape} ${A(c,G(dash))}/>`:`<circle cx="${cx}" cy="${cy}" r="${r}" ${A(c,G(dash))}/>`;
 const eyeY=(eyesSvg.match(/cy="([\d.]+)"/)||[])[1];
 return `<g id="head">${fillEl}${furPattern(c,cx,top,r,(eyeY!=null&&!half)?Number(eyeY):null)}${lineEl}${earsSvg}${eyesSvg}</g>`;
};
const eyesF=(c,cx,cy,nose=true)=>{const k=faceInk(c);return `<circle cx="${cx-5}" cy="${cy}" r="2" fill="${k}"/><circle cx="${cx+5}" cy="${cy}" r="2" fill="${k}"/>`+(nose?`<circle cx="${cx}" cy="${cy+4}" r="1.2" fill="${k}"/>`:"");};
const head=(c,cx,cy,r=14)=>furHead(c,{cx,cy,r,earsSvg:ears(c,cx,cy),eyesSvg:eyesF(c,cx,cy+1)});
const wrap=(vb,label,inner)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}">${inner}</svg>`;
const POSES={
 sit:["すわる",c=>`${ground(c,80,14,106)}<path d="M40 80 C40 58 48 48 60 48 C72 48 80 58 80 80" ${A(c,G("44 6 50"))}/><path d="M54 80 v-7 M66 80 v-7" ${A(c)}/>${tail(c,"M80 78 C94 78 98 66 90 60")}${head(c,60,36)}`],
 peek:["縁からのぞく",c=>`<path d="M14 64 H52 M58 64 H106" ${A(c)}/>${tail(c,"M74 63 C84 62 86 54 82 50")}${furHead(c,{cx:60,cy:64,r:14,half:true,dash:"58 8 34",earsSvg:ears(c,60,58),eyesSvg:eyesF(c,60,55)})}<path d="M49 64 q3 -4 6 0 M65 64 q3 -4 6 0" ${A(c)}/>`],
 stretch:["のびる",c=>`${ground(c,80,10,110)}<path d="M34 62 C50 62 66 52 84 48" ${A(c,G("60 8 32"))}/><path d="M38 76 C52 74 62 72 74 70" ${A(c)}/><path d="M84 48 C89 58 89 70 87 80 M76 68 L78 80" ${A(c)}/><path d="M18 79 H34 M22 75 H36" ${A(c)}/>${tail(c,"M86 48 C92 38 90 30 97 26")}${furHead(c,{cx:26,cy:64,r:10,dash:"72 8 20",earsSvg:`<path d="M18 58 Q17 50 23 54 M29 54 Q34 50 34 58" ${A(c)}/>`,eyesSvg:`<circle cx="23" cy="64" r="1.8" fill="${faceInk(c)}"/><circle cx="29" cy="64" r="1.8" fill="${faceInk(c)}"/>`})}`],
 loaf:["香箱すわり",c=>`${ground(c,80,14,108)}<path d="M30 80 C30 62 44 54 62 54 C82 54 94 64 94 80" ${A(c,G("48 6 46"))}/>${tail(c,"M94 78 C102 78 104 70 99 66")}${head(c,42,52,13)}`],
 window:["窓の外を見る（うしろ姿）",c=>`${ground(c,80,14,106)}<path d="M44 80 C42 62 50 52 60 52 C70 52 78 62 76 80" ${A(c,G("46 6 48"))}/>${tail(c,"M76 78 C90 80 96 70 90 62")}${furHead(c,{cx:60,cy:40,r:13,earsSvg:ears(c,60,40)})}`],
};
const SEASONS={
 spring:["春：若葉",c=>`<path d="M38 50 V34" ${A(c)}/><path d="M38 38 C30 36 26 30 28 24 C34 26 38 30 38 38 Z" fill="${c.ink}"/><path d="M38 34 C44 30 50 30 52 34 C48 38 42 38 38 34 Z" ${A(c)}/>`],
 summer:["夏：風鈴",c=>`<path d="M38 8 V16" ${A(c)}/><path d="M28 28 A10 10 0 0 1 48 28 Z" ${A(c)}/><path d="M36 30 H40 V46 H36 Z" fill="${c.ink}"/>`],
 autumn:["秋：どんぐり",c=>`<path d="M28 34 A10 8 0 0 1 48 34 Z" fill="${c.ink}"/><path d="M30 34 C30 44 46 44 46 34" ${A(c)}/><path d="M38 26 V22" ${A(c)}/>`],
 winter:["冬：ちらつく雪",c=>`<circle cx="22" cy="18" r="2" fill="${c.ink}"/><circle cx="50" cy="12" r="2" fill="${c.ink}"/><circle cx="58" cy="30" r="1.6" fill="${c.ink}"/><circle cx="34" cy="28" r="1.6" fill="${c.ink}"/><path d="M14 50 C24 44 50 44 62 50" ${A(c)}/><circle cx="40" cy="38" r="3" fill="${c.ink}"/>`],
};
const DAY={
 morning:["朝",c=>`<path d="M14 40 A8 8 0 0 1 30 40" fill="${c.primary}"/><path d="M8 40 H68" ${A(c)} stroke-opacity=".7"/>`],
 noon:["昼",c=>`<circle cx="38" cy="18" r="7" fill="${c.primary}"/><path d="M8 40 H68" ${A(c)} stroke-opacity=".7"/>`],
 night:["夜",c=>`<path d="M44 10 a10 10 0 1 0 8 16 a8 8 0 1 1 -8 -16 Z" fill="${c.primary}"/><circle cx="20" cy="14" r="1.2" fill="${c.ink}"/><circle cx="28" cy="26" r="1" fill="${c.ink}"/><path d="M8 40 H68" ${A(c)} stroke-opacity=".7"/>`],
};
// ロゴ：丸まってくつろぐ猫（目は開ける）。しっぽのベタ＋日だまり（はちみつ色）
const curl=(c,{sun=true,horizon=false}={})=>`${sun?`<circle cx="100" cy="20" r="7" fill="${c.primary}"/>`:''}${horizon?`<path d="M8 88 H58 M64 88 H112" ${A(c)} stroke-opacity=".7"/>`:''}
 <path d="M28 76 C24 56 44 44 66 46 C90 48 104 62 100 78 C97 88 84 90 70 88" ${A(c,G("62 6 32"))}/>
 <g id="tail"><path d="M70 88 C56 90 44 88 38 84" fill="none" stroke="${c.ink}" stroke-width="${SW*3}" stroke-linecap="round"/></g>
 <g id="head"><circle cx="38" cy="66" r="15" fill="${c.surface}" ${A(c,G("70 7 23"))}/>${ears(c,38,66)}${eyes(c,38,67)}</g>`;
const LOGO={
 logo_mark:["ねこと、ゆっくり ロゴマーク","0 0 120 100",c=>curl(c)],
 logo_mark_horizon:["ねこと、ゆっくり ロゴマーク（水平線つき）","0 0 120 100",c=>curl(c,{sun:false,horizon:true})],
};
const ICON={
 icon_a:["アプリアイコン案A（丸まる猫・クリーム地）",c=>`<rect width="1024" height="1024" fill="${c.bg}"/><g transform="translate(0 96) scale(8)">${curl(c)}</g>`],
 icon_b:["アプリアイコン案B（縁からのぞく猫・淡いはちみつ地）",c=>`<rect width="1024" height="1024" fill="${c.primaryTint}"/><g transform="translate(-568 -532) scale(18)">${POSES.peek[1](c)}</g>`],
 icon_c:["アプリアイコン案C（丸まる猫・はちみつ地）",c=>{const w={...c,ink:c===PAL.light?"#FFFFFF":c.bg,surface:c.primary,primary:c===PAL.light?"#F3E3C8":c.surface};return `<rect width="1024" height="1024" fill="${c.primary}"/><g transform="translate(0 96) scale(8)">${curl(w)}</g>`}],
};
// アイコン A の耳ちがい（ユーザー補足「もう少し耳を立てて猫っぽく」2026-11-15）
// e1：丸みのある三角耳／e2：とがった三角耳＋内側の線／e3：三角耳をベタにして、しっぽは細い線（ベタは耳の1か所）
const earsUp=(c,cx,cy,v)=>{
 const L=`M${cx-14} ${cy-5} Q${cx-16} ${cy-22} ${cx-12} ${cy-25} Q${cx-8} ${cy-21} ${cx-3} ${cy-14}`, R=`M${cx+3} ${cy-14} Q${cx+8} ${cy-21} ${cx+12} ${cy-25} Q${cx+16} ${cy-22} ${cx+14} ${cy-5}`;
 const Ls=`M${cx-14} ${cy-5} L${cx-13} ${cy-26} L${cx-3} ${cy-14}`, Rs=`M${cx+3} ${cy-14} L${cx+13} ${cy-26} L${cx+14} ${cy-5}`;
 if(v==="e1") return `<path d="${L}" fill="${c.surface}" ${A(c)}/><path d="${R}" fill="${c.surface}" ${A(c)}/>`;
 if(v==="e2") return `<path d="${Ls}" fill="${c.surface}" ${A(c)}/><path d="${Rs}" fill="${c.surface}" ${A(c)}/><path d="M${cx-11} ${cy-20} L${cx-8} ${cy-15} M${cx+11} ${cy-20} L${cx+8} ${cy-15}" ${A(c)}/>`;
 return `<path d="${Ls} Z" fill="${c.ink}" stroke="${c.ink}" stroke-width="${SW}" stroke-linejoin="round"/><path d="${Rs} Z" fill="${c.ink}" stroke="${c.ink}" stroke-width="${SW}" stroke-linejoin="round"/>`;
};
const curlUp=(c,v,{sun=true}={})=>`${sun?`<circle cx="100" cy="20" r="7" fill="${c.primary}"/>`:''}
 <path d="M28 76 C24 56 44 44 66 46 C90 48 104 62 100 78 C97 88 84 90 70 88" ${A(c,G("62 6 32"))}/>
 <g id="tail">${v==="e3"?`<path d="M70 88 C56 90 44 88 38 84" ${A(c)}/>`:`<path d="M70 88 C56 90 44 88 38 84" fill="none" stroke="${c.ink}" stroke-width="${SW*3}" stroke-linecap="round"/>`}</g>
 <g id="head">${earsUp(c,38,66,v)}<circle cx="38" cy="66" r="15" fill="${c.surface}" ${A(c,G("70 7 23"))}/>${eyes(c,38,67)}</g>`;
const ICON_DRAFTS=Object.fromEntries(["e1","e2","e3"].map(v=>[`icon_a_${v}`,[`アプリアイコン案A・耳の案 ${v}`,c=>`<rect width="1024" height="1024" fill="${c.bg}"/><g transform="translate(0 112) scale(8)">${curlUp(c,v)}</g>`]]));
const GUIDE=c=>`<path d="M2 40 H20 M26 40 H62" ${A(c)}/>${tail(c,"M44 39 C54 38 56 30 52 26")}${furHead(c,{cx:30,cy:40,r:14,half:true,dash:"58 8 34",earsSvg:ears(c,30,34),eyesSvg:eyesF(c,30,31)})}<path d="M19 40 q3 -4 6 0 M35 40 q3 -4 6 0" ${A(c)}/>`;
(async()=>{
 const b=await chromium.launch();const p=await b.newPage();
 const files=[];
 for(const mode of ["light","dark"]){const c=PAL[mode]; MODE=mode;
  for(const fur of FURS){ FUR=fur; const sfx=fur==="white"?"":`_${fur}`;
   files.push([`${mode}/guide/guide_peek${sfx}.svg`,wrap("0 12 64 32","案内役（縁からのぞく）",GUIDE(c))]);
   for(const [k,[l,f]] of Object.entries(POSES)) files.push([`${mode}/poses/pose_${k}${sfx}.svg`,wrap("0 10 120 80",l,f(c))]);
  }
  FUR="white";
  for(const [k,[l,f]] of Object.entries(SEASONS)) files.push([`${mode}/seasons/season_${k}.svg`,wrap("0 0 76 60",l,f(c))]);
  for(const [k,[l,f]] of Object.entries(DAY)) files.push([`${mode}/daypart/daypart_${k}.svg`,wrap("0 0 76 48",l,f(c))]);
  for(const [k,[l,vb,f]] of Object.entries(LOGO)) files.push([`${mode}/logo/${k}.svg`,wrap(vb,l,f(c))]);
 }
 for(const [k,[l,f]] of Object.entries(ICON)) files.push([`light/icon/${k}.svg`,wrap("0 0 1024 1024",l,f(PAL.light))]);
 for(const [k,[l,f]] of Object.entries(ICON_DRAFTS)) files.push([`light/icon/${k}.svg`,wrap("0 0 1024 1024",l,f(PAL.light))]);
 // pathLength 基準のすきまを、実寸のダッシュに直す（react-native-svg で pathLength に頼らないため）
 for(const f of files){
  f[1]=await p.evaluate(src=>{document.body.innerHTML=src;const s=document.body.firstElementChild;
   s.querySelectorAll('[pathLength]').forEach(el=>{const L=el.getTotalLength();const d=el.getAttribute('stroke-dasharray').split(/\s+/).map(Number).map(v=>+(v*L/100).toFixed(2));el.setAttribute('stroke-dasharray',d.join(' '));el.removeAttribute('pathLength');});
   return s.outerHTML;},f[1]);
  const fp=path.join(OUT,f[0]);fs.mkdirSync(path.dirname(fp),{recursive:true});fs.writeFileSync(fp,f[1]+"\n");
 }
 console.log(files.length,"files");
 await b.close();})();
