const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body>'+require('fs').readFileSync(__dirname+'/../dist/experience.html','utf8')+'</body></html>');
const cases=[
['お水はいつもより多い。',{water:'more'}],['お水はいつもくらい。',{water:'usual'}],['お水は多め。',{water:'more'}],['お水はいつもより少なめ。',{water:'less'}],
['ごはんはいつもより多い。',{appetite:'more'}],['ごはんはいつもどおり。',{appetite:'usual'}],['ごはんは食べなかった。',{appetite:'none'}],
['まだ食べてない。',{}],['ごはんはまだ食べてない。',{}],['ごはんは食べてない。',{}],['お水は少なくない。',{}],['お水は多くない。',{}],['ごはんは多くなかった。',{}],
['ごはんは少し残した。',{}],['おかわりした。',{}],['たくさん食べた。',{}],['ぐったりしている。',{}],
['ごはんはいつもより少なめ。お水はいつもくらい。おしっこ2回、うんち1回。',{appetite:'less',water:'usual',pee:2,poop:1}],
['おしっこ三回。',{pee:3}],['おしっこはまだ。',{}],
];
let ok=0; for (const [t,exp] of cases){ const r=await p.evaluate((t)=>parseSpeech(t),t); const good=JSON.stringify(r)===JSON.stringify(exp); if(good)ok++; else console.log('NG',t,JSON.stringify(r),'expected',JSON.stringify(exp)); }
console.log(ok+'/'+cases.length); await b.close();})();
