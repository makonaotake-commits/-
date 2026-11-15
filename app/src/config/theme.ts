// 見た目の設定
import { Platform } from 'react-native';

// 出典：docs/brand/ui_style_guide.md v1.0（ペルシャ、2026-11-15）。値を変えるときは、このファイルだけを直せば全画面に反映されます。

export const lightColors = {
  background: '#FBF5EA',
  surface: '#FFFDF8',
  text: '#4D3F33',
  textSub: '#6F5E4A',
  border: '#E6D7C0',
  borderStrong: '#9A8468',
  primary: '#87602F',
  onPrimary: '#FFFFFF',
  primaryTint: '#F3E3C8',
  accent: '#8FB5A8', // 飾りの線だけ（文字には使わない）
  accentTint: '#E2EDE8',
  chartLine: '#4D3F33',
  focus: '#4D3F33',
  mark: '#4D3F33', // 記録のお知らせの目印（しおり形）
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  background: '#1F1A14',
  surface: '#2A231B',
  text: '#F3E8D8',
  textSub: '#C2B19A',
  border: '#43382B',
  borderStrong: '#8E7B62',
  primary: '#E2B87F',
  onPrimary: '#1F1A14',
  primaryTint: '#3E3222',
  accent: '#9CC3B5',
  accentTint: '#263530',
  chartLine: '#F3E8D8',
  focus: '#F3E8D8',
  mark: '#F3E8D8',
};

// フォントはアプリに同梱（OFL 1.1）。iPhone・Android は useFonts で、Web 版はビルド時に埋め込みます。
// 太字が効かない端末があるため、太さごとに別のフォント名で指定します。
// Web 版の見出しフォントは画面の文字だけに絞っているので、ない字は本文のフォントで表示する
const fallback = ", 'BIZUDPGothic_400Regular', 'Hiragino Sans', 'Yu Gothic', sans-serif";
const web = Platform.OS === 'web';
export const fonts = {
  heading: web ? 'ZenMaruGothic_700Bold' + fallback : 'ZenMaruGothic_700Bold',
  headingMedium: web ? 'ZenMaruGothic_500Medium' + fallback : 'ZenMaruGothic_500Medium',
  body: web ? 'BIZUDPGothic_400Regular' + fallback : 'BIZUDPGothic_400Regular',
  bodyBold: web ? 'BIZUDPGothic_700Bold' + fallback : 'BIZUDPGothic_700Bold',
};

export const sizes = {
  title: 24,
  heading: 20,
  body: 18,
  label: 17,
  small: 15, // これより小さくしない
  number: 28,
  gap: 16,
  screenPadding: 20,
  cardPadding: 20,
  radius: 16,
  radiusSmall: 12,
  touch: 56, // 押せるものの最小の高さ
};

export type Sizes = typeof sizes;

/** 文字サイズ（F-11）の倍率。押せるものの高さも一緒に少し大きくする */
export const TEXT_SCALE = { normal: 1, large: 1.15, xlarge: 1.3 } as const;

export function scaleSizes(f: number): Sizes {
  const r = (n: number) => Math.round(n * f);
  return {
    ...sizes,
    title: r(sizes.title),
    heading: r(sizes.heading),
    body: r(sizes.body),
    label: r(sizes.label),
    small: r(sizes.small),
    number: r(sizes.number),
    touch: Math.max(sizes.touch, r(sizes.touch * (0.5 + f / 2))),
  };
}
