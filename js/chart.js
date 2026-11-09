// 依存ライブラリなしの簡易折れ線グラフ（SVG）
// series: [{label, color, points:[{date, value}]}]
// bands: [{from, to, color}] 背景の帯（基準範囲など）
export function lineChart({ series, bands = [], unit = '', height = 200 }) {
  const all = series.flatMap((s) => s.points.filter((p) => p.value != null && !Number.isNaN(p.value)));
  if (all.length === 0) return '<p class="empty">データがまだありません</p>';

  const W = 600;
  const H = height;
  const pad = { l: 44, r: 12, t: 12, b: 28 };
  const t = (d) => new Date(d).getTime();
  let x0 = Math.min(...all.map((p) => t(p.date)));
  let x1 = Math.max(...all.map((p) => t(p.date)));
  if (x0 === x1) { x0 -= 86400000; x1 += 86400000; }
  const dataVals = all.map((p) => p.value);
  const dMin = Math.min(...dataVals);
  const dMax = Math.max(...dataVals);
  // 帯の境界はデータの近くにある場合だけ表示範囲に含める（遠い境界でグラフが潰れないように）
  const near = (e) => Number.isFinite(e) && e <= dMax * 1.5 + 1 && e >= dMin * 0.5 - 1;
  const vals = dataVals.concat(bands.flatMap((b) => [b.from, b.to]).filter(near));
  let y0 = Math.min(...vals);
  let y1 = Math.max(...vals);
  const span = y1 - y0 || Math.abs(y1) || 1;
  y0 -= span * 0.1;
  y1 += span * 0.1;

  const sx = (d) => pad.l + ((t(d) - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const sy = (v) => pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  const fmtDate = (ms) => { const d = new Date(ms); return `${d.getMonth() + 1}/${d.getDate()}`; };
  const fmtNum = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10);

  const ticks = 4;
  let grid = '';
  for (let i = 0; i <= ticks; i++) {
    const v = y0 + ((y1 - y0) * i) / ticks;
    const y = sy(v);
    grid += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" class="grid"/>`;
    grid += `<text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" class="axis">${fmtNum(v)}</text>`;
  }
  const xt = [x0, (x0 + x1) / 2, x1];
  grid += xt.map((ms, i) => `<text x="${sx(ms)}" y="${H - 8}" text-anchor="${['start', 'middle', 'end'][i]}" class="axis">${fmtDate(ms)}</text>`).join('');

  const bandSvg = bands.map((b) => {
    const ya = sy(Math.min(Math.max(b.to, y0), y1));
    const yb = sy(Math.max(Math.min(b.from, y1), y0));
    return `<rect x="${pad.l}" width="${W - pad.l - pad.r}" y="${ya}" height="${Math.max(yb - ya, 0)}" fill="${b.color}" opacity="0.15"/>`;
  }).join('');

  const lines = series.map((s) => {
    const pts = s.points.filter((p) => p.value != null && !Number.isNaN(p.value));
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.date).toFixed(1)},${sy(p.value).toFixed(1)}`).join(' ');
    const dots = pts.map((p) => `<circle cx="${sx(p.date).toFixed(1)}" cy="${sy(p.value).toFixed(1)}" r="3.5" fill="${s.color}"><title>${p.date}: ${p.value}${unit}</title></circle>`).join('');
    return `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/>${dots}`;
  }).join('');

  const legend = series.length > 1
    ? `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div>`
    : '';

  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${bandSvg}${grid}${lines}</svg>${legend}`;
}
