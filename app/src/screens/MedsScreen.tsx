import React, { useState } from 'react';
import { View } from 'react-native';
import { ConfirmBox, DateStepper, Screen } from '../components/Screen';
import { Button, Card, CatBadge, H, Input, Note, T, useCurrentCat } from '../components/ui';
import { labelOf, MED_RESULT, TEXT } from '../config/labels';
import { MedRecord, MedResult, Medication, newId, nowParts, shortDate, useStore } from '../data/store';
import type { Route } from '../../App';

function slotOf(time: string) {
  const h = Number(time.slice(0, 2));
  if (h >= 4 && h < 11) return '朝';
  if (h >= 11 && h < 16) return '昼';
  if (h >= 16 && h < 21) return '夕方';
  return '夜';
}
const slotWord: Record<string, string> = { 朝: '今朝', 昼: '今日の昼', 夕方: '今日の夕方', 夜: '今夜' };

export function MedsScreen({ back, go }: { back: (msg?: string) => void; go: (r: Route) => void }) {
  const { data, update } = useStore();
  const cat = useCurrentCat();
  const homeMeds = data.meds.filter((m) => m.catId === cat?.id && m.kind !== 'hospital');
  const hospitalMeds = data.meds.filter((m) => m.catId === cat?.id && m.kind === 'hospital');
  const [pending, setPending] = useState<{ med: Medication; result: MedResult; existing: MedRecord }>();
  const [memo, setMemo] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string>();
  const today = nowParts().date;
  const [hospDate, setHospDate] = useState<Record<string, string>>({});

  const record = (med: Medication, result: MedResult) => {
    if (!cat) return;
    const { date, time } = nowParts();
    const r: MedRecord = { id: newId(), catId: cat.id, medId: med.id, medName: med.name, date, time, kind: 'home', result, memo: memo[med.id]?.trim() || undefined };
    update((x) => ({ ...x, medRecords: [...x.medRecords, r] }));
    setMemo({ ...memo, [med.id]: '' });
    setPending(undefined);
    setMsg(`${med.name}：${time} に「${labelOf(MED_RESULT, result)}」と記録しました`);
  };

  const recordHospital = (med: Medication) => {
    if (!cat) return;
    const date = hospDate[med.id] ?? today;
    const r: MedRecord = { id: newId(), catId: cat.id, medId: med.id, medName: med.name, date, kind: 'hospital', memo: memo[med.id]?.trim() || undefined };
    update((x) => ({ ...x, medRecords: [...x.medRecords, r] }));
    setMemo({ ...memo, [med.id]: '' });
    setMsg(`${med.name}：${shortDate(date)} の病院での処置を記録しました`);
  };

  const tap = (med: Medication, result: MedResult) => {
    const { date, time } = nowParts();
    const existing = data.medRecords
      .filter((r) => r.medId === med.id && r.date === date && r.result === 'ok' && r.time && slotOf(r.time) === slotOf(time))
      .sort((a, b) => ((a.time ?? '') < (b.time ?? '') ? 1 : -1))[0];
    if (existing) return setPending({ med, result, existing });
    record(med, result);
  };

  return (
    <Screen title="お薬を記録する" onBack={() => back()}>
      <CatBadge cat={cat} />
      {msg ? <Note>{msg}</Note> : null}
      <H>自宅で与えたお薬</H>
      {homeMeds.length === 0 ? (
        <Card>
          <T>お薬リストに、まだお薬がありません。</T>
          <Button label="お薬を登録する" onPress={() => go({ name: 'medSettings' })} />
        </Card>
      ) : (
        homeMeds.map((m) => {
          const recs = data.medRecords.filter((r) => r.medId === m.id && r.date === today).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
          return (
            <Card key={m.id}>
              <T bold style={{ fontSize: 20 }}>{m.name}</T>
              <T small sub>{[m.form, m.dose].filter(Boolean).join('／') || '　'}</T>
              {recs.length > 0 ? (
                <T small sub style={{ marginTop: 4 }}>
                  今日の記録：{recs.map((r) => `${r.time} ${labelOf(MED_RESULT, r.result)}`).join('、')}
                </T>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {MED_RESULT.map((o) => (
                  <Button key={o.v} kind="secondary" label={o.label} onPress={() => tap(m, o.v)} style={{ flexGrow: 1, flexBasis: '45%' }} />
                ))}
              </View>
              <Input value={memo[m.id] ?? ''} onChangeText={(t) => setMemo({ ...memo, [m.id]: t })} placeholder="メモ（任意）" style={{ marginTop: 8 }} />
              {pending?.med.id === m.id && pending.existing.time ? (
                <ConfirmBox
                  message={`${slotWord[slotOf(pending.existing.time)]} ${pending.existing.time} に「飲めた」と記録済みです。`}
                  yes="それでも記録する"
                  no="やめる"
                  onYes={() => record(pending.med, pending.result)}
                  onNo={() => setPending(undefined)}
                />
              ) : null}
            </Card>
          );
        })
      )}

      {hospitalMeds.length > 0 ? (
        <>
          <H>病院での処置</H>
          <T small sub style={{ marginBottom: 8 }}>日付・名前・メモだけを記録します。</T>
          {hospitalMeds.map((m) => (
            <Card key={m.id}>
              <T bold style={{ fontSize: 20 }}>{m.name}</T>
              <DateStepper date={hospDate[m.id] ?? today} onChange={(d) => setHospDate({ ...hospDate, [m.id]: d })} max={today} />
              <Input value={memo[m.id] ?? ''} onChangeText={(t) => setMemo({ ...memo, [m.id]: t })} placeholder="メモ（任意）" style={{ marginTop: 8 }} />
              <Button kind="secondary" label="この日の処置として記録する" onPress={() => recordHospital(m)} />
            </Card>
          ))}
        </>
      ) : null}

      <H>お薬リスト・時刻の設定</H>
      <Button kind="secondary" label="お薬の登録・リマインダーを設定する" onPress={() => go({ name: 'medSettings' })} />
      <Note>{TEXT.vetFirst}</Note>
    </Screen>
  );
}
