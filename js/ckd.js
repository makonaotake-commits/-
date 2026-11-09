// CKD 関連の計算ロジック（DOM に依存しない純粋関数）
// 参考: 日本腎臓学会「エビデンスに基づくCKD診療ガイドライン」、
//       「慢性腎臓病に対する食事療法基準 2014年版」、KDIGO 2012

const round1 = (v) => Math.round(v * 10) / 10;

/** 満年齢を計算する */
export function ageAt(birthdate, onDate = new Date()) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  const d = new Date(onDate);
  if (Number.isNaN(b.getTime()) || Number.isNaN(d.getTime())) return null;
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return age;
}

/**
 * 日本人向け eGFRcreat（mL/分/1.73m²）
 * eGFR = 194 × Cr^-1.094 × 年齢^-0.287（女性は ×0.739）
 */
export function egfrCreatinine({ cr, age, sex }) {
  if (!(cr > 0) || !(age >= 18)) return null;
  let v = 194 * Math.pow(cr, -1.094) * Math.pow(age, -0.287);
  if (sex === 'female') v *= 0.739;
  return round1(v);
}

/**
 * 日本人向け eGFRcys（mL/分/1.73m²）
 * 男性: 104 × Cys^-1.019 × 0.996^年齢 − 8
 * 女性: 104 × Cys^-1.019 × 0.996^年齢 × 0.929 − 8
 */
export function egfrCystatin({ cys, age, sex }) {
  if (!(cys > 0) || !(age >= 18)) return null;
  let v = 104 * Math.pow(cys, -1.019) * Math.pow(0.996, age);
  if (sex === 'female') v *= 0.929;
  return round1(Math.max(v - 8, 0));
}

export const G_STAGES = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'];
export const A_STAGES = ['A1', 'A2', 'A3'];

/** GFR 区分 */
export function gStage(egfr) {
  if (egfr == null || Number.isNaN(egfr)) return null;
  if (egfr >= 90) return 'G1';
  if (egfr >= 60) return 'G2';
  if (egfr >= 45) return 'G3a';
  if (egfr >= 30) return 'G3b';
  if (egfr >= 15) return 'G4';
  return 'G5';
}

export const G_LABELS = {
  G1: '正常または高値',
  G2: '正常または軽度低下',
  G3a: '軽度〜中等度低下',
  G3b: '中等度〜高度低下',
  G4: '高度低下',
  G5: '末期腎不全',
};

/**
 * 蛋白尿区分
 * uacr: 尿アルブミン/Cr 比（mg/gCr）を優先、なければ upcr: 尿蛋白/Cr 比（g/gCr）
 */
export function aStage({ uacr, upcr } = {}) {
  if (uacr != null && uacr !== '' && !Number.isNaN(Number(uacr))) {
    const v = Number(uacr);
    if (v < 30) return 'A1';
    if (v < 300) return 'A2';
    return 'A3';
  }
  if (upcr != null && upcr !== '' && !Number.isNaN(Number(upcr))) {
    const v = Number(upcr);
    if (v < 0.15) return 'A1';
    if (v < 0.5) return 'A2';
    return 'A3';
  }
  return null;
}

// 重症度（ヒートマップ）: 0=緑 1=黄 2=オレンジ 3=赤
const RISK_TABLE = {
  G1: [0, 1, 2],
  G2: [0, 1, 2],
  G3a: [1, 2, 3],
  G3b: [2, 3, 3],
  G4: [3, 3, 3],
  G5: [3, 3, 3],
};
export const RISK_LABELS = ['低リスク', '中等度リスク', '高リスク', '超高リスク'];

export function riskLevel(g, a) {
  if (!g || !a || !RISK_TABLE[g]) return null;
  return RISK_TABLE[g][A_STAGES.indexOf(a)] ?? null;
}

/** 標準体重（BMI 22） */
export function standardWeight(heightCm) {
  if (!(heightCm > 0)) return null;
  const m = heightCm / 100;
  return round1(m * m * 22);
}

/**
 * ステージ別の 1日あたり食事目標（食事療法基準 2014 に基づく目安）
 * 実際の目標は主治医・管理栄養士の指示を優先するため、overrides で上書きできる。
 */
export function dietTargets({ g, heightCm, overrides = {} } = {}) {
  const sw = standardWeight(heightCm);
  const t = {
    saltMax: 6, // g（3g以上6g未満）
    saltMin: 3,
    protein: null, // g（上限）
    potassium: null, // mg（上限）
    energyMin: sw ? Math.round(sw * 25) : null,
    energyMax: sw ? Math.round(sw * 35) : null,
    water: null, // mL（通常は制限なし）
    phosphorus: null, // mg（上限）
  };
  if (sw) {
    if (g === 'G3a') t.protein = round1(sw * 1.0);
    else if (g === 'G3b' || g === 'G4' || g === 'G5') t.protein = round1(sw * 0.8);
  }
  if (g === 'G3b') t.potassium = 2000;
  else if (g === 'G4' || g === 'G5') t.potassium = 1500;

  for (const [k, v] of Object.entries(overrides || {})) {
    if (v !== '' && v != null && !Number.isNaN(Number(v))) t[k] = Number(v);
  }
  return t;
}

/** 降圧目標（CKD診療ガイドライン：蛋白尿あり 130/80 未満、なし 140/90 未満） */
export function bpTarget(a) {
  if (a === 'A2' || a === 'A3') return { sys: 130, dia: 80 };
  return { sys: 140, dia: 90 };
}

/**
 * eGFR の年間変化量（最小二乗法）。2点以上・期間 90 日以上が必要。
 * points: [{date, value}]
 */
export function egfrSlopePerYear(points) {
  const pts = points
    .filter((p) => p.value != null && !Number.isNaN(p.value))
    .map((p) => ({ x: new Date(p.date).getTime() / (365.25 * 24 * 3600 * 1000), y: p.value }))
    .filter((p) => !Number.isNaN(p.x));
  if (pts.length < 2) return null;
  const xs = pts.map((p) => p.x);
  if (Math.max(...xs) - Math.min(...xs) < 90 / 365.25) return null;
  const n = pts.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pts) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  if (den === 0) return null;
  return round1(num / den);
}
