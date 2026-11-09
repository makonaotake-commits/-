import { store } from './store.js';
import { lineChart } from './chart.js';
import {
  ageAt, egfrCreatinine, egfrCystatin, gStage, aStage, riskLevel, dietTargets, bpTarget,
  egfrSlopePerYear, standardWeight, G_STAGES, A_STAGES, G_LABELS, RISK_LABELS,
} from './ckd.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmt = (v, digits = 1) => (v == null ? '—' : Number(v).toLocaleString('ja-JP', { maximumFractionDigits: digits }));
const COLORS = { primary: '#2563eb', accent: '#db2777', green: '#16a34a', orange: '#ea580c' };

// ---------- 検査値の定義 ----------
const LAB_FIELDS = [
  { key: 'cr', label: 'クレアチニン', unit: 'mg/dL', step: '0.01' },
  { key: 'cys', label: 'シスタチンC', unit: 'mg/L', step: '0.01' },
  { key: 'bun', label: '尿素窒素(BUN)', unit: 'mg/dL', step: '0.1', range: [8, 20] },
  { key: 'uacr', label: '尿アルブミン/Cr比', unit: 'mg/gCr', step: '0.1' },
  { key: 'upcr', label: '尿蛋白/Cr比', unit: 'g/gCr', step: '0.01' },
  { key: 'k', label: 'カリウム', unit: 'mEq/L', step: '0.1', range: [3.5, 5.0] },
  { key: 'p', label: 'リン', unit: 'mg/dL', step: '0.1', range: [2.5, 4.5] },
  { key: 'hb', label: 'ヘモグロビン', unit: 'g/dL', step: '0.1', range: [11, 13] },
  { key: 'ua', label: '尿酸', unit: 'mg/dL', step: '0.1', range: [0, 6] },
  { key: 'hba1c', label: 'HbA1c', unit: '%', step: '0.1', range: [0, 7] },
];

const MEAL_FIELDS = [
  { key: 'salt', label: '食塩', unit: 'g', step: '0.1', target: 'saltMax' },
  { key: 'protein', label: 'たんぱく質', unit: 'g', step: '0.1', target: 'protein' },
  { key: 'energy', label: 'エネルギー', unit: 'kcal', step: '1', target: 'energyMax' },
  { key: 'potassium', label: 'カリウム', unit: 'mg', step: '1', target: 'potassium' },
  { key: 'phosphorus', label: 'リン', unit: 'mg', step: '1', target: 'phosphorus' },
  { key: 'water', label: '水分', unit: 'mL', step: '10', target: 'water' },
];
const MEAL_SLOTS = ['朝食', '昼食', '夕食', '間食'];

// ---------- 派生データ ----------
function labWithEgfr(lab, profile) {
  const age = ageAt(profile.birthdate, lab.date);
  const egfr = egfrCreatinine({ cr: num(lab.cr), age, sex: profile.sex });
  const egfrCys = egfrCystatin({ cys: num(lab.cys), age, sex: profile.sex });
  return { ...lab, egfr, egfrCys };
}

function currentStatus(s) {
  const labs = s.labs.map((l) => labWithEgfr(l, s.profile));
  const lastEgfr = [...labs].reverse().find((l) => l.egfr != null || l.egfrCys != null);
  const lastA = [...labs].reverse().find((l) => aStage(l));
  const egfr = lastEgfr ? (lastEgfr.egfr ?? lastEgfr.egfrCys) : null;
  const g = gStage(egfr);
  const a = lastA ? aStage(lastA) : null;
  return { labs, lastEgfr, egfr, g, a, risk: riskLevel(g, a) };
}

function targetsFor(s, g) {
  return dietTargets({ g, heightCm: num(s.profile.height), overrides: s.targets });
}

// ---------- 共通 UI ----------
function heatmap(g, a) {
  const cls = ['risk0', 'risk1', 'risk2', 'risk3'];
  const RT = { G1: [0, 1, 2], G2: [0, 1, 2], G3a: [1, 2, 3], G3b: [2, 3, 3], G4: [3, 3, 3], G5: [3, 3, 3] };
  let html = '<table class="heatmap"><thead><tr><th></th>';
  html += A_STAGES.map((x) => `<th>${x}</th>`).join('') + '</tr></thead><tbody>';
  for (const gg of G_STAGES) {
    html += `<tr><th>${gg}</th>`;
    A_STAGES.forEach((aa, i) => {
      const here = gg === g && aa === a;
      const rowHere = gg === g && !a;
      html += `<td class="${cls[RT[gg][i]]}${here ? ' here' : ''}${rowHere ? ' row-here' : ''}">${here ? '●' : ''}</td>`;
    });
    html += '</tr>';
  }
  return html + '</tbody></table>';
}

