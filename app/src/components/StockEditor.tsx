// 手元の残り（F-32・任意）。飼い主さんが入れたときだけ使う。数の候補・初期値は出さない。購入・注文への導線は作らない。
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Stock } from '../data/store';
import { Button, Field, Input, T } from './ui';

const num = (t: string) => {
  const s = t.normalize('NFKC').trim();
  const v = Number(s);
  return s && isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : undefined;
};

export function StockEditor({ value, onChange, unitPlaceholder }: { value?: Stock; onChange: (s?: Stock) => void; unitPlaceholder: string }) {
  const [open, setOpen] = useState(!!value);
  const [remaining, setRemaining] = useState(value ? String(value.remaining) : '');
  const [perUse, setPerUse] = useState(value ? String(value.perUse) : '');
  const [unit, setUnit] = useState(value?.unit ?? '');
  const [below, setBelow] = useState(value?.notifyBelow !== undefined ? String(value.notifyBelow) : '');

  const r = num(remaining);
  const p = num(perUse);
  const b = num(below);
  const ready = r !== undefined && p !== undefined && p > 0 && !!unit.trim();

  if (!open) {
    return (
      <Field label="手元の残り（任意）" hint="入れておくと、記録するたびに残りを減らして、目安として表示します。">
        <Button kind="secondary" label="手元の残りを入れる" onPress={() => setOpen(true)} />
      </Field>
    );
  }
  return (
    <Field label="手元の残り（任意）" hint="目安です。実際の数と違ってきたら、いつでも直せます。">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <T>いまの残り</T>
        <Input value={remaining} onChangeText={setRemaining} keyboardType="decimal-pad" style={{ width: 100 }} accessibilityLabel="いまの残り" />
        <Input value={unit} onChangeText={setUnit} placeholder={unitPlaceholder} style={{ width: 100 }} accessibilityLabel="単位" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <T>1回に使う数</T>
        <Input value={perUse} onChangeText={setPerUse} keyboardType="decimal-pad" style={{ width: 100 }} accessibilityLabel="1回に使う数" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <T>お知らせする残り（任意）</T>
        <Input value={below} onChangeText={setBelow} keyboardType="decimal-pad" style={{ width: 100 }} accessibilityLabel="お知らせする残り" />
        <T small sub>を下回ったとき</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <Button
          kind="secondary"
          label="残りを保存する"
          disabled={!ready}
          style={{ flex: 1 }}
          onPress={() => ready && onChange({ remaining: r!, perUse: p!, unit: unit.trim(), notifyBelow: b, notified: false })}
        />
        <Button
          kind="secondary"
          label="使わない"
          style={{ flex: 1 }}
          onPress={() => {
            onChange(undefined);
            setOpen(false);
            setRemaining('');
            setPerUse('');
            setUnit('');
            setBelow('');
          }}
        />
      </View>
    </Field>
  );
}
