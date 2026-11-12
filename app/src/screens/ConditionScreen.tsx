import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { DateStepper, Screen } from '../components/Screen';
import { Button, Card, CatBadge, Choice, Counter, Field, Input, Note, T, useCurrentCat } from '../components/ui';
import { APPETITE, ENERGY, STOOL_STATE, TEXT, URINE_CLUMP, WATER } from '../config/labels';
import { ConditionRecord, newId, nowParts, shortDate, useStore } from '../data/store';

const COPY_FIELDS = ['appetite', 'water', 'waterMl', 'urineCount', 'urineClump', 'vomitCount', 'stoolCount', 'stoolState', 'energy', 'weightKg'] as const;
type CopyField = (typeof COPY_FIELDS)[number];

function parseWeight(t: string): number | undefined {
  const n = Number(t.normalize('NFKC').replace(/[^\d.]/g, ''));
  if (!t.trim() || !isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100) / 100;
}

export function ConditionScreen({ back }: { back: (msg?: string) => void }) {
  const { data, update } = useStore();
  const cat = useCurrentCat();
  const today = nowParts().date;
  const [date, setDate] = useState(today);

  const existing = data.conditions.find((c) => c.catId === cat?.id && c.date === date);
  const [rec, setRec] = useState<Partial<ConditionRecord>>(existing ?? {});
  const [weightText, setWeightText] = useState(existing?.weightKg !== undefined ? existing.weightKg.toFixed(2) : '');
  const [loadedFor, setLoadedFor] = useState(date);

  // 日付を変えたら、その日の記録を読み込む
  if (loadedFor !== date) {
    const ex = data.conditions.find((c) => c.catId === cat?.id && c.date === date);
    setRec(ex ?? {});
    setWeightText(ex?.weightKg !== undefined ? ex.weightKg.toFixed(2) : '');
    setLoadedFor(date);
  }

  const prev = useMemo(
    () => data.conditions.filter((c) => c.catId === cat?.id && c.date < date).sort((a, b) => (a.date < b.date ? 1 : -1))[0],
    [data.conditions, cat?.id, date],
  );
  const prevWeight = useMemo(
    () => data.conditions.filter((c) => c.catId === cat?.id && c.date < date && c.weightKg !== undefined).sort((a, b) => (a.date < b.date ? 1 : -1))[0],
    [data.conditions, cat?.id, date],
  );

  const copied = new Set(rec.copiedFields ?? []);
  const set = <K extends CopyField>(k: K, v: ConditionRecord[K] | undefined) => {
    const cf = (rec.copiedFields ?? []).filter((f) => f !== k);
    setRec({ ...rec, [k]: v, copiedFields: cf });
  };

  const copyPrev = () => {
    if (!prev) return;
    const next: Partial<ConditionRecord> = { ...rec };
    const cf: string[] = [];
    COPY_FIELDS.forEach((f) => {
      if (prev[f] !== undefined) {
        (next as Record<string, unknown>)[f] = prev[f];
        cf.push(f);
      }
    });
    next.copiedFields = cf;
    setRec(next);
    setWeightText(prev.weightKg !== undefined ? prev.weightKg.toFixed(2) : '');
  };

  const weight = parseWeight(weightText);
  const hasAny = COPY_FIELDS.some((f) => (f === 'weightKg' ? weight !== undefined : rec[f] !== undefined)) || !!rec.memo?.trim();

  const save = () => {
    if (!cat || !hasAny) return;
    const t = nowParts().time;
    const r: ConditionRecord = {
      ...(rec as ConditionRecord),
      id: existing?.id ?? newId(),
      catId: cat.id,
      date,
      time: existing?.time ?? t,
      weightKg: weight,
      memo: rec.memo?.trim() || undefined,
      copiedFields: (rec.copiedFields ?? []).filter((f) => (f === 'weightKg' ? weight !== undefined && weight === prev?.weightKg : true)),
    };
    update((x) => ({ ...x, conditions: [...x.conditions.filter((c) => c.id !== r.id), r] }));
    back('体調の記録を保存しました');
  };

  return (
    <Screen title="体調を記録する" onBack={() => back()}>
      <CatBadge cat={cat} />
      <DateStepper date={date} onChange={setDate} max={today} />
      <T small sub style={{ marginVertical: 8 }}>
        {existing ? 'この日の記録を開いています。直して保存できます。' : '1つの項目だけでも保存できます。'}
      </T>
      {prev ? (
        <Button kind="secondary" label={`前回（${shortDate(prev.date)}）と同じ内容を入れる`} onPress={copyPrev} />
      ) : null}
      {copied.size > 0 ? <T small sub>「（コピー）」の付いた項目は、前回の内容をそのまま入れたものです。選び直すと印は消えます。</T> : null}

      <Card style={{ marginTop: 12 }}>
        <Field label="食欲">
          <Choice options={APPETITE} value={rec.appetite} onChange={(v) => set('appetite', v)} copied={copied.has('appetite')} />
        </Field>
        <Field label="飲水">
          <Choice options={WATER} value={rec.water} onChange={(v) => set('water', v)} copied={copied.has('water')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <Input
              value={rec.waterMl !== undefined ? String(rec.waterMl) : ''}
              onChangeText={(t) => {
                const n = Number(t.normalize('NFKC').replace(/[^\d]/g, ''));
                set('waterMl', t.trim() && isFinite(n) ? n : undefined);
              }}
              keyboardType="number-pad"
              placeholder="量（任意）"
              style={{ width: 160 }}
            />
            <T>mL{copied.has('waterMl') ? '（コピー）' : ''}</T>
          </View>
        </Field>
        <Field label={`尿の回数${copied.has('urineCount') ? '（コピー）' : ''}`}>
          <Counter value={rec.urineCount} onChange={(v) => set('urineCount', v)} />
          <T small sub style={{ marginTop: 4 }}>塊の大きさ（任意）</T>
          <Choice options={URINE_CLUMP} value={rec.urineClump} onChange={(v) => set('urineClump', v)} copied={copied.has('urineClump')} />
        </Field>
        <Field label={`嘔吐の回数${copied.has('vomitCount') ? '（コピー）' : ''}`}>
          <Counter value={rec.vomitCount} onChange={(v) => set('vomitCount', v)} />
        </Field>
        <Field label={`便の回数${copied.has('stoolCount') ? '（コピー）' : ''}`}>
          <Counter value={rec.stoolCount} onChange={(v) => set('stoolCount', v)} />
          <T small sub style={{ marginTop: 4 }}>状態（任意）</T>
          <Choice options={STOOL_STATE} value={rec.stoolState} onChange={(v) => set('stoolState', v)} copied={copied.has('stoolState')} />
        </Field>
        <Field label="元気さ">
          <Choice options={ENERGY} value={rec.energy} onChange={(v) => set('energy', v)} copied={copied.has('energy')} />
        </Field>
        <Field label={`体重${copied.has('weightKg') ? '（コピー）' : ''}`} hint={prevWeight ? `前回 ${prevWeight.weightKg!.toFixed(2)} kg（${shortDate(prevWeight.date)}）` : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Input
              value={weightText}
              onChangeText={(t) => {
                setWeightText(t);
                setRec({ ...rec, copiedFields: (rec.copiedFields ?? []).filter((f) => f !== 'weightKg') });
              }}
              keyboardType="decimal-pad"
              placeholder="例：3.45"
              style={{ width: 160 }}
            />
            <T>kg</T>
          </View>
          {prevWeight ? (
            <Button
              kind="quiet"
              label="前回と同じ体重を入れる"
              style={{ alignSelf: 'flex-start' }}
              onPress={() => {
                setWeightText(prevWeight.weightKg!.toFixed(2));
                setRec({ ...rec, copiedFields: [...(rec.copiedFields ?? []).filter((f) => f !== 'weightKg'), 'weightKg'] });
              }}
            />
          ) : null}
        </Field>
        <Field label="メモ">
          <Input value={rec.memo ?? ''} onChangeText={(t) => setRec({ ...rec, memo: t })} multiline placeholder="気づいたこと、先生に聞きたいことなど" />
        </Field>
      </Card>

      <Button label="保存する" onPress={save} disabled={!hasAny} />
      {!hasAny ? <T small sub>どれか1つ入力すると保存できます。</T> : null}
      <Note>{TEXT.emergency}</Note>
    </Screen>
  );
}