function progress(value, max, unit) {
  if (max == null) return `<div class="bar-text">${fmt(value)} ${unit}<span class="muted">（目標未設定）</span></div>`;
  const pct = Math.min((value / max) * 100, 100);
  const over = value > max;
  return `<div class="bar"><div class="fill${over ? ' over' : ''}" style="width:${pct}%"></div></div>
    <div class="bar-text">${fmt(value)} / ${fmt(max)} ${unit}${over ? ' <strong class="warn">超過</strong>' : ''}</div>`;
}

function inputField({ key, label, unit, step = 'any', type = 'number' }, value) {
  return `<label class="field"><span>${label}${unit ? ` <small>(${unit})</small>` : ''}</span>
    <input name="${key}" type="${type}" ${type === 'number' ? `step="${step}" inputmode="decimal"` : ''} value="${esc(value ?? '')}"></label>`;
}

function formData(form) {
  const out = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    out[el.name] = el.type === 'checkbox' ? el.checked : el.value;
  }
  return out;
}

function profileMissing(p) {
  return !p.birthdate || !p.sex;
}

// ---------- 画面: ホーム ----------
function viewHome(s) {
  const st = currentStatus(s);
  const tg = targetsFor(s, st.g);
  const day = today();
  const meals = s.meals.filter((m) => m.date === day);
  const sum = (k) => meals.reduce((a, m) => a + (num(m[k]) || 0), 0);
  const lastVital = [...s.vitals].reverse().find((v) => v.sys);
  const bpT = bpTarget(st.a);
  const egfrPts = st.labs.filter((l) => l.egfr != null).map((l) => ({ date: l.date, value: l.egfr }));
  const slope = egfrSlopePerYear(egfrPts);

  const warn = profileMissing(s.profile)
    ? `<div class="notice">eGFR を計算するには <a href="#settings">設定</a> で生年月日と性別を入力してください。</div>` : '';

  return `${warn}
  <section class="card">
    <h2>現在の腎機能</h2>
    ${st.egfr == null ? '<p class="empty">クレアチニン値を<a href="#labs">検査値</a>から登録すると eGFR とステージを表示します。</p>' : `
    <div class="stat-row">
      <div class="stat"><div class="stat-label">eGFR</div><div class="stat-value">${fmt(st.egfr)}</div><div class="stat-unit">mL/分/1.73m²</div></div>
      <div class="stat"><div class="stat-label">ステージ</div><div class="stat-value">${st.g}${st.a ? st.a : ''}</div><div class="stat-unit">${G_LABELS[st.g]}</div></div>
      <div class="stat"><div class="stat-label">重症度</div><div class="stat-value risk-text rt${st.risk ?? 'x'}">${st.risk != null ? RISK_LABELS[st.risk] : '蛋白尿未登録'}</div><div class="stat-unit">${esc(st.lastEgfr.date)} 時点</div></div>
    </div>
    ${heatmap(st.g, st.a)}
    ${slope != null ? `<p class="${slope <= -5 ? 'warn' : 'muted'}">eGFR の変化: 年 ${slope > 0 ? '+' : ''}${slope}${slope <= -5 ? '（急速な低下の目安 −5 を超えています。主治医に相談しましょう）' : ''}</p>` : ''}
    ${lineChart({ series: [{ label: 'eGFR', color: COLORS.primary, points: egfrPts }], bands: [{ from: 60, to: 200, color: COLORS.green }] })}
    `}
  </section>

  <section class="card">
    <h2>今日の食事 <a class="small-link" href="#meals">記録する →</a></h2>
    ${MEAL_FIELDS.filter((f) => f.key !== 'energy' || tg.energyMax).map((f) => `
      <div class="bar-row"><span class="bar-label">${f.label}</span>${progress(sum(f.key), tg[f.target], f.unit)}</div>`).join('')}
  </section>

  <section class="card">
    <h2>血圧 <a class="small-link" href="#vitals">記録する →</a></h2>
    ${lastVital ? `<p class="big ${(num(lastVital.sys) >= bpT.sys || num(lastVital.dia) >= bpT.dia) ? 'warn' : ''}">${esc(lastVital.sys)} / ${esc(lastVital.dia)} <small>mmHg（${esc(lastVital.date)}）</small></p>` : '<p class="empty">まだ記録がありません</p>'}
    <p class="muted">降圧目標: ${bpT.sys}/${bpT.dia} mmHg 未満${st.a ? '' : '（蛋白尿の検査値を登録すると目標が調整されます）'}</p>
  </section>`;
}

