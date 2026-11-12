// 見た目の設定（仮）
// ペルシャのスタイルガイドが届いたら、このファイルの値だけを差し替えれば、全画面に反映されます。
import { Platform } from 'react-native';

export const colors = {
  background: '#FAF6F0', // 生成り
  surface: '#FFFFFF',
  text: '#4A4038', // 焦げ茶
  textSub: '#6E6259',
  border: '#DDD3C7',
  sage: '#8FB5A8', // セージ（選択中の印など。文字色には使わない）
  sageTint: '#E3EEEA',
  peach: '#E8B4A0', // 淡いピーチ（飾り。警告の意味では使わない）
  peachTint: '#F8E8E0',
  chartLine: '#4A4038', // グラフの線は中立の色
};

// Web 版では Google Fonts を読み込みます（App.tsx）。iPhone・Android 版は次の段階で同梱します。
const webHeading = "'Zen Maru Gothic', 'BIZ UDPGothic', sans-serif";
const webBody = "'BIZ UDPGothic', 'Zen Maru Gothic', sans-serif";

export const fonts = {
  heading: Platform.select({ web: webHeading, default: undefined }),
  body: Platform.select({ web: webBody, default: undefined }),
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Zen+Maru+Gothic:wght@500;700&display=swap',
};

export const sizes = {
  body: 18,
  small: 15,
  label: 17,
  title: 24,
  heading: 20,
  touch: 56, // 押せる大きさの最小値（片手で押しやすい高さ）
  radius: 16,
  gap: 16,
};
