// 獣医師に見せるレポート（F-07）の PDF 用 HTML。端末の中で作り、外部には送らない。
// 画面のレポートと同じルール：評価・要約・増減・矢印・色分けは入れない。「—（記録なし）」と「0」を区別し、
// 合計には「記録のある日数」を並べる。コピーした記録には ※ を付けて凡例で示す。体重グラフに基準線は引かない。
import { APPETITE, ENERGY, FLUID_STATE, labelOf, MED_RESULT, STOOL_STATE, TEXT, URINE_CLUMP, WATER } from '../config/labels';
import { WEIGHT_AXIS_MIN_HALF_RANGE_KG } from '../config/vetValues';
import type { Cat, ConditionRecord, Data } from '../data/store';

const NR = TEXT.noRecord;
const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

function days(from: string, to: string) {
  const out: string[] = [];
  const d = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const p = (n: number) => (n < 10 ? '0' + n : String(n));
  while (d <= end) {
    out.push(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function weightSvg(points: { date: string; kg: number; copied?: boolean }[], from: string, to: string) {
  if (points.length === 0) return `<p>${NR}（この期間の体重の記録はありません）</p>`;
  const w = 640;
  const h = 220;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const kgs = points.map((p) => p.kg);
  const mid = (Math.max(...kgs) + Math.min(...kgs)) / 2;
  const half = Math.max(WEIGHT_AXIS_MIN_HALF_RANGE_KG, ((Math.max(...kgs) - Math.min(...kgs)) / 2) * 1.15);
  const t0 = new Date(from + 'T00:00:00').getTime();
  const t1 = Math.max(new Date(to + 'T00:00:00').getTime(), t0 + 86400000);
  const x = (d: string) => padL + ((new Date(d + 'T00:00:00').getTime() - t0) / (t1 - t0)) * (w - padL - padR);
  const y = (kg: number) => padT + (1 - (kg - (mid - half)) / (2 * half)) * (h - padT - padB);
  const ticks = [mid - half, mid, mid + half]
    .map((t) => `<text x="${padL - 8}" y="${y(t) + 4}" text-anchor="end" class="tick">${t.toFixed(2)}</text>`)
    .join('');
  const line = points.length > 1 ? `<polyline points="${points.map((p) => `${x(p.date)},${y(p.kg)}`).join(' ')}" fill="none" stroke="#4D3F33" stroke-width="2"/>` : '';
  const dots = points.map((p) => `<circle cx="${x(p.date)}" cy="${y(p.kg)}" r="4" fill="${p.copied ? '#FFFFFF' : '#4D3F33'}" stroke="#4D3F33" stroke-width="2"/>`).join('');
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    ${ticks}
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="#E6D7C0"/>
    <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="#E6D7C0"/>
    <text x="${padL}" y="${h - 10}" class="tick">${md(from)}</text>
    <text x="${w - padR}" y="${h - 10}" text-anchor="end" class="tick">${md(to)}</text>
    ${line}${dots}
  </svg>
  <p class="small">縦軸：kg（幅は最小 ±${WEIGHT_AXIS_MIN_HALF_RANGE_KG} kg）。白抜きの点は「前回と同じ」で入れた値です。</p>`;
}

export function buildReportHtml(data: Data, cat: Cat, from: string, to: string, createdAt = new Date()) {
  const ds = days(from, to);
  const inRange = (d: string) => d >= from && d <= to;
  const allConds = data.conditions.filter((c) => c.catId === cat.id);
  const conds = ds.map((d) => allConds.find((c) => c.date === d));
  const fluids = data.fluids.filter((f) => f.catId === cat.id && inRange(f.date)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const medRecs = data.medRecords.filter((m) => m.catId === cat.id && inRange(m.date));
  const homeRecs = medRecs.filter((m) => m.kind !== 'hospital');
  const hospRecs = medRecs.filter((m) => m.kind === 'hospital').sort((a, b) => a.date.localeCompare(b.date));
  const medNames = Array.from(new Set(homeRecs.map((m) => m.medName)));

  const mark = (c: ConditionRecord | undefined, k: string, text?: string) => (text === undefined ? NR : esc(text) + (c?.copiedFields?.includes(k) ? ' ※' : ''));
  const count = (c: ConditionRecord | undefined, k: 'urineCount' | 'vomitCount' | 'stoolCount', extra?: string) =>
    c?.[k] === undefined ? NR : mark(c, k, `${c[k]}回${extra ? `（${extra}）` : ''}`);
  const sum = (k: 'urineCount' | 'vomitCount' | 'stoolCount') => {
    const v = conds.map((c) => c?.[k]).filter((x): x is number => x !== undefined);
    return v.length === 0 ? `${NR}（記録のある日数 0/${ds.length}日）` : `合計 ${v.reduce((a, b) => a + b, 0)}回（記録のある日数 ${v.length}/${ds.length}日）`;
  };
  const hasCopy = conds.some((c) => c?.copiedFields?.length);

  const mlChanges: { date: string; ml: number }[] = [];
  let last: number | undefined;
  data.fluids
    .filter((f) => f.catId === cat.id && f.ml !== undefined && f.date <= to)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .forEach((f) => {
      if (f.ml !== last) {
        if (inRange(f.date)) mlChanges.push({ date: f.date, ml: f.ml! });
        last = f.ml;
      }
    });

  const weights = conds.filter((c): c is ConditionRecord => !!c && c.weightKg !== undefined).map((c) => ({ date: c.date, kg: c.weightKg!, copied: c.copiedFields?.includes('weightKg') }));
  const memos = [
    ...conds.filter((c): c is ConditionRecord => !!c?.memo).map((c) => ({ date: c.date, text: `体調：${c.memo}` })),
    ...fluids.filter((f) => f.memo).map((f) => ({ date: f.date, text: `補液：${f.memo}` })),
    ...medRecs.filter((m) => m.memo).map((m) => ({ date: m.date, text: `${m.medName}：${m.memo}` })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const rows = ds
    .map((d, i) => {
      const c = conds[i];
      const water = c?.water || c?.waterMl !== undefined ? `${mark(c, 'water', labelOf(WATER, c?.water) ?? '')}${c?.waterMl !== undefined ? ` ${c.waterMl}mL` : ''}` : NR;
      return `<tr><td>${md(d)}</td><td>${mark(c, 'appetite', labelOf(APPETITE, c?.appetite))}</td><td>${water}</td><td>${count(c, 'urineCount', labelOf(URINE_CLUMP, c?.urineClump))}</td><td>${count(c, 'vomitCount')}</td><td>${count(c, 'stoolCount', labelOf(STOOL_STATE, c?.stoolState))}</td><td>${mark(c, 'energy', labelOf(ENERGY, c?.energy))}</td><td>${c?.weightKg !== undefined ? mark(c, 'weightKg', `${c.weightKg.toFixed(2)} kg`) : NR}</td></tr>`;
    })
    .join('');

  const created = `${createdAt.getFullYear()}年${createdAt.getMonth() + 1}月${createdAt.getDate()}日`;
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>${esc(cat.name)}ちゃんの記録</title>
<style>
  @page { margin: 14mm; }
  body { font-family: 'BIZ UDPGothic', 'Hiragino Sans', 'Yu Gothic', sans-serif; color: #4D3F33; font-size: 11pt; line-height: 1.5; }
  h1 { font-size: 18pt; margin: 0 0 4px; } h2 { font-size: 13pt; margin: 18px 0 6px; border-bottom: 1px solid #E6D7C0; padding-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; } th, td { border: 1px solid #E6D7C0; padding: 3px 4px; text-align: left; vertical-align: top; }
  th { background: #F3E3C8; } tr { page-break-inside: avoid; }
  .small { font-size: 9pt; color: #6F5E4A; } .tick { font-size: 11px; fill: #6F5E4A; } .keep { break-inside: avoid; page-break-inside: avoid; } h2 { break-after: avoid; page-break-after: avoid; } .note { border: 1px solid #E6D7C0; padding: 8px; }
</style></head><body>
<h1>${esc(cat.name)}ちゃんの記録</h1>
<p>期間：${md(from)}〜${md(to)}（${ds.length}日間）　作成日：${created}</p>
<p class="note small">${esc(TEXT.reportCover)}${hasCopy ? '<br>※ は「前回と同じ」で前回の内容を入れ、直さずに保存した項目です。' : ''}</p>

<h2>体調の一覧</h2>
<p class="small">体調を記録した日：${conds.filter(Boolean).length}/${ds.length}日</p>
<table><thead><tr><th>日付</th><th>食べた量</th><th>飲水</th><th>尿</th><th>嘔吐</th><th>便</th><th>元気さ</th><th>体重</th></tr></thead><tbody>${rows}</tbody></table>
<p class="small">${esc(TEXT.reportRelativeNote)}</p>
<p>尿：${sum('urineCount')}<br>嘔吐：${sum('vomitCount')}<br>便：${sum('stoolCount')}</p>
<p class="small">「${NR}」は記録がないこと、「0回」は 0回と記録したことを表します。</p>

<div class="keep"><h2>体重の推移</h2>
${weightSvg(weights, from, to)}</div>

<h2>皮下輸液の記録</h2>
<p class="small">記録のある日数：${new Set(fluids.map((f) => f.date)).size}/${ds.length}日</p>
${fluids.length === 0 ? `<p>${NR}（この期間の記録はありません）</p>` : `<table><thead><tr><th>日時</th><th>量</th><th>輸液の名前</th><th>部位</th><th>様子</th></tr></thead><tbody>${fluids
    .map((f) => `<tr><td>${md(f.date)} ${esc(f.time)}</td><td>${f.ml !== undefined ? `${f.ml} mL` : NR}</td><td>${esc(f.fluidName ?? NR)}</td><td>${f.site ? esc(f.site + (f.side ? '・' + f.side : '')) : NR}</td><td>${esc(labelOf(FLUID_STATE, f.state) ?? NR)}</td></tr>`)
    .join('')}</tbody></table>`}
${mlChanges.length ? `<p><b>量の変更の履歴</b><br>${mlChanges.map((c) => `${md(c.date)} から ${c.ml} mL`).join('<br>')}</p>` : ''}

<h2>投薬の記録（自宅で与えたもの）</h2>
${medNames.length === 0 ? `<p>${NR}（この期間の記録はありません）</p>` : medNames
    .map((n) => {
      const rs = homeRecs.filter((r) => r.medName === n);
      return `<p><b>${esc(n)}</b><br>${MED_RESULT.map((o) => `${o.label} ${rs.filter((r) => r.result === o.v).length}回`).join('／')}<br><span class="small">記録のある日数 ${new Set(rs.map((r) => r.date)).size}/${ds.length}日</span></p>`;
    })
    .join('')}

<h2>病院での処置</h2>
${hospRecs.length === 0 ? `<p>${NR}（この期間の記録はありません）</p>` : `<p>${hospRecs.map((r) => `${md(r.date)}　${esc(r.medName)}`).join('<br>')}</p>`}

<h2>メモ</h2>
${memos.length === 0 ? `<p>${NR}（この期間のメモはありません）</p>` : `<p>${memos.map((m) => `${md(m.date)}　${esc(m.text)}`).join('<br>')}</p>`}

<h2>先生に聞きたいこと</h2>
<p style="min-height:60px;border:1px solid #E6D7C0"></p>
<p class="small">${esc(TEXT.vetFirst)}</p>
</body></html>`;
}
