// ホームの上の小さな絵（演出の仮の入れ物）。線画・ロゴがラフのため、試作では切りかえの仕組みと置き場所だけ。
// 記録の内容や体調とは関係させない。「演出を控えめにする」がオンのときは、静かな絵（日だまりだけ）にする。
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '../config/useTheme';
import { useStore } from '../data/store';
import { GuideCat } from './Marks';
import { T } from './ui';

const SEASONS = ['冬（ちらつく雪）', '冬（ちらつく雪）', '春（若葉）', '春（若葉）', '春（若葉）', '夏（風鈴）', '夏（風鈴）', '夏（風鈴）', '秋（色づいた葉・どんぐり）', '秋（色づいた葉・どんぐり）', '秋（色づいた葉・どんぐり）', '冬（ちらつく雪）'];
const POSES = ['すわる', '香箱', '窓の外を見る'];

function timeOfDay(h: number) {
  if (h >= 5 && h < 10) return '朝';
  if (h >= 10 && h < 17) return '昼';
  return '夜';
}

export function HomeScene() {
  const c = useColors();
  const { data } = useStore();
  const calm = data.settings.calmMotion;
  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / 86400000);
  const label = calm ? '静かな絵（日だまりだけ）' : `${SEASONS[now.getMonth()]}・${timeOfDay(now.getHours())}・${POSES[dayIndex % POSES.length]}`;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: 112, borderRadius: 16, backgroundColor: c.primaryTint, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 8, overflow: 'hidden' }}
    >
      <Svg width={40} height={40} style={{ position: 'absolute', right: 16, top: 12 }}>
        <Circle cx={20} cy={20} r={12} fill={c.primary} opacity={0.5} />
      </Svg>
      <GuideCat fur={data.settings.guideFur} size={72} />
      <View style={{ flex: 1, marginLeft: 12, marginBottom: 6 }}>
        <T small sub>演出の仮の入れ物</T>
        <T small sub>{label}</T>
      </View>
    </View>
  );
}