// ---------- 画面: 検査値 ----------
let labChartKey = 'egfr';
function viewLabs(s, editId) {
  const st = currentStatus(s);
  const edit = s.labs.find((l) => l.id === editId) || { date: today() };
  const chartOptions = [{ key: 'egfr', label: 'eGFR', unit: 'mL/分/1.73m²' }, ...LAB_FIELDS];
  const cf = chartOptions.find((f) => f.key === labChartKey) || chartOptions[0];
  const pts = st.labs.map((l) => ({ date: l.date, value: cf.key === 'egfr' ? l.egfr : num(l[cf.key]) }));
  const bands = cf.range ? [{ from: cf.range[0], to: cf.range[1], color: COLORS.green }] : cf.key === 'egfr' ? [{ from: 60, to: 200, color: COLORS.green }] : [];

  return `
  <section class="card">
    <h2>${editId ? '検査値を編集' : '検査値を登録'}</h2>
    <form id="lab-form" class="grid-form">
      <input type="hidden" name="id" value="${esc(edit.id || '')}">
      ${inputField({ key: 'date', label: '検査日', type: 'date' }, edit.date)}
      ${LAB_FIELDS.map((f) => inputField(f, edit[f.key])).join('')}
      <label class="field wide"><span>メモ</span><input name="memo" value="${esc(edit.memo || '')}"></label>
      <div class="actions wide">
        <button type="submit" class="primary">保存</button>
        ${editId ? '<a class="button" href="#labs">キャンセル</a>' : ''}
      </div>
    </form>
    <p class="muted">分かる項目だけ入力すれば大丈夫です。eGFR は生年月日・性別から自動計算します。</p>
  </section>

  <section class="card">
    <h2>推移</h2>
    <select id="lab-chart-select">${chartOptions.map((f) => `<option value="${f.key}" ${f.key === cf.key ? 'selected' : ''}>${f.label}</option>`).join('')}</select>
    ${lineChart({ series: [{ label: cf.label, color: COLORS.primary, points: pts }], bands, unit: ` ${cf.unit}` })}
    ${cf.range ? `<p class="muted">緑の帯: 一般的な目安 ${cf.range[0]}〜${cf.range[1]} ${cf.unit}（施設により異なります）</p>` : ''}
  </section>

  <section class="card">
    <h2>履歴</h2>
    ${st.labs.length === 0 ? '<p class="empty">まだ記録がありません</p>' : `
    <div class="table-wrap"><table class="list">
      <thead><tr><th>日付</th><th>eGFR</th><th>ステージ</th>${LAB_FIELDS.map((f) => `<th>${f.label}</th>`).join('')}<th></th></tr></thead>
      <tbody>${[...st.labs].reverse().map((l) => `<tr>
        <td>${esc(l.date)}</td><td><strong>${fmt(l.egfr ?? l.egfrCys)}</strong></td>
        <td>${gStage(l.egfr ?? l.egfrCys) || ''}${aStage(l) || ''}</td>
        ${LAB_FIELDS.map((f) => `<td>${esc(l[f.key] ?? '')}</td>`).join('')}
        <td class="row-actions"><a href="#labs/${l.id}">編集</a><button data-del="labs" data-id="${l.id}" class="link danger">削除</button></td>
      </tr>`).join('')}</tbody>
    </table></div>`}
  </section>`;
}

