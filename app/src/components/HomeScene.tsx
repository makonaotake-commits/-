// ホームの上の小さな絵（F-29）。ペルシャの線画：しぐさ1つ＋季節1つ＋時間帯1つまで、高さ 120 くらいまで。
// 記録の内容や体調とは関係させない（しぐさは日付で順番に）。
// 静かな表示（F-30。設定のスイッチまたは OS の動きを減らす設定）と、お休み中・一覧から外した猫のときは、
// 季節・時間帯・しぐさの切りかえを止めて、静かな絵1枚だけにする。
import React from 'react';
import { View } from 'react-native';
import { Art } from '../art/Art';
import type { ArtName } from '../art/artData';
import { useColors, useQuiet } from '../config/useTheme';
import { useStore } from '../data/store';

const POSES: ArtName[] = ['pose_sit', 'pose_loaf', 'pose_window', 'pose_peek', 'pose_stretch'];

function season(month: number): ArtName {
  if (month >= 3 && month <= 5) return 'season_spring';
  if (month >= 6 && month <= 8) return 'season_summer';
  if (month >= 9 && month <= 11) return 'season_autumn';
  return 'season_winter';
}

function daypart(h: number): ArtName {
  if (h >= 5 && h < 10) return 'daypart_morning';
  if (h >= 10 && h < 17) return 'daypart_noon';
  return 'daypart_night';
}

export function HomeScene({ paused }: { paused?: boolean }) {
  const c = useColors();
  const { data } = useStore();
  const quiet = useQuiet() || !!paused;
  const now = new Date();
  const dayIndex = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
  const pose = quiet ? 'pose_loaf' : POSES[dayIndex % POSES.length];
  const fur = data.settings.guideFur;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: 116, borderRadius: 16, backgroundColor: quiet ? c.surface : c.primaryTint, borderWidth: quiet ? 1 : 0, borderColor: c.border, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden', paddingBottom: 4 }}
    >
      {quiet ? null : (
        <View style={{ position: 'absolute', left: 12, top: 8 }}>
          <Art name={daypart(now.getHours())} width={64} />
        </View>
      )}
      <Art name={pose} width={150} fur={fur} />
      {quiet ? null : (
        <View style={{ position: 'absolute', right: 12, bottom: 8 }}>
          <Art name={season(now.getMonth() + 1)} width={56} />
        </View>
      )}
    </View>
  );
}
