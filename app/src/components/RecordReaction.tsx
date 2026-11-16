// 記録したときの小さなしぐさ（F-29）：案内役（guide_peek）のしっぽを1回ゆらし、目を細める。1.6 秒以内・1回だけ・音なし。
// 動かすのは #tail と #head だけ（brand_guide.md §5-4）。何を記録しても同じ反応。
// 静かな表示や、お休み中・一覧から外した猫のときは呼ばない（文字だけ）。
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Art, artSize } from '../art/Art';
import type { FurColor } from '../data/store';

export function RecordReaction({ fur, width = 64 }: { fur: FurColor; width?: number }) {
  const swing = useRef(new Animated.Value(0)).current;
  const [squint, setSquint] = useState(true);
  const { height, viewBox } = artSize('guide_peek', width);
  // しっぽの付け根（素材の座標 44,39）を回転の中心にする
  const ox = ((44 - viewBox[0]) / viewBox[2]) * 100;
  const oy = ((39 - viewBox[1]) / viewBox[3]) * 100;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(swing, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: -1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(swing, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setSquint(false), 1400);
    return () => clearTimeout(t);
  }, [swing]);
  const rotate = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '16deg'] });
  return (
    <View style={{ width, height }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Art name="guide_peek" width={width} fur={fur} squint={squint} part="noTail" />
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width, height, transform: [{ rotate }], transformOrigin: `${ox}% ${oy}%` }}>
        <Art name="guide_peek" width={width} part="tailOnly" />
      </Animated.View>
    </View>
  );
}