// ---------- 画面: 食事 ----------
let mealDate = today();
function viewMeals(s, editId) {
  const st = currentStatus(s);
  const tg = targetsFor(s, st.g);
  const edit = s.meals.find((m) => m.id === editId) || { date: mealDate, slot: '朝食' };
  const day = s.meals.filter((m) => m.date === mealDate);
  const sum = (k) => day.reduce((a, m) => a + (num(m[k]) || 0), 0);
  const names = [...new Map(s.meals.filter((m) => m.name).map((m) => [m.name, m])).values()];

  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ms = s.meals.filter((m) => m.date === ds);
    if (ms.length) last14.push({ date: ds, salt: ms.reduce((a, m) => a + (num(m.salt) || 0), 0), protein: ms.reduce((a, m) => a + (num(m.protein) || 0), 0) });
  }

  return `
  <section class="card">
    <h2>${editId ? '食事を編集' : '食事を記録'}</h2>
    <form id="meal-form" class="grid-form">
      <input type="hidden" name="id" value="${esc(edit.id || '')}">
      ${inputField({ key: 'date', label: '日付', type: 'date' }, edit.date)}
      <label class="field"><span>区分</span><select name="slot">${MEAL_SLOTS.map((x) => `<option ${x === edit.slot ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="field wide"><span>料理・食品名</span><input name="name" list="meal-names" value="${esc(edit.name || '')}" placeholder="例: 減塩みそ汁" autocomplete="off"></label>
      <datalist id="meal-names">${names.map((m) => `<option value="${esc(m.name)}">`).join('')}</datalist>
      ${MEAL_FIELDS.map((f) => inputField(f, edit[f.key])).join('')}
      <div class="actions wide">
        <button type="submit" class="primary">保存</button>
        ${editId ? '<a class="button" href="#meals">キャンセル</a>' : ''}
      </div>
    </form>
    <p class="muted">以前に記録した料理名を選ぶと、栄養量が自動で入ります。</p>
  </section>

  <section class="card">
    <h2>1日の合計 <input type="date" id="meal-date" value="${esc(mealDate)}"></h2>
    ${MEAL_FIELDS.map((f) => `<div class="bar-row"><span class="bar-label">${f.label}</span>${progress(sum(f.key), tg[f.target], f.unit)}</div>`).join('')}
    ${day.length === 0 ? '<p class="empty">この日の記録はありません</p>' : `
    <ul class="entries">${MEAL_SLOTS.flatMap((slot) => day.filter((m) => m.slot === slot).map((m) => `
      <li><span class="tag">${slot}</span><span class="entry-main">${esc(m.name || '(名称なし)')}</span>
        <span class="entry-sub">塩${fmt(num(m.salt))}g・た${fmt(num(m.protein))}g${m.potassium ? `・K${fmt(num(m.potassium), 0)}mg` : ''}</span>
        <span class="row-actions"><a href="#meals/${m.id}">編集</a><button data-del="meals" data-id="${m.id}" class="link danger">削除</button></span></li>`)).join('')}
    </ul>`}
  </section>

  <section class="card">
    <h2>直近14日の推移</h2>
    ${lineChart({ series: [
      { label: '食塩 (g)', color: COLORS.accent, points: last14.map((d) => ({ date: d.date, value: d.salt })) },
    ], bands: [{ from: tg.saltMin ?? 3, to: tg.saltMax ?? 6, color: COLORS.green }], unit: ' g' })}
    ${tg.protein ? lineChart({ series: [
      { label: 'たんぱく質 (g)', color: COLORS.primary, points: last14.map((d) => ({ date: d.date, value: d.protein })) },
    ], bands: [{ from: 0, to: tg.protein, color: COLORS.green }], unit: ' g' }) : ''}
  </section>`;
}

// ---------- 画面: 体調 ----------
function viewVitals(s, editId) {
  const st = currentStatus(s);
  const bpT = bpTarget(st.a);
  const edit = s.vitals.find((v) => v.id === editId) || { date: today(), meds: false, edema: false };
  const pts = (k) => s.vitals.map((v) => ({ date: v.date, value: num(v[k]) }));

  return `
  <section class="card">
    <h2>${editId ? '記録を編集' : '体調を記録'}</h2>
    <form id="vital-form" class="grid-form">
      <input type="hidden" name="id" value="${esc(edit.id || '')}">
      ${inputField({ key: 'date', label: '日付', type: 'date' }, edit.date)}
      ${inputField({ key: 'time', label: '時刻', type: 'time' }, edit.time)}
      ${inputField({ key: 'sys', label: '最高血圧', unit: 'mmHg', step: '1' }, edit.sys)}
      ${inputField({ key: 'dia', label: '最低血圧', unit: 'mmHg', step: '1' }, edit.dia)}
      ${inputField({ key: 'pulse', label: '脈拍', unit: '回/分', step: '1' }, edit.pulse)}
      ${inputField({ key: 'weight', label: '体重', unit: 'kg', step: '0.1' }, edit.weight)}
      ${inputField({ key: 'urine', label: '尿量', unit: 'mL', step: '10' }, edit.urine)}
      <label class="check"><input type="checkbox" name="meds" ${edit.meds ? 'checked' : ''}> 薬を飲んだ</label>
      <label class="check"><input type="checkbox" name="edema" ${edit.edema ? 'checked' : ''}> むくみがある</label>
      <label class="field wide"><span>体調メモ</span><input name="memo" value="${esc(edit.memo || '')}" placeholder="だるさ、かゆみ、食欲など"></label>
      <div class="actions wide">
        <button type="submit" class="primary">保存</button>
        ${editId ? '<a class="button" href="#vitals">キャンセル</a>' : ''}
      </div>
    </form>
  </section>

  <section class="card">
    <h2>血圧の推移</h2>
    ${lineChart({ series: [
      { label: '最高血圧', color: COLORS.accent, points: pts('sys') },
      { label: '最低血圧', color: COLORS.primary, points: pts('dia') },
    ], unit: ' mmHg' })}
    <p class="muted">降圧目標: ${bpT.sys}/${bpT.dia} mmHg 未満</p>
    <h2>体重の推移</h2>
    ${lineChart({ series: [{ label: '体重', color: COLORS.orange, points: pts('weight') }], unit: ' kg', height: 160 })}
  </section>

  <section class="card">
    <h2>履歴</h2>
    ${s.vitals.length === 0 ? '<p class="empty">まだ記録がありません</p>' : `
    <ul class="entries">${[...s.vitals].reverse().slice(0, 60).map((v) => `
      <li><span class="tag">${esc(v.date.slice(5))}${v.time ? ` ${esc(v.time)}` : ''}</span>
        <span class="entry-main ${(num(v.sys) >= bpT.sys || num(v.dia) >= bpT.dia) ? 'warn' : ''}">${v.sys ? `${esc(v.sys)}/${esc(v.dia)}` : '—'}</span>
        <span class="entry-sub">${v.weight ? `${esc(v.weight)}kg ` : ''}${v.meds ? '💊' : ''}${v.edema ? ' むくみ' : ''} ${esc(v.memo || '')}</span>
        <span class="row-actions"><a href="#vitals/${v.id}">編集</a><button data-del="vitals" data-id="${v.id}" class="link danger">削除</button></span></li>`).join('')}
    </ul>`}
  </section>`;
}

// ---------- 画面: 設定 ----------
function viewSettings(s) {
  const p = s.profile;
  const st = currentStatus(s);
  const auto = dietTargets({ g: st.g, heightCm: num(p.height) });
  const sw = standardWeight(num(p.height));
  const tf = [
    { key: 'saltMax', label: '食塩 上限', unit: 'g' },
    { key: 'protein', label: 'たんぱく質 上限', unit: 'g' },
    { key: 'energyMax', label: 'エネルギー 上限', unit: 'kcal' },
    { key: 'potassium', label: 'カリウム 上限', unit: 'mg' },
    { key: 'phosphorus', label: 'リン 上限', unit: 'mg' },
    { key: 'water', label: '水分 上限', unit: 'mL' },
  ];
  return `
  <section class="card">
    <h2>プロフィール</h2>
    <form id="profile-form" class="grid-form">
      ${inputField({ key: 'name', label: 'お名前（任意）', type: 'text' }, p.name)}
      ${inputField({ key: 'birthdate', label: '生年月日', type: 'date' }, p.birthdate)}
      <label class="field"><span>性別（eGFR計算用）</span><select name="sex">
        <option value="">選択してください</option>
        <option value="male" ${p.sex === 'male' ? 'selected' : ''}>男性</option>
        <option value="female" ${p.sex === 'female' ? 'selected' : ''}>女性</option></select></label>
      ${inputField({ key: 'height', label: '身長', unit: 'cm', step: '0.1' }, p.height)}
      <div class="actions wide"><button type="submit" class="primary">保存</button></div>
    </form>
    ${sw ? `<p class="muted">標準体重（BMI 22）: ${sw} kg</p>` : ''}
  </section>

  <section class="card">
    <h2>1日の食事目標</h2>
    <p class="muted">空欄の項目は、現在のステージ${st.g ? `（${st.g}）` : ''}と身長から自動で目安を設定します。主治医・管理栄養士から指示された値があれば入力してください。</p>
    <form id="targets-form" class="grid-form">
      ${tf.map((f) => `<label class="field"><span>${f.label} <small>(${f.unit})</small></span>
        <input name="${f.key}" type="number" step="any" inputmode="decimal" value="${esc(s.targets[f.key] ?? '')}" placeholder="${auto[f.key] ?? '指定なし'}"></label>`).join('')}
      <div class="actions wide"><button type="submit" class="primary">保存</button></div>
    </form>
  </section>

  <section class="card">
    <h2>データの管理</h2>
    <p class="muted">データはこの端末のブラウザ内だけに保存されます。機種変更や受診時の共有には書き出しを使ってください。</p>
    <div class="actions">
      <button id="export-btn">JSONで書き出し</button>
      <button id="csv-btn">検査値をCSVで書き出し</button>
      <label class="button">読み込み<input type="file" id="import-file" accept="application/json" hidden></label>
      <button id="clear-btn" class="danger">すべて削除</button>
    </div>
  </section>`;
}

// ---------- ルーティングと描画 ----------
const ROUTES = { home: viewHome, labs: viewLabs, meals: viewMeals, vitals: viewVitals, settings: viewSettings };

function route() {
  const [name, id] = (location.hash.slice(1) || 'home').split('/');
  return { name: ROUTES[name] ? name : 'home', id };
}

function render() {
  const { name, id } = route();
  const s = store.get();
  $('#view').innerHTML = ROUTES[name](s, id);
  document.querySelectorAll('nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${name}`));
}

