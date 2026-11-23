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
 if(FUR==="tabby"){const w="stroke-width=\"1.4\"";return `<path d="M${cx-1.8} ${top+2.4} l0.4 3.8 M${cx+1.8} ${top+2.4} l-0.4 3.8" ${A(c)} ${w}/>`+(eyeY!=null?`<path d="M${cx-r+2.2} ${eyeY+1.5} h3 M${cx+r-2.2} ${eyeY+1.5} h-3" ${A(c)} ${w}/>`:"");}
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
// ---- 案内役・しぐさの頭を f2 の顔にそろえる（2026-11-23、ユーザー決定）----
// 頭の形・耳・目・鼻・口・ひげは、アイコン f2（peekCat）を単位座標に直したもの。半径 r で拡大して置く。
// half=true は縁からのぞく形（cy が縁の高さ）。back=true はうしろ姿（顔なし）。
// アニメーション用 id：#head（頭全体）・#tail（しっぽ）はそのまま。目は <g id="eyes"> にまとめた（目を細める置き換え用）。
const U={
 headFull:"M-1.05 0.1 C-1.05 -0.55 -0.6 -0.9 0 -0.9 C0.6 -0.9 1.05 -0.55 1.05 0.1 C1.05 0.62 0.6 0.88 0 0.88 C-0.6 0.88 -1.05 0.62 -1.05 0.1 Z",
 headHalf:"M-1.077 0 C-1.077 -0.615 -0.692 -0.923 0 -0.923 C0.692 -0.923 1.077 -0.615 1.077 0",
 earL:[[-0.923,-0.538],[-0.962,-1.115],[-0.846,-1.423],[-0.538,-1.231],[-0.308,-0.846]],
 innerL:[[-0.788,-0.846],[-0.788,-1.077],[-0.75,-1.192]],
};
const sc=(d,cx,cy,r)=>d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g,(_,x,y)=>`${+(cx+Number(x)*r).toFixed(2)} ${+(cy+Number(y)*r).toFixed(2)}`);
const P=(cx,cy,r,[x,y],m=1)=>`${+(cx+m*x*r).toFixed(2)} ${+(cy+y*r).toFixed(2)}`;
const catHead=(c,{cx,cy,r,half=false,back=false,dash="60 7 33"})=>{
 const fill=faceFill(c), k=faceInk(c);
 const ear=m=>{const e=U.earL;return `<path d="M${P(cx,cy,r,e[0],m)} Q${P(cx,cy,r,e[1],m)} ${P(cx,cy,r,e[2],m)} Q${P(cx,cy,r,e[3],m)} ${P(cx,cy,r,e[4],m)}" fill="${fill}" ${A(c)}/>`;};
 const inner=m=>{const e=U.innerL;return `M${P(cx,cy,r,e[0],m)} Q${P(cx,cy,r,e[1],m)} ${P(cx,cy,r,e[2],m)}`;};
 const shape=half?sc(U.headHalf,cx,cy,r):sc(U.headFull,cx,cy,r);
 const top=cy-0.92*r;
 const dy=half?0:0.34; // 顔のパーツの縦位置（半円の頭は縁の上、まるい頭は少し下げる）
 const y=v=>+(cy+(v+dy)*r).toFixed(2), x=v=>+(cx+v*r).toFixed(2);
 const fs=Math.max(0.9,r*0.05); // 顔の細い線の太さ
 let face="";
 if(!back){
  const erx=+(0.104*r*1.18).toFixed(2), ery=+(0.131*r*1.18).toFixed(2);
  face=`<g id="eyes"><ellipse cx="${x(-0.346)}" cy="${y(-0.538)}" rx="${erx}" ry="${ery}" fill="${k}"/><ellipse cx="${x(0.346)}" cy="${y(-0.538)}" rx="${erx}" ry="${ery}" fill="${k}"/></g>`
   +`<path d="M${x(-0.092)} ${y(-0.346)} H${x(0.092)} L${x(0)} ${y(-0.246)} Z" fill="${k}" stroke="${k}" stroke-width="${fs*0.8}" stroke-linejoin="round"/>`
   +`<path d="M${x(0)} ${y(-0.246)} V${y(-0.192)} M${x(0)} ${y(-0.192)} q${+(-0.065*r).toFixed(2)} ${+(0.088*r).toFixed(2)} ${+(-0.162*r).toFixed(2)} ${+(0.058*r).toFixed(2)} M${x(0)} ${y(-0.192)} q${+(0.065*r).toFixed(2)} ${+(0.088*r).toFixed(2)} ${+(0.162*r).toFixed(2)} ${+(0.058*r).toFixed(2)}" fill="none" stroke="${k}" stroke-width="${fs}" stroke-linecap="round" stroke-linejoin="round"/>`
   +`<path d="M${x(-0.615)} ${y(-0.308)} L${x(-1.038)} ${y(-0.365)} M${x(-0.615)} ${y(-0.192)} L${x(-1.019)} ${y(-0.135)} M${x(0.615)} ${y(-0.308)} L${x(1.038)} ${y(-0.365)} M${x(0.615)} ${y(-0.192)} L${x(1.019)} ${y(-0.135)}" fill="none" stroke="${k}" stroke-width="${fs*0.85}" stroke-linecap="round"/>`;
 }
 const pattern=furPattern(c,cx,top,r,null);
 const innerEars=back?"":`<path d="${inner(1)} ${inner(-1)}" fill="none" stroke="${c.ink}" stroke-width="${fs}" stroke-linecap="round"/>`;
 return `<g id="head">${ear(1)}${ear(-1)}${innerEars}<path d="${shape}${half?" Z":""}" fill="${fill}"/>${pattern}<path d="${shape}" ${A(c,G(dash))}/>${face}</g>`;
};
const head=(c,cx,cy,r=14)=>catHead(c,{cx,cy,r});
const wrap=(vb,label,inner)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${label}">${inner}</svg>`;
const POSES={
 sit:["すわる",c=>`${ground(c,80,14,106)}<path d="M40 80 C40 58 48 48 60 48 C72 48 80 58 80 80" ${A(c,G("44 6 50"))}/><path d="M54 80 v-7 M66 80 v-7" ${A(c)}/>${tail(c,"M80 78 C94 78 98 66 90 60")}${head(c,60,36)}`],
 peek:["縁からのぞく",c=>`<path d="M14 64 H52 M58 64 H106" ${A(c)}/>${tail(c,"M74 63 C84 62 86 54 82 50")}${catHead(c,{cx:60,cy:64,r:14,half:true})}<path d="M49 64 q3 -4 6 0 M65 64 q3 -4 6 0" ${A(c)}/>`],
 stretch:["のびる",c=>`${ground(c,80,10,110)}<path d="M34 62 C50 62 66 52 84 48" ${A(c,G("60 8 32"))}/><path d="M38 76 C52 74 62 72 74 70" ${A(c)}/><path d="M84 48 C89 58 89 70 87 80 M76 68 L78 80" ${A(c)}/><path d="M18 79 H34 M22 75 H36" ${A(c)}/>${tail(c,"M86 48 C92 38 90 30 97 26")}${catHead(c,{cx:26,cy:65,r:11})}`],
 loaf:["香箱すわり",c=>`${ground(c,80,14,108)}<path d="M30 80 C30 62 44 54 62 54 C82 54 94 64 94 80" ${A(c,G("48 6 46"))}/>${tail(c,"M94 78 C102 78 104 70 99 66")}${head(c,42,52,13)}`],
 window:["窓の外を見る（うしろ姿）",c=>`${ground(c,80,14,106)}<path d="M44 80 C42 62 50 52 60 52 C70 52 78 62 76 80" ${A(c,G("46 6 48"))}/>${tail(c,"M76 78 C90 80 96 70 90 62")}${catHead(c,{cx:60,cy:40,r:13,back:true})}`],
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
// ---- アイコンの新しい方向（2026-11-16、ユーザーの声「親しみ・ゆっくり落ち着き・毎日開きたくなる」）----
// 100×100 で描いて 1024 に拡大。線は前の案の約1.5倍（1024px 換算で 14px → 約22px）
const SWI=2.15;
const AI=(c,extra="")=>`fill="none" stroke="${c.ink}" stroke-width="${SWI}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;
const dot=(c,x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c.ink}"/>`;
const ICON_V2={
 // A：ほっぺの顔アップ。大きな顔が目を合わせる。ベタは片耳だけ
 v2_face:["アイコン新案A（ほっぺの顔アップ）",c=>`<rect width="100" height="100" fill="${c.primaryTint}"/>
  <path d="M24 46 Q19 19 26 14 Q36 19 43 31 Z" fill="${c.ink}" stroke="${c.ink}" stroke-width="${SWI}" stroke-linejoin="round"/>
  <path d="M57 31 Q64 19 74 14 Q81 19 76 46" fill="${c.surface}" ${AI(c)}/>
  <ellipse cx="50" cy="57" rx="30" ry="26" fill="${c.surface}"/><ellipse cx="50" cy="57" rx="30" ry="26" ${AI(c,G("78 6 16"))}/>
  <ellipse cx="31" cy="65" rx="4.6" ry="2.8" fill="#E9C08A"/><ellipse cx="69" cy="65" rx="4.6" ry="2.8" fill="#E9C08A"/>
  ${dot(c,39,56,3.2)}${dot(c,61,56,3.2)}${dot(c,50,62,1.7)}
  <path d="M44 66 q3 3 6 0 q3 3 6 0" ${AI(c)}/>`],
 // B：縁から見上げる。下の縁から顔を出して、こちらを待っている。ベタはしっぽ
 v2_peek:["アイコン新案B（縁から見上げる）",c=>`<rect width="100" height="100" fill="${c.bg}"/>
  <path d="M76 77 C90 75 92 60 83 54" fill="none" stroke="${c.ink}" stroke-width="${SWI*2.6}" stroke-linecap="round"/>
  <path d="M30 62 Q26 40 33 36 Q41 41 45 53" fill="${c.surface}" ${AI(c)}/><path d="M55 53 Q59 41 67 36 Q74 40 70 62" fill="${c.surface}" ${AI(c)}/>
  <path d="M24 78 A26 26 0 0 1 76 78 Z" fill="${c.surface}"/><path d="M24 78 A26 26 0 0 1 76 78" ${AI(c,G("60 7 33"))}/>
  ${dot(c,41,62,3)}${dot(c,59,62,3)}${dot(c,50,68,1.6)}<path d="M47 71.5 q3 2.6 6 0" ${AI(c)}/>
  <path d="M6 78 H94" ${AI(c)}/><path d="M33 78 q5 -6 10 0 M57 78 q5 -6 10 0" fill="${c.surface}" ${AI(c)}/>`],
 // C：ちょこんとおすわり。はちみつ地に、クリームの猫がシールのように座る。首を少しかしげる。ベタはしっぽ
 v2_sit:["アイコン新案C（ちょこんとおすわり）",c=>`<rect width="100" height="100" fill="${c.primary}"/>
  <path d="M30 86 H70" ${AI(c)} stroke="${c.surface}" stroke-opacity=".8"/>
  <path d="M66 84 C82 84 84 70 76 64" fill="none" stroke="${c.ink}" stroke-width="${SWI*2.6}" stroke-linecap="round"/>
  <path d="M33 85 C31 64 39 53 50 53 C61 53 69 64 67 85 Z" fill="${c.surface}" ${AI(c,G("70 6 24"))}/>
  <path d="M44 85 v-9 M56 85 v-9" ${AI(c)}/>
  <g transform="rotate(-10 50 37)"><path d="M34 34 Q31 15 37 12 Q44 17 47 24" fill="${c.surface}" ${AI(c)}/><path d="M53 24 Q56 17 63 12 Q69 15 66 34" fill="${c.surface}" ${AI(c)}/>
  <circle cx="50" cy="37" r="17" fill="${c.surface}"/><circle cx="50" cy="37" r="17" ${AI(c,G("72 7 21"))}/>
  ${dot(c,43,37,2.6)}${dot(c,57,37,2.6)}${dot(c,50,42,1.4)}<path d="M47 45 q3 2.4 6 0" ${AI(c)}/></g>`],
 // D：ノートと猫。ひらいたノートの向こうから顔を出す。「記録」とつながる。ベタはしっぽ
 v2_note:["アイコン新案D（ノートの向こうから）",c=>`<rect width="100" height="100" fill="${c.accentTint}"/>
  <path d="M74 66 C88 62 90 48 82 42" fill="none" stroke="${c.ink}" stroke-width="${SWI*2.6}" stroke-linecap="round"/>
  <path d="M32 46 Q28 25 35 21 Q42 26 46 36" fill="${c.surface}" ${AI(c)}/><path d="M54 36 Q58 26 65 21 Q72 25 68 46" fill="${c.surface}" ${AI(c)}/>
  <circle cx="50" cy="52" r="21" fill="${c.surface}"/><circle cx="50" cy="52" r="21" ${AI(c,G("74 7 19"))}/>
  ${dot(c,42,50,2.9)}${dot(c,58,50,2.9)}${dot(c,50,56,1.6)}
  <path d="M12 70 Q31 63 50 70 Q69 63 88 70 V88 Q69 81 50 88 Q31 81 12 88 Z" fill="${c.surface}" ${AI(c)}/><path d="M50 70 V88" ${AI(c)}/>
  <path d="M20 76 Q31 72 42 76 M58 76 Q69 72 80 76" ${AI(c)} stroke-opacity=".45"/>
  <path d="M35 70 q4 -5 8 0 M57 70 q4 -5 8 0" fill="${c.surface}" ${AI(c)}/>`],
};
// ---- アイコン B「縁から見上げる」の仕上げ（2026-11-18、ユーザー補足「もう少し猫っぽく、ひげなど」）----
// 鼻を小さな逆三角に、口を「ω」に。ひげは3案：w2s 2本・短め／w3 3本／w2l 2本・長め
const WHISK={
 w2s:[[35,67,24,64.5],[35,70.5,24,71.5]],
 w3:[[35,66.5,22,63.5],[35,69.5,21.5,69.5],[35,72.5,22.5,75]],
 w2l:[[35,67,16,63],[35,70.5,16,72]],
};
const peekB=(c,v,{bg=true,line=SWI}={})=>{
 const L=(extra="")=>`fill="none" stroke="${c.ink}" stroke-width="${line}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;
 const wl=WHISK[v].map(([x1,y1,x2,y2])=>`M${x1} ${y1} L${x2} ${y2} M${100-x1} ${y1} L${100-x2} ${y2}`).join(" ");
 return `${bg?`<rect width="100" height="100" fill="${c.bg}"/>`:""}
  <g id="tail"><path d="M83 77 C96 76 97 60 89 55" fill="none" stroke="${c.ink}" stroke-width="${line*2.6}" stroke-linecap="round"/></g>
  <g id="head"><path d="M30 62 Q26 40 33 36 Q41 41 45 53" fill="${c.surface}" ${L()}/><path d="M55 53 Q59 41 67 36 Q74 40 70 62" fill="${c.surface}" ${L()}/>
  <path d="M24 78 A26 26 0 0 1 76 78 Z" fill="${c.surface}"/><path d="M24 78 A26 26 0 0 1 76 78" ${L(G("60 7 33"))}/>
  <circle cx="41" cy="62" r="3" fill="${c.ink}"/><circle cx="59" cy="62" r="3" fill="${c.ink}"/>
  <path d="M47.6 66.4 H52.4 L50 69.2 Z" fill="${c.ink}" stroke="${c.ink}" stroke-width="1.1" stroke-linejoin="round"/>
  <path d="M50 69.2 v1.4 M44.8 70.6 q2.6 2.6 5.2 0 q2.6 2.6 5.2 0" ${L()}/>
  <path d="${wl}" ${L(`stroke-width="${line*0.62}"`)}/></g>
  <path d="M6 78 H94" ${L()}/><path d="M33 78 q5 -6 10 0 M57 78 q5 -6 10 0" fill="${c.surface}" ${L()}/>`;
};
// ---- B の「ネズミっぽさ」を直す案（2026-11-20、ユーザー補足「なんかネズミっぽくない？」）----
// ネズミに見えた要因：半円の頭（横長で低い）＋離れた耳＋「ω」の口＋顔の端から水平に出るひげ。
// f1：耳を内寄せ＋耳の内側の線、口を「人」の字、ひげを少し下向きに
// f2：f1＋頭をほおの張った猫の形に（上が平ら気味・下が広い）、耳を頭の角に、目を縦長に
// f3：f2＋ひげを口元（マズル）から出す、目に小さな光
const peekCat=(c,v,{bg=true,line=SWI,hz=[6,94]}={})=>{
 const L=(extra="")=>`fill="none" stroke="${c.ink}" stroke-width="${line}" stroke-linecap="round" stroke-linejoin="round" ${extra}`;
 const f1=v==="f1";
 const ears=f1
  ?`<path d="M32 60 Q30 42 35 37 Q41 42 46 53" fill="${c.surface}" ${L()}/><path d="M68 60 Q70 42 65 37 Q59 42 54 53" fill="${c.surface}" ${L()}/><path d="M35.5 51 Q35.5 46 36.5 43 M64.5 51 Q64.5 46 63.5 43" ${L(`stroke-width="${line*0.6}"`)}/>`
  :`<path d="M26 64 Q25 49 28 41 Q36 46 42 56" fill="${c.surface}" ${L()}/><path d="M74 64 Q75 49 72 41 Q64 46 58 56" fill="${c.surface}" ${L()}/><path d="M29.5 56 Q29.5 50 30.5 47 M70.5 56 Q70.5 50 69.5 47" ${L(`stroke-width="${line*0.6}"`)}/>`;
 const headD=f1?"M24 78 A26 26 0 0 1 76 78":"M22 78 C22 62 32 54 50 54 C68 54 78 62 78 78";
 const eyes=f1
  ?`<circle cx="41" cy="62" r="3" fill="${c.ink}"/><circle cx="59" cy="62" r="3" fill="${c.ink}"/>`
  :`<ellipse cx="41" cy="64" rx="2.7" ry="3.4" fill="${c.ink}"/><ellipse cx="59" cy="64" rx="2.7" ry="3.4" fill="${c.ink}"/>`+(v==="f3"?`<circle cx="42" cy="62.6" r="0.95" fill="${c.surface}"/><circle cx="60" cy="62.6" r="0.95" fill="${c.surface}"/>`:"");
 const ny=f1?67:69; // 鼻の上の位置
 const nose=`<path d="M47.6 ${ny} H52.4 L50 ${ny+2.6} Z" fill="${c.ink}" stroke="${c.ink}" stroke-width="1.1" stroke-linejoin="round"/>`;
 const mouth=`<path d="M50 ${ny+2.6} v1.4 M50 ${ny+4} q-1.7 2.3 -4.2 1.5 M50 ${ny+4} q1.7 2.3 4.2 1.5" ${L()}/>`;
 const W=v==="f3"?[[43,ny+3,24,ny+0.5],[43,ny+5,24.5,ny+7.5]]:f1?[[35,ny+0.5,24.5,ny-1],[35,ny+3.5,25,ny+5]]:[[34,ny+1,23,ny-0.5],[34,ny+4,23.5,ny+5.5]];
 const wl=W.map(([x1,y1,x2,y2])=>`M${x1} ${y1} L${x2} ${y2} M${100-x1} ${y1} L${100-x2} ${y2}`).join(" ");
 return `${bg?`<rect width="100" height="100" fill="${c.bg}"/>`:""}
  <g id="tail"><path d="M83 77 C96 76 97 60 89 55" fill="none" stroke="${c.ink}" stroke-width="${line*2.6}" stroke-linecap="round"/></g>
  <g id="head">${ears}<path d="${headD} Z" fill="${c.surface}"/><path d="${headD}" ${L(G("60 7 33"))}/>${eyes}${nose}${mouth}
  <path d="${wl}" ${L(`stroke-width="${line*0.62}"`)}/></g>
  <path d="M${hz[0]} 78 H${hz[1]}" ${L()}/><path d="M33 78 q5 -6 10 0 M57 78 q5 -6 10 0" fill="${c.surface}" ${L()}/>`;
};
// ---- 確定版（2026-11-22）：アイコン f2「縁から見上げる」＋ロゴ（水平線つき・同じ顔）----
const FINAL=[];
{
 const L=PAL.light, D=PAL.dark;
 // iOS / Expo icon：1024 角・不透明・角丸なし（角丸は OS がかける）
 FINAL.push(["icon/app_icon_1024.svg",wrap("0 0 100 100","ねこと、ゆっくり アプリアイコン",peekCat(L,"f2"))]);
 // Android アダプティブ：108dp のキャンバス。見える範囲は中央 72dp、セーフゾーンは直径 66dp の円。
 // 猫（耳〜前足・しっぽ）をセーフゾーンに収め、水平線だけはキャンバスの端まで伸ばす（マスクで切れてよい）
 const fg=(c)=>`<g transform="translate(54 56) scale(0.66) translate(-56 -60)">${peekCat(c,"f2",{bg:false,hz:[-40,152]})}</g>`;
 FINAL.push(["icon/android_adaptive_foreground.svg",wrap("0 0 108 108","アダプティブアイコン 前景",fg(L))]);
 FINAL.push(["icon/android_adaptive_background.svg",wrap("0 0 108 108","アダプティブアイコン 背景",`<rect width="108" height="108" fill="${L.bg}"/>`)]);
 // Android 13 以降のテーマアイコン用（単色）。同じ形を 1 色で
 const mono={...L,ink:"#000000",surface:"#FFFFFF00"};
 FINAL.push(["icon/android_adaptive_monochrome.svg",wrap("0 0 108 108","アダプティブアイコン 単色",fg(mono))]);
 // 通知の小さなアイコン（Android）：白一色・透過。線では細すぎるので、頭と耳を塗りつぶし、目を抜く
 FINAL.push(["icon/notification_icon.svg",wrap("0 0 96 96","通知アイコン",`<defs><mask id="eyes"><rect width="96" height="96" fill="#fff"/><ellipse cx="38" cy="52" rx="5" ry="6.4" fill="#000"/><ellipse cx="58" cy="52" rx="5" ry="6.4" fill="#000"/><path d="M44.5 61 H51.5 L48 65 Z" fill="#000"/></mask></defs>
  <g mask="url(#eyes)" fill="#FFFFFF"><path d="M16 74 C16 52 28 40 48 40 C68 40 80 52 80 74 Z"/><path d="M18 58 Q16 34 22 22 Q34 28 40 41 Z"/><path d="M78 58 Q80 34 74 22 Q62 28 56 41 Z"/></g>
  <path d="M8 80 H88" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>`)]);
 // ロゴマーク（水平線つき・f2 の顔）明・暗
 for(const [m,c] of [["light",L],["dark",D]]) FINAL.push([`logo/logo_mark_${m}.svg`,wrap("2 30 96 52","ねこと、ゆっくり ロゴマーク",peekCat(c,"f2",{bg:false}))]);
 // スプラッシュ：透過の画像を中央に置き、背景色は app.json で指定（明 #FBF5EA／暗 #1F1A14）
 for(const [m,c] of [["light",L],["dark",D]]) FINAL.push([`splash/splash_${m}.svg`,wrap("-30 0 160 110","ねこと、ゆっくり スプラッシュ",peekCat(c,"f2",{bg:false}))]);
}
const GUIDE=c=>`<path d="M2 40 H20 M26 40 H62" ${A(c)}/>${tail(c,"M44 39 C54 38 56 30 52 26")}${catHead(c,{cx:30,cy:40,r:14,half:true})}<path d="M19 40 q3 -4 6 0 M35 40 q3 -4 6 0" ${A(c)}/>`;
// ---- 体験の見本用の素材（2026-11-23、ユーザーの選択「猫の部屋／カード／絵日記／話しかける猫／なでると反応」）----
// 気持ち：落ち着く・安心する。静けさと余白を優先。答えの絵のルール（表情・色で良し悪しを付けない）を守る。
// 「寝ている」場面は、横たわって目を閉じた姿にしない（brand_guide §5-2）。寝床で丸まって、目を開けてくつろぐ姿にする。
const EXTRA_NIGHT={light:"#3A3229",dark:"#14110D"}, EXTRA_EVE={light:"#F0D2A8",dark:"#4A3826"};
// 歩くしぐさ：体・頭・しっぽは同じで、脚だけ3コマで変える（0→1→2→1→0… の順に 0.25 秒ずつが目安）
const WALK=(c,f)=>{const legs=[
 "M44 70 L40 80 M52 71 L55 80 M76 71 L73 80 M84 69 L88 80",
 "M44 70 L44 80 M52 71 L51 80 M76 71 L77 80 M84 69 L84 80",
 "M44 70 L48 80 M52 71 L47 80 M76 71 L81 80 M84 69 L80 80"][f];
 return `${tail(c,"M88 58 C98 52 100 40 94 34")}<path d="M38 58 C48 52 74 52 88 58 C90 64 88 68 84 70 C70 73 52 73 40 70" ${A(c)}/><path d="${legs}" ${A(c)}/>${catHead(c,{cx:34,cy:50,r:12})}`;};
const CAT={ // 猫のしぐさ（120×80、地面 y=80。#head・#tail・#eyes の id は従来どおり）
walk:c=>WALK(c,0),
 walk2:c=>WALK(c,1),
 walk3:c=>WALK(c,2),
 eat:c=>`${tail(c,"M92 78 C100 78 102 70 97 66")}<path d="M34 80 C34 66 46 60 62 60 C80 60 92 68 92 80" ${A(c,G("48 6 46"))}/>${catHead(c,{cx:40,cy:62,r:12})}`,
 bed:c=>`${tail(c,"M94 78 C102 78 104 70 99 66")}<path d="M30 80 C30 62 44 54 62 54 C82 54 94 64 94 80" ${A(c,G("48 6 46"))}/>${catHead(c,{cx:42,cy:52,r:13})}`,
 sit:c=>POSES.sit[1](c), window:c=>POSES.window[1](c),
};
const room={
 // 部屋（360×240）。床 y=200。窓は左上（十字の桟は入れない）。家具は奥（back）と手前（front）に分ける
 window:(c,t)=>{const sky=t==="night"?EXTRA_NIGHT[MODE]:t==="evening"?EXTRA_EVE[MODE]:t==="morning"?c.primaryTint:c.surface;
  const sun=t==="night"?`<path d="M98 56 a9 9 0 1 0 7 14 a7 7 0 1 1 -7 -14 Z" fill="${c.primary}"/><circle cx="66" cy="60" r="1.2" fill="${MODE==="dark"?c.ink:"#F3E8D8"}"/><circle cx="80" cy="88" r="1" fill="${MODE==="dark"?c.ink:"#F3E8D8"}"/>`
   :t==="evening"?`<path d="M58 108 A12 12 0 0 1 82 108 Z" fill="${c.primary}"/>`
   :t==="morning"?`<circle cx="102" cy="96" r="9" fill="${c.primary}"/>`:`<circle cx="86" cy="58" r="9" fill="${c.primary}"/>`;
  return `<path d="M40 130 V70 A45 45 0 0 1 130 70 V130 Z" fill="${sky}"/>${sun}<path d="M40 130 V70 A45 45 0 0 1 130 70 V130" ${A(c,G("70 5 25"))}/><path d="M32 132 H138" ${A(c)}/>`;},
 weather:{
  sunny:c=>"",
  cloudy:c=>`<path d="M60 96 a8 8 0 0 1 14 -6 a10 10 0 0 1 18 4 a6 6 0 0 1 2 12 H62 a6 6 0 0 1 -2 -10 Z" fill="${c.surface}" ${A(c)}/>`,
  rain:c=>`<path d="M56 80 l-3 8 M74 72 l-3 8 M92 84 l-3 8 M110 76 l-3 8 M64 104 l-3 8 M100 104 l-3 8" ${A(c)} stroke-opacity=".6"/>`,
  snow:c=>[[58,82],[78,72],[96,88],[112,78],[66,108],[104,110],[86,104]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.8" fill="${c.ink}" fill-opacity=".7"/>`).join(""),
 },
 floor:c=>`<path d="M8 200 H170 M178 200 H352" ${A(c)} stroke-opacity=".7"/>`,
 bed:c=>`<ellipse cx="72" cy="196" rx="46" ry="10" fill="${c.primaryTint}" ${A(c)}/><path d="M30 194 C30 182 114 182 114 194" ${A(c,G("70 6 24"))}/>`,
 bowl_food:c=>`<path d="M136 190 H170 L166 200 H140 Z" fill="${c.surface}" ${A(c)}/><path d="M139 197 H167" stroke="${c.ink}" stroke-width="${SW*2}" stroke-linecap="round"/><circle cx="146" cy="188" r="1.6" fill="${c.ink}"/><circle cx="152" cy="187" r="1.6" fill="${c.ink}"/><circle cx="158" cy="188" r="1.6" fill="${c.ink}"/><circle cx="163" cy="187.6" r="1.4" fill="${c.ink}"/>`,
 bowl_water:c=>`<path d="M182 190 H216 L212 200 H186 Z" fill="${c.surface}" ${A(c)}/><path d="M190 189 q4 -2 8 0 q4 2 8 0" ${A(c)} stroke-opacity=".6"/>`,
 toilet_back:c=>`<path d="M252 200 V178 H334 V200" fill="${c.surface}" ${A(c)}/>`,
 shelf:c=>`<path d="M232 96 H322" ${A(c)}/><path d="M240 96 v6 M314 96 v6" ${A(c)}/><path d="M248 96 V82 H258 V96 M262 96 V78 H270 V96" fill="${c.surface}" ${A(c)}/><path d="M290 96 c0 -8 4 -12 8 -12 c4 0 8 4 8 12 Z" fill="${c.surface}" ${A(c)}/><path d="M298 84 c-2 -6 2 -10 6 -10" ${A(c)}/>`,
 wall_picture:c=>`<rect x="252" y="34" width="52" height="38" rx="3" fill="${c.surface}" ${A(c)}/><path d="M258 64 Q270 50 280 60 Q288 52 298 64" ${A(c)}/><circle cx="288" cy="46" r="4" fill="${c.primary}"/>`,
 toilet_front:c=>`<path d="M246 200 V186 H340 V200" fill="${c.surface}" ${A(c)}/><circle cx="262" cy="182" r="1" fill="${c.ink}" fill-opacity=".5"/><circle cx="320" cy="183" r="1" fill="${c.ink}" fill-opacity=".5"/>`,
};
// 猫を置く場所（部屋の座標）。猫のしぐさ SVG（120×80）の「地面の中央（60,80）」をこの点に合わせ、scale 倍で置く
const ROOM_SPOTS={scale:1.0,
 bed:{x:72,y:196,pose:"bed"}, window:{x:72,y:192,pose:"window"}, food:{x:153,y:196,pose:"sit",front:"bowl_food"},
 water:{x:199,y:196,pose:"sit",front:"bowl_water"}, toilet:{x:292,y:194,pose:"sit",front:"toilet_front"}, walk:{x:240,y:200,pose:"walk"}};
// カード（160×120）：1問1枚の絵柄。良し悪しを示さない、ただの「もの」の絵
const CARDS={
 food:c=>`<path d="M20 100 H140" ${A(c)} stroke-opacity=".6"/><g transform="translate(-164.8 -220) scale(1.6)">${room.bowl_food(c)}</g>`,
 water:c=>`<path d="M20 100 H140" ${A(c)} stroke-opacity=".6"/><g transform="translate(-238.4 -220) scale(1.6)">${room.bowl_water(c)}</g><path d="M80 34 C74 50 72 54 72 58 a8 8 0 0 0 16 0 C88 54 86 50 80 40 Z" fill="${c.surface}" ${A(c)}/>`,
 toilet:c=>`<path d="M20 100 H140" ${A(c)} stroke-opacity=".6"/><g transform="translate(-178 -150) scale(1.0)"><path d="M218 250 V228 H302 V250" fill="${c.surface}" ${A(c)}/><path d="M212 250 V236 H308 V250" fill="${c.surface}" ${A(c)}/></g><path d="M112 58 L104 84" stroke="${c.ink}" stroke-width="${SW*2.4}" stroke-linecap="round"/><path d="M98 84 H112 L110 92 H100 Z" fill="${c.surface}" ${A(c)}/>`,
 energy:c=>`<g transform="translate(20 22)">${POSES.sit[1](c)}</g>`,
};
// 絵日記（200×140）の1コマ。枠（すきまのある角丸）＋場面
const DIARY_FRAME=c=>`<rect x="4" y="4" width="192" height="132" rx="10" fill="${c.surface}"/><rect x="4" y="4" width="192" height="132" rx="10" ${A(c,G("40 4 56"))}/>`;
const DIARY_PAPER={
 lines:c=>`<rect x="4" y="4" width="192" height="132" rx="10" fill="${c.surface}"/>${[30,52,74,96].map(y=>`<path d="M16 ${y} H184" stroke="${c.ink}" stroke-opacity=".12" stroke-width="1"/>`).join("")}<rect x="4" y="4" width="192" height="132" rx="10" ${A(c,G("40 4 56"))}/>`,
 dots:c=>`<rect x="4" y="4" width="192" height="132" rx="10" fill="${c.surface}"/>${Array.from({length:6},(_,i)=>Array.from({length:10},(_,j)=>`<circle cx="${22+j*17.4}" cy="${20+i*18}" r=".9" fill="${c.ink}" fill-opacity=".18"/>`).join("")).join("")}<rect x="4" y="4" width="192" height="132" rx="10" ${A(c,G("40 4 56"))}/>`,
 tape:c=>`<rect x="4" y="4" width="192" height="132" rx="10" fill="${c.surface}"/><rect x="4" y="4" width="192" height="132" rx="10" ${A(c,G("40 4 56"))}/><path d="M82 -2 h36 l-2 14 h-32 Z" fill="${c.primaryTint}" opacity=".9"/>`,
};
const DIARY={
 meal:c=>`${DIARY_FRAME(c)}<path d="M16 116 H184" ${A(c)} stroke-opacity=".6"/><g transform="translate(-14 -84)">${room.bowl_food(c)}</g><g transform="translate(20 38) scale(0.95)">${CAT.sit(c)}</g>`,
 drink:c=>`${DIARY_FRAME(c)}<path d="M16 116 H184" ${A(c)} stroke-opacity=".6"/><g transform="translate(-60 -84)">${room.bowl_water(c)}</g><g transform="translate(20 38) scale(0.95)">${CAT.sit(c)}</g>`,
 rest:c=>`${DIARY_FRAME(c)}<g transform="translate(28 -82)">${room.bed(c)}</g><g transform="translate(41 34) scale(0.95)">${CAT.bed(c)}</g>`,
 window:c=>`${DIARY_FRAME(c)}<g transform="translate(15 -12)">${room.window(c,"noon")}</g><path d="M16 116 H184" ${A(c)} stroke-opacity=".6"/><g transform="translate(39 38) scale(0.95)">${CAT.window(c)}</g>`,
};
// 絵日記のコマの隅に置く、記録した項目の小さなアイコン（24×24）。場面の絵とは別に、事実として「記録した項目」だけを示す
const ITEM={
 food:c=>`<path d="M4 12 H20 L18 18 H6 Z" ${A(c)}/><circle cx="9" cy="10.4" r="1" fill="${c.ink}"/><circle cx="12" cy="10" r="1" fill="${c.ink}"/><circle cx="15" cy="10.4" r="1" fill="${c.ink}"/>`,
 water:c=>`<path d="M12 4 C9 9 7.5 11.5 7.5 14 a4.5 4.5 0 0 0 9 0 C16.5 11.5 15 9 12 4 Z" ${A(c)}/>`,
 toilet:c=>`<path d="M4 18 V11 H20 V18 Z" ${A(c)}/><path d="M7 14 h1 M11 15 h1 M15 14 h1" ${A(c)}/>`,
 energy:c=>`<path d="M6 12 Q5.5 5 7.5 4 Q10 6 10.5 8.5 M13.5 8.5 Q14 6 16.5 4 Q18.5 5 18 12" ${A(c)}/><path d="M5.6 13 C5.6 9.6 8 8 12 8 C16 8 18.4 9.6 18.4 13 C18.4 17 15.5 19.5 12 19.5 C8.5 19.5 5.6 17 5.6 13 Z" ${A(c)}/><circle cx="9.6" cy="12.6" r="1" fill="${c.ink}"/><circle cx="14.4" cy="12.6" r="1" fill="${c.ink}"/>`,
 fluid:c=>`<path d="M9 4 H15 M10 4 V12 L8 18 H16 L14 12 V4" ${A(c)}/>`,
 med:c=>`<rect x="4" y="9" width="16" height="7" rx="3.5" ${A(c)}/><path d="M12 9 V16" ${A(c)}/>`,
};
// 話しかける猫（80×80）：どの質問でも同じおだやかな顔。ふきだしは別ファイル（文字はアプリ側で入れる）
const TALK=c=>`${catHead(c,{cx:40,cy:46,r:22})}<path d="M22 76 q4 -6 8 0 M50 76 q4 -6 8 0" fill="${c.surface}" ${A(c)}/><path d="M6 77 H74" ${A(c)}/>`;
const BUBBLE=c=>`<path d="M14 6 H186 a10 10 0 0 1 10 10 V54 a10 10 0 0 1 -10 10 H30 L16 76 L18 64 H14 a10 10 0 0 1 -10 -10 V16 a10 10 0 0 1 10 -10 Z" fill="${c.surface}" ${A(c)}/>`;
// なでたときの反応（案内役と同じ 64×32 の枠）：目を細める／ごろごろ（ほおの横に小さな弧）
const squintEyes=svg=>svg.replace(/<g id="eyes">([\s\S]*?)<\/g>/,(_m,inner)=>`<g id="eyes">${[...inner.matchAll(/<ellipse cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)"[^>]*fill="([^"]+)"/g)].map(([,cx,cy,rx,col])=>{const w=rx*2.4,h=w*0.35;return `<path d="M${+cx-w/2} ${+cy+h/2} Q${+cx} ${+cy-h} ${+cx+w/2} ${+cy+h/2}" fill="none" stroke="${col}" stroke-width="1.4" stroke-linecap="round"/>`}).join("")}</g>`);
const PET={
 squint:c=>squintEyes(GUIDE(c)),
 purr:c=>squintEyes(GUIDE(c))+`<path d="M8 28 q-3 3 0 6 M5 26 q-4 5 0 10 M52 28 q3 3 0 6 M55 26 q4 5 0 10" ${A(c)} stroke-opacity=".55" stroke-width="1.2"/>`,
};
(async()=>{
 const b=await chromium.launch();const p=await b.newPage();
 const files=[];
 for(const mode of ["light","dark"]){const c=PAL[mode]; MODE=mode;
  for(const fur of FURS){ FUR=fur; const sfx=fur==="white"?"":`_${fur}`;
   files.push([`${mode}/guide/guide_peek${sfx}.svg`,wrap("0 12 64 32","案内役（縁からのぞく）",GUIDE(c))]);
   for(const [k,[l,f]] of Object.entries(POSES)) files.push([`${mode}/poses/pose_${k}${sfx}.svg`,wrap("0 10 120 80",l,f(c))]);
   for(const [k,f] of Object.entries(CAT)) if(!["sit","window","eat"].includes(k)) files.push([`${mode}/room/cat_${k}${sfx}.svg`,wrap("0 10 120 80",`猫（${k}）`,f(c))]);
   files.push([`${mode}/cards/card_energy${sfx}.svg`,wrap("0 0 160 120","カード：元気さ",CARDS.energy(c))]);
   for(const [k,f] of Object.entries(DIARY)) files.push([`${mode}/diary/diary_${k}${sfx}.svg`,wrap("0 0 200 140",`絵日記：${k}`,f(c))]);
   files.push([`${mode}/talk/talk_face${sfx}.svg`,wrap("0 0 80 80","話しかける猫",TALK(c))]);
   for(const [k,f] of Object.entries(PET)) files.push([`${mode}/pet/pet_${k}${sfx}.svg`,wrap("0 12 64 32",`なでたとき（${k}）`,f(c))]);
  }
  FUR="white";
  // 毛色に関係のない部品
  for(const t of ["morning","noon","evening","night"]) files.push([`${mode}/room/window_${t}.svg`,wrap("0 0 360 240",`窓（${t}）`,room.window(c,t))]);
  for(const [k,f] of Object.entries(room.weather)) if(k!=="sunny") files.push([`${mode}/room/weather_${k}.svg`,wrap("0 0 360 240",`天気（${k}）`,f(c))]);
  for(const k of ["floor","bed","bowl_food","bowl_water","toilet_back","toilet_front","shelf","wall_picture"]) files.push([`${mode}/room/${k}.svg`,wrap("0 0 360 240",k,room[k](c))]);
  for(const k of ["food","water","toilet"]) files.push([`${mode}/cards/card_${k}.svg`,wrap("0 0 160 120",`カード：${k}`,CARDS[k](c))]);
  for(const [k,f] of Object.entries(DIARY_PAPER)) files.push([`${mode}/diary/paper_${k}.svg`,wrap("0 -4 200 144",`絵日記の地：${k}`,f(c))]);
  files.push([`${mode}/talk/bubble.svg`,wrap("0 0 200 80","ふきだし",BUBBLE(c))]);
  for(const [k,f] of Object.entries(ITEM)) files.push([`${mode}/diary/item_${k}.svg`,wrap("0 0 24 24",`記録した項目：${k}`,f(c))]);
  for(const [k,[l,f]] of Object.entries(SEASONS)) files.push([`${mode}/seasons/season_${k}.svg`,wrap("0 0 76 60",l,f(c))]);
  for(const [k,[l,f]] of Object.entries(DAY)) files.push([`${mode}/daypart/daypart_${k}.svg`,wrap("0 0 76 48",l,f(c))]);
  for(const [k,[l,vb,f]] of Object.entries(LOGO)) files.push([`${mode}/logo/${k}.svg`,wrap(vb,l,f(c))]);
 }
 for(const [k,[l,f]] of Object.entries(ICON)) files.push([`light/icon/${k}.svg`,wrap("0 0 1024 1024",l,f(PAL.light))]);
 for(const [k,[l,f]] of Object.entries(ICON_DRAFTS)) files.push([`light/icon/${k}.svg`,wrap("0 0 1024 1024",l,f(PAL.light))]);
 for(const [k,[l,f]] of Object.entries(ICON_V2)) files.push([`light/icon/icon_${k}.svg`,wrap("0 0 100 100",l,f(PAL.light))]);
 for(const v of Object.keys(WHISK)) files.push([`light/icon/icon_peek_${v}.svg`,wrap("0 0 100 100",`アイコン B（縁から見上げる・ひげ ${v}）`,peekB(PAL.light,v))]);
 for(const v of ["f1","f2","f3"]) files.push([`light/icon/icon_peek_${v}.svg`,wrap("0 0 100 100",`アイコン B（縁から見上げる・猫らしさ修正 ${v}）`,peekCat(PAL.light,v))]);
 // ロゴ（水平線つき）を B の顔・耳・ひげにそろえた版。ひげは w2s（小さくしてもつぶれにくい）
 for(const mode of ["light","dark"]) files.push([`${mode}/logo/logo_mark_horizon_v2.svg`,wrap("2 30 96 52","ねこと、ゆっくり ロゴマーク（水平線つき・見上げる猫）",peekB(PAL[mode],"w2s",{bg:false}))]);
 for(const [f,x] of FINAL) files.push([`../final/${f}`,x]);
 // pathLength 基準のすきまを、実寸のダッシュに直す（react-native-svg で pathLength に頼らないため）
 for(const f of files){
  f[1]=await p.evaluate(src=>{document.body.innerHTML=src;const s=document.body.firstElementChild;
   s.querySelectorAll('[pathLength]').forEach(el=>{const L=el.getTotalLength();const d=el.getAttribute('stroke-dasharray').split(/\s+/).map(Number).map(v=>+(v*L/100).toFixed(2));el.setAttribute('stroke-dasharray',d.join(' '));el.removeAttribute('pathLength');});
   return s.outerHTML;},f[1]);
  const fp=path.join(OUT,f[0]);fs.mkdirSync(path.dirname(fp),{recursive:true});fs.writeFileSync(fp,f[1]+"\n");
 }
 console.log(files.length,"files");
 await b.close();})();
