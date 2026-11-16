// 記録のお知らせの目印と文言（F-27）。しおり形・本文と同じ色・動かさない。値・増減・評価語は入れない。
import React from 'react';
import { View } from 'react-native';
import { hitItems, noticeText } from '../data/notices';
import { ConditionRecord, useStore } from '../data/store';
import { NoticeMark } from './Marks';
import { T } from './ui';

export function NoticeLine({ record }: { record: ConditionRecord }) {
  const { data } = useStore();
  const items = hitItems(data.notices, data.cats, record);
  const cat = data.cats.find((c) => c.id === record.catId);
  if (items.length === 0 || !cat) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
      <NoticeMark size={20} />
      <T small style={{ flex: 1 }}>
        {noticeText(cat.name, items)}
      </T>
    </View>
  );
}
