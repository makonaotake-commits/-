// 線画の部品（docs/brand/assets/svg/ のラフをもとにした仮のもの）。色はすべてトークンで渡す。
import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useColors } from '../config/useTheme';
import { FurColor } from '../data/store';

/** 記録のお知らせ（F-27）の目印：しおり形。赤・黄・感嘆符・ベル・点滅・数字は使わない。動かさない */
export function NoticeMark({ size = 24 }: { size?: number }) {
  const c = useColors();
  return (
    <Svg width={(size * 20) / 24} height={size} viewBox="0 0 20 24" accessibilityLabel="記録のお知らせ">
      <Path d="M4 2 H16 V22 L10 17 L4 22 Z" fill="none" stroke={c.mark} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

/** 記録した日の葉っぱ（カレンダーの中だけで使う。数えない・ためない・1種類だけ） */
export function CalendarLeaf() {
  const c = useColors();
  return (
    <Svg width={22} height={14} viewBox="0 0 22 14" accessibilityLabel="記録した日">
      <Path d="M1 7 C6 0 15 0 20 7 C14 11 6 11 1 7 Z" fill={c.accentTint} stroke={c.text} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M3 7 C8 6 13 6 18 5" fill="none" stroke={c.text} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

export const FUR_OPTIONS: { v: FurColor; label: string }[] = [
  { v: 'white', label: 'しろ' },
  { v: 'tabby', label: 'キジトラ' },
  { v: 'black', label: 'くろ' },
  { v: 'calico', label: '三毛' },
  { v: 'brown', label: '茶' },
  { v: 'gray', label: 'グレー' },
];

/** 案内役の猫（ラフ）。毛色は brand_guide.md §5 の描き分けを仮に再現 */
export function GuideCat({ fur = 'white', size = 64, noTail, squint }: { fur?: FurColor; size?: number; noTail?: boolean; squint?: boolean }) {
  const c = useColors();
  const face = fur === 'black' ? c.text : fur === 'brown' ? c.primaryTint : fur === 'gray' ? c.border : c.surface;
  const eye = fur === 'black' ? c.surface : c.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="案内役の猫">
      {noTail ? null : <Path d="M48 48 A10 10 0 0 0 58 38" fill="none" stroke={c.text} strokeWidth={2} strokeLinecap="round" />}
      <Path d="M17 24 L16 7 L29 15 Z" fill={face} stroke={c.text} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M35 15 L48 7 L47 24 Z" fill={face} stroke={c.text} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={32} cy={33} r={18} fill={face} stroke={c.text} strokeWidth={2} />
      {fur === 'tabby' ? (
        <>
          <Path d="M28 17 L28 22" stroke={c.text} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M32 16 L32 22" stroke={c.text} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M36 17 L36 22" stroke={c.text} strokeWidth={1.6} strokeLinecap="round" />
        </>
      ) : null}
      {fur === 'calico' ? (
        <>
          <Ellipse cx={24} cy={24} rx={5} ry={4} fill={c.primaryTint} />
          <Ellipse cx={41} cy={26} rx={4} ry={3.5} fill={c.border} />
        </>
      ) : null}
      {squint ? (
        <>
          <Path d="M23.5 32.5 Q26 30.5 28.5 32.5" fill="none" stroke={eye} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M35.5 32.5 Q38 30.5 40.5 32.5" fill="none" stroke={eye} strokeWidth={1.6} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={26} cy={32} r={2} fill={eye} />
          <Circle cx={38} cy={32} r={2} fill={eye} />
        </>
      )}
      <Circle cx={32} cy={38} r={1.8} fill={c.primary} />
    </Svg>
  );
}

/** しっぽだけ（記録したときの反応で、しっぽを1回ゆらすために分けて描く） */
export function GuideTail({ size = 64 }: { size?: number }) {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M48 48 A10 10 0 0 0 58 38" fill="none" stroke={c.text} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
