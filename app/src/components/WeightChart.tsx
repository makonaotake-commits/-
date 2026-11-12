import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { colors } from '../config/theme';
import { WEIGHT_AXIS_MIN_HALF_RANGE_KG } from '../config/vetValues';
import { shortDate } from '../data/store';
import { T } from './ui';

type Pt = { date: string; kg: number; copied?: boolean };

/** 体重だけの折れ線グラフ。基準線・目標線・色分け・コメントは付けない（F-12） */
export function WeightChart({ points, from, to }: { points: Pt[]; from: string; to: string }) {
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<Pt>();
  const h = 220;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 36;

  if (points.length === 0) return <T sub>この期間の体重の記録はありません。</T>;

  const kgs = points.map((p) => p.kg);
  const mid = (Math.max(...kgs) + Math.min(...kgs)) / 2;
  const half = Math.max(WEIGHT_AXIS_MIN_HALF_RANGE_KG, (Math.max(...kgs) - Math.min(...kgs)) / 2 * 1.15);
  const yMin = mid - half;
  const yMax = mid + half;
  const t0 = new Date(from + 'T00:00:00').getTime();
  const t1 = Math.max(new Date(to + 'T00:00:00').getTime(), t0 + 86400000);
  const x = (d: string) => padL + ((new Date(d + 'T00:00:00').getTime() - t0) / (t1 - t0)) * (w - padL - padR);
  const y = (kg: number) => padT + (1 - (kg - yMin) / (yMax - yMin)) * (h - padT - padB);
  const ticks = [yMin, mid, yMax];
  // 当たり判定は、隣の日と重ならない幅にする（最大 40px）
  const dayPx = (w - padL - padR) / Math.max(1, (t1 - t0) / 86400000);
  const hit = Math.max(20, Math.min(40, dayPx));

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <T small sub style={{ marginBottom: 4 }}>
        {sel ? `${shortDate(sel.date)}　${sel.kg.toFixed(2)} kg${sel.copied ? '（コピー）' : ''}` : '点を押すと、その日の値が出ます。'}
      </T>
      {w > 0 ? (
        <View style={{ width: w, height: h }}>
          <Svg width={w} height={h}>
            {/* 縦軸の目盛りの数字だけ。横線（基準線に見えるもの）は引かない */}
            {ticks.map((t, i) => (
              <SvgText key={i} x={padL - 8} y={y(t) + 5} fontSize={13} fill={colors.textSub} textAnchor="end">
                {t.toFixed(2)}
              </SvgText>
            ))}
            <Line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke={colors.border} strokeWidth={1} />
            <Line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke={colors.border} strokeWidth={1} />
            <SvgText x={padL} y={h - 10} fontSize={13} fill={colors.textSub} textAnchor="start">
              {shortDate(from)}
            </SvgText>
            <SvgText x={w - padR} y={h - 10} fontSize={13} fill={colors.textSub} textAnchor="end">
              {shortDate(to)}
            </SvgText>
            {points.length > 1 ? (
              <Polyline points={points.map((p) => `${x(p.date)},${y(p.kg)}`).join(' ')} fill="none" stroke={colors.chartLine} strokeWidth={2} strokeLinejoin="round" />
            ) : null}
            {points.map((p) => (
              <Circle
                key={p.date}
                cx={x(p.date)}
                cy={y(p.kg)}
                r={sel?.date === p.date ? 7 : 5}
                fill={p.copied ? colors.surface : colors.chartLine}
                stroke={colors.chartLine}
                strokeWidth={2}
              />
            ))}
          </Svg>
          {/* 押しやすいように、点より大きい当たり判定を重ねる */}
          {points.map((p) => (
            <Pressable
              key={'hit' + p.date}
              accessibilityLabel={`${shortDate(p.date)} ${p.kg.toFixed(2)} kg`}
              onPress={() => setSel(p)}
              style={{ position: 'absolute', left: x(p.date) - hit / 2, top: y(p.kg) - 20, width: hit, height: 40 }}
            />
          ))}
        </View>
      ) : null}
      <T small sub>
        縦軸：kg（幅は最小 ±{WEIGHT_AXIS_MIN_HALF_RANGE_KG} kg）。白抜きの点は「前回と同じ」で入れた値です。
      </T>
    </View>
  );
}
