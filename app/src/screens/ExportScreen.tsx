// データの書き出し（F-09）：CSV。ブラウザの試作では、文字をコピーして表計算ソフトに貼り付ける形。
// iPhone・Android 版では、共有シートから保存・送信できる。どちらも外部に自動で送ることはしない。
import React, { useState } from 'react';
import { Platform, Share, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Button, Card, Choice, Field, Note, T } from '../components/ui';
import { APPETITE, ENERGY, FLUID_STATE, labelOf, MED_RESULT, STOOL_STATE, URINE_CLUMP, WATER } from '../config/labels';
import { fonts } from '../config/theme';
import { useColors, useSizes } from '../config/useTheme';
import { Data, useStore } from '../data/store';

const q = (v: unknown) => {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cols: unknown[]) => cols.map(q).join(',');

export function buildCsv(data: Data, kind: 'condition' | 'fluid' | 'med', catId: string | 'all') {
  const catName = (id: string) => data.cats.find((c) => c.id === id)?.name ?? '';
  const pick = <T extends { catId: string }>(xs: T[]) => xs.filter((x) => catId === 'all' || x.catId === catId);
  if (kind === 'condition') {
    const head = ['猫', '日付', '時刻', '食欲', '飲水', '飲水(mL)', '尿(回)', '尿の塊', '嘔吐(回)', '便(回)', '便の状態', '元気さ', '体重(kg)', '前回からコピーした項目', 'メモ'];
    const body = pick(data.conditions)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map((c) =>
        row([catName(c.catId), c.date, c.time, labelOf(APPETITE, c.appetite), labelOf(WATER, c.water), c.waterMl, c.urineCount, labelOf(URINE_CLUMP, c.urineClump), c.vomitCount, c.stoolCount, labelOf(STOOL_STATE, c.stoolState), labelOf(ENERGY, c.energy), c.weightKg?.toFixed(2), (c.copiedFields ?? []).join(' '), c.memo]),
      );
    return [row(head), ...body].join('\n');
  }
  if (kind === 'fluid') {
    const head = ['猫', '日付', '時刻', '量(mL)', '輸液の名前', '部位', '左右', '様子', 'メモ'];
    const body = pick(data.fluids)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .map((f) => row([catName(f.catId), f.date, f.time, f.ml, f.fluidName, f.site, f.side, labelOf(FLUID_STATE, f.state), f.memo]));
    return [row(head), ...body].join('\n');
  }
  const head = ['猫', '日付', '時刻', 'お薬', '記録の種類', '結果', 'メモ'];
  const body = pick(data.medRecords)
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
    .map((m) => row([catName(m.catId), m.date, m.time, m.medName, m.kind === 'hospital' ? '病院での処置' : '自宅', labelOf(MED_RESULT, m.result), m.memo]));
  return [row(head), ...body].join('\n');
}

export function ExportScreen({ back }: { back: () => void }) {
  const { data } = useStore();
  const c = useColors();
  const z = useSizes();
  const [catId, setCatId] = useState<string>('all');
  const [kind, setKind] = useState<'condition' | 'fluid' | 'med'>('condition');
  const [copied, setCopied] = useState<string>();
  const csv = buildCsv(data, kind, catId);
  const lines = csv.split('\n').length - 1;

  const copy = async () => {
    try {
      if (Platform.OS === 'web') {
        await (globalThis as unknown as { navigator: { clipboard: { writeText: (s: string) => Promise<void> } } }).navigator.clipboard.writeText(csv);
        setCopied('コピーしました。表計算ソフトに貼り付けられます。');
      } else {
        await Share.share({ message: csv });
        setCopied(undefined);
      }
    } catch {
      setCopied('コピーできませんでした。下の枠の文字を長押し（または選択）してコピーしてください。');
    }
  };

  return (
    <Screen title="記録の書き出し（CSV）" onBack={back}>
      <Card>
        <Field label="猫">
          <Choice options={[{ v: 'all', label: 'すべての猫' }, ...data.cats.map((x) => ({ v: x.id, label: x.name + (x.archived ? '（一覧から外した猫）' : '') }))]} value={catId} onChange={(v) => v && setCatId(v)} />
        </Field>
        <Field label="記録の種類">
          <Choice
            options={[
              { v: 'condition', label: '体調' },
              { v: 'fluid', label: '補液' },
              { v: 'med', label: 'お薬' },
            ]}
            value={kind}
            onChange={(v) => v && setKind(v)}
          />
        </Field>
        <T small sub>{lines}件の記録</T>
        <Button label={Platform.OS === 'web' ? 'CSV の文字をコピーする' : 'CSV を共有・保存する'} onPress={copy} />
        {copied ? <T small>{copied}</T> : null}
      </Card>
      <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, backgroundColor: c.surface, maxHeight: 320, overflow: 'hidden' }}>
        <Text selectable style={{ fontFamily: fonts.body, fontSize: z.small, color: c.text }}>
          {csv}
        </Text>
      </View>
      <Note>書き出した記録は、この端末の外に出ます。共有する相手と保存場所に気をつけてください。機種変更のときの引き継ぎ方法は、まだ決まっていません。</Note>
    </Screen>
  );
}