function download(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 1800);
}

document.addEventListener('submit', (e) => {
  const form = e.target;
  e.preventDefault();
  const d = formData(form);
  switch (form.getAttribute('id')) {
    case 'lab-form':
      if (!d.date) return toast('検査日を入力してください');
      store.upsert('labs', d);
      toast('検査値を保存しました');
      location.hash = '#labs';
      break;
    case 'meal-form':
      if (!d.date) return toast('日付を入力してください');
      mealDate = d.date;
      store.upsert('meals', d);
      toast('食事を保存しました');
      location.hash = '#meals';
      break;
    case 'vital-form':
      if (!d.date) return toast('日付を入力してください');
      store.upsert('vitals', d);
      toast('記録しました');
      location.hash = '#vitals';
      break;
    case 'profile-form':
      store.setProfile(d);
      toast('プロフィールを保存しました');
      break;
    case 'targets-form':
      store.setTargets(Object.fromEntries(Object.entries(d).filter(([, v]) => v !== '')));
      toast('目標を保存しました');
      break;
  }
});

document.addEventListener('click', (e) => {
  const del = e.target.closest('[data-del]');
  if (del) {
    if (confirm('この記録を削除しますか？')) store.remove(del.dataset.del, del.dataset.id);
    return;
  }
  const s = store.get();
  if (e.target.id === 'export-btn') download(`ckd-care-${today()}.json`, store.exportJson(), 'application/json');
  if (e.target.id === 'csv-btn') {
    const head = ['日付', 'eGFR', ...LAB_FIELDS.map((f) => `${f.label}(${f.unit})`), 'メモ'];
    const rows = s.labs.map((l) => labWithEgfr(l, s.profile)).map((l) => [l.date, l.egfr ?? '', ...LAB_FIELDS.map((f) => l[f.key] ?? ''), l.memo ?? '']);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    download(`ckd-labs-${today()}.csv`, '﻿' + csv, 'text/csv');
  }
  if (e.target.id === 'clear-btn' && confirm('すべてのデータを削除します。元に戻せません。よろしいですか？')) {
    store.clear();
    toast('削除しました');
  }
});

document.addEventListener('change', async (e) => {
  if (e.target.id === 'lab-chart-select') { labChartKey = e.target.value; render(); }
  if (e.target.id === 'meal-date') { mealDate = e.target.value || today(); render(); }
  if (e.target.id === 'import-file' && e.target.files[0]) {
    try {
      store.importJson(await e.target.files[0].text());
      toast('読み込みました');
    } catch (err) {
      alert(`読み込みに失敗しました: ${err.message}`);
    }
  }
  // 料理名を選んだら過去の栄養量を自動入力
  if (e.target.name === 'name' && e.target.form?.getAttribute('id') === 'meal-form') {
    const prev = [...store.get().meals].reverse().find((m) => m.name === e.target.value);
    if (prev) MEAL_FIELDS.forEach((f) => { const el = e.target.form.elements[f.key]; if (el && !el.value) el.value = prev[f.key] ?? ''; });
  }
});

window.addEventListener('hashchange', render);
store.subscribe(render);
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
