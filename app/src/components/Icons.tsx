// 線画のアイコン（ブランドの線画に合わせた丸い線・1.8 相当）。色はトークンから。
// 文字を減らすための目印。意味を伝えるため、画面では短い言葉（1〜2語）を下に添える。
import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { useColors } from '../config/useTheme';

export type IconName =
  | 'condition' // 体調（猫の顔）
  | 'fluid' // 補液（点滴の袋）
  | 'med' // お薬（カプセル）
  | 'home'
  | 'review' // 振り返り（カレンダー）
  | 'report' // レポート（書類）
  | 'settings' // 設定（つまみ）
  | 'visit' // 通院（病院の建物）
  | 'bowl' // 食欲
  | 'drop' // 飲水
  | 'energy' // 元気さ（猫のしっぽ）
  | 'pee' // おしっこ
  | 'poop' // うんち
  | 'vomit' // 吐いた
  | 'scale' // 体重
  | 'memo' // メモ
  | 'check'
  | 'plus'
  | 'paw';

export function Icon({ name, size = 28, color, fill }: { name: IconName; size?: number; color?: string; fill?: string }) {
  const c = useColors();
  const k = color ?? c.text;
  const f = fill ?? 'none';
  const p = { stroke: k, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  let body: React.ReactNode;
  switch (name) {
    case 'condition':
      body = (
        <>
          <Path d="M5 11 L5 4 L10 8 M19 11 L19 4 L14 8" {...p} />
          <Ellipse cx={12} cy={14} rx={8} ry={7} {...p} fill={f} />
          <Circle cx={9} cy={13.5} r={1} fill={k} />
          <Circle cx={15} cy={13.5} r={1} fill={k} />
          <Path d="M11 17 Q12 18 13 17" {...p} />
        </>
      );
      break;
    case 'fluid':
      body = (
        <>
          <Path d="M7 3 H17 V13 Q17 16 12 16 Q7 16 7 13 Z" {...p} fill={f} />
          <Line x1={9.5} y1={7} x2={14.5} y2={7} {...p} />
          <Path d="M12 16 V19 M12 19 Q12 21 15 21 H18" {...p} />
        </>
      );
      break;
    case 'med':
      body = (
        <>
          <Rect x={3} y={8.5} width={18} height={7} rx={3.5} transform="rotate(-35 12 12)" {...p} fill={f} />
          <Line x1={9.4} y1={8.3} x2={14.6} y2={15.7} {...p} />
        </>
      );
      break;
    case 'home':
      body = <Path d="M4 11 L12 4 L20 11 V20 H4 Z M10 20 V14 H14 V20" {...p} fill={f} />;
      break;
    case 'review':
      body = (
        <>
          <Rect x={4} y={5} width={16} height={15} rx={2} {...p} fill={f} />
          <Path d="M4 10 H20 M8 3 V7 M16 3 V7" {...p} />
          <Path d="M8 14.5 Q10 12.5 12 14.5 Q10 16.5 8 14.5 Z" {...p} />
        </>
      );
      break;
    case 'report':
      body = (
        <>
          <Path d="M6 3 H14 L18 7 V21 H6 Z M14 3 V7 H18" {...p} fill={f} />
          <Path d="M9 16 L11 13 L13 14.5 L15 11" {...p} />
        </>
      );
      break;
    case 'settings':
      body = (
        <>
          <Path d="M4 7 H20 M4 17 H20" {...p} />
          <Circle cx={9} cy={7} r={2.2} {...p} fill={c.surface} />
          <Circle cx={15} cy={17} r={2.2} {...p} fill={c.surface} />
        </>
      );
      break;
    case 'visit':
      body = (
        <>
          <Path d="M4 20 V9 L12 4 L20 9 V20 Z" {...p} fill={f} />
          <Path d="M12 10 V16 M9 13 H15" {...p} />
        </>
      );
      break;
    case 'bowl':
      body = <Path d="M3 11 H21 Q20 19 12 19 Q4 19 3 11 Z M8 21 H16" {...p} fill={f} />;
      break;
    case 'drop':
      body = <Path d="M12 3 Q18 11 18 14.5 A6 6 0 0 1 6 14.5 Q6 11 12 3 Z" {...p} fill={f} />;
      break;
    case 'energy':
      body = <Path d="M6 20 Q4 12 10 10 Q16 8 15 4 M15 4 Q19 6 18 10" {...p} />;
      break;
    case 'pee':
      body = (
        <>
          <Rect x={3} y={11} width={18} height={8} rx={2} {...p} fill={f} />
          <Path d="M12 3 Q15 7 15 8.5 A3 3 0 0 1 9 8.5 Q9 7 12 3 Z" {...p} />
        </>
      );
      break;
    case 'poop':
      body = (
        <>
          <Rect x={3} y={11} width={18} height={8} rx={2} {...p} fill={f} />
          <Path d="M8 9 Q8 6 12 6 Q16 6 16 9 Z" {...p} />
        </>
      );
      break;
    case 'vomit':
      body = (
        <>
          <Ellipse cx={12} cy={17} rx={8} ry={3} {...p} fill={f} />
          <Path d="M12 3 V11 M9 8 L12 11 L15 8" {...p} />
        </>
      );
      break;
    case 'scale':
      body = (
        <>
          <Rect x={3} y={6} width={18} height={14} rx={3} {...p} fill={f} />
          <Path d="M8 11 A4 4 0 0 1 16 11 M12 11 L14 9" {...p} />
        </>
      );
      break;
    case 'memo':
      body = <Path d="M5 4 H19 V15 L14 20 H5 Z M14 20 V15 H19 M8 9 H16 M8 12 H13" {...p} fill={f} />;
      break;
    case 'check':
      body = <Path d="M5 12.5 L10 17 L19 7" {...p} strokeWidth={2.4} />;
      break;
    case 'plus':
      body = <Path d="M12 5 V19 M5 12 H19" {...p} strokeWidth={2.2} />;
      break;
    case 'paw':
      body = (
        <>
          <Ellipse cx={12} cy={16} rx={4.5} ry={3.8} {...p} fill={f} />
          <Circle cx={6.5} cy={10.5} r={1.8} {...p} />
          <Circle cx={10} cy={7} r={1.8} {...p} />
          <Circle cx={14} cy={7} r={1.8} {...p} />
          <Circle cx={17.5} cy={10.5} r={1.8} {...p} />
        </>
      );
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}

/** 量の絵（食欲＝器の中身、飲水＝しずくの大きさ）。良し悪しの色は付けず、量だけを形で見せる */
export function AmountPicture({ kind, level, size = 40, color }: { kind: 'bowl' | 'drop'; level: 0 | 1 | 2 | 3; size?: number; color?: string }) {
  const c = useColors();
  const k = color ?? c.text;
  const p = { stroke: k, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 'bowl') {
    // 0=空っぽ 1=少し 2=いつもくらい 3=山盛り（中身の量だけを形で見せる）
    const fills = ['', 'M6.5 18 Q12 15.5 17.5 18 Q16 20 12 20 Q8 20 6.5 18 Z', 'M3.6 14.5 Q12 12.5 20.4 14.5 Q19.5 20 12 20 Q4.5 20 3.6 14.5 Z', 'M3 12 Q12 4.5 21 12 Q20 20 12 20 Q4 20 3 12 Z'];
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {level > 0 ? <Path d={fills[level]} fill={c.textSub} opacity={0.55} stroke="none" /> : null}
        {level === 3 ? <Path d="M3 12 Q12 4.5 21 12" {...p} fill="none" /> : null}
        <Path d="M3 12 H21 Q20 20 12 20 Q4 20 3 12 Z" {...p} fill="none" />
      </Svg>
    );
  }
  const r = [0, 0.55, 0.78, 1][level] || 0.55;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={`M12 ${12 - 9 * r} Q${12 + 6 * r} ${12 - 1 * r} ${12 + 6 * r} ${14.5 - 2.5 * (1 - r)} A${6 * r} ${6 * r} 0 0 1 ${12 - 6 * r} ${14.5 - 2.5 * (1 - r)} Q${12 - 6 * r} ${12 - 1 * r} 12 ${12 - 9 * r} Z`} {...p} fill={c.accentTint} />
    </Svg>
  );
}
