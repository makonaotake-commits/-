// 記録したときの小さなしぐさ（F-29）：しっぽを1回ゆらし、目を細める。合計 1.6 秒以内・1回だけ・音なし。
// 何を記録しても同じ反応。静かな表示（F-30・OS の動きを減らす設定）や、お休み中・一覧から外した猫のときは呼ばない。
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { FurColor } from '../data/store';
import { GuideCat, GuideTail } from './Marks';

export function RecordReaction({ fur, size = 56 }: { fur: FurColor; size?: number }) {
  const swing = useRef(new Animated.Value(0)).current;
  const [squint, setSquint] = useState(true);
  useEffect(() => {
    Animated.sequence([
      Animated.timing(swing, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: -1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setSquint(false), 1400);
    return () => clearTimeout(t);
  }, [swing]);
  const rotate = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <GuideCat fur={fur} size={size} noTail squint={squint} />
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, transform: [{ rotate }], transformOrigin: '75% 75%' }}>
        <GuideTail size={size} />
      </Animated.View>
    </View>
  );
}
