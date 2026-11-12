import React, { useState } from 'react';
import { View } from 'react-native';
import { ConfirmBox, Screen } from '../components/Screen';
import { Button, Card, CatSwitcher, Field, H, Input, Note, T, useCurrentCat } from '../components/ui';
import { FLUID_STATE, labelOf, MED_RESULT, TEXT } from '../config/labels';
import { emptyData, isReminderDay, newId, nowParts, sampleData, useStore } from '../data/store';
import type { Route } from '../../App';

export function HomeScreen({ go }: { go: (r: Route) => void }) {
  const { data, update, selectCat, replaceAll, saveFailed } = useStore();
  const cat = useCurrentCat();
  const { date } = nowParts();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleting, setDeleting] = useState<string>();

  const d = new Date();
  const today = `${d.getMonth() + 1}月${d.getDate()}日（${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]}）`;

  const addCat = () => {
    const n = name.trim();
    if (!n) return;
    const id = newId();
    update((x) => ({ ...x, cats: [...x.cats, { id, name: n }] }));
    selectCat(id);
    setName('');
    setAdding(false);
  };

  const addForm = (
    <Card>
      <Field label="猫の名前" hint="名前だけで登録できます。">
        <Input value={name} onChangeText={setName} placeholder="例：むぎ" onSubmitEditing={addCat} />
      </Field>
      <Button label="登録する" onPress={addCat} disabled={!name.trim()} />
      {data.cats.length > 0 ? <Button kind="quiet" label="やめる" onPress={() => setAdding(false)} /> : null}
    </Card>
  );

  if (data.cats.length === 0) {
    return (
      <Screen title="はじめまして">
        <T style={{ marginBottom: 16 }}>このアプリは、腎臓病の猫との毎日を記録して、獣医師に見せるためのものです。診断・判定・治療の提案はしません。</T>
        <Note>{TEXT.vetFirst}</Note>
        <H>猫を登録する</H>
        {addForm}
        <H>試作をすぐに触ってみる</H>
        <T sub small style={{ marginBottom: 8 }}>架空の猫2匹（むぎ・こはく）と、2週間分の記録が入ります。</T>
        <Button kind="secondary" label="サンプルの記録を入れる" onPress={() => replaceAll(sampleData())} />
        <Note>{TEXT.prototypeNote}</Note>
      </Screen>
    );
  }

  const conds = data.conditions.filter((c) => c.catId === cat?.id && c.date === date);
  const fluids = data.fluids.filter((f) => f.catId === cat?.id && f.date === date);
  const medRecs = data.medRecords.filter((m) => m.catId === cat?.id && m.date === date);

  // 今日のケア予定（事実の表示だけ。「まだ」「忘れ」などは出さない）
  type Plan = { time: string; label: string; done?: string };
  const plans: Plan[] = [];
  if (cat) {
    const fr = data.fluidReminders[cat.id];
    if (fr && isReminderDay(fr, date)) fr.times.forEach((t) => plans.push({ time: t, label: '補液', done: fluids.length ? `記録 ${fluids.map((f) => f.time).join('・')}` : undefined }));
    data.meds
      .filter((m) => m.catId === cat.id && isReminderDay(m.reminder, date))
      .forEach((m) =>
        m.reminder.times.forEach((t) => {
          const recs = medRecs.filter((r) => r.medId === m.id);
          plans.push({ time: t, label: m.name, done: recs.length ? `記録 ${recs.map((r) => r.time).join('・')}` : undefined });
        }),
      );
  }
  plans.sort((a, b) => a.time.localeCompare(b.time));

  type Item = { id: string; kind: 'cond' | 'fluid' | 'med'; time: string; text: string };
  const items: Item[] = [
    ...conds.map((c) => ({ id: c.id, kind: 'cond' as const, time: c.time, text: '体調の記録' + (c.weightKg !== undefined ? `（体重 ${c.weightKg.toFixed(2)} kg）` : '') })),
    ...fluids.map((f) => ({ id: f.id, kind: 'fluid' as const, time: f.time, text: `補液 ${f.ml !== undefined ? f.ml + ' mL' : '（量の記録なし）'}${f.state ? '・' + labelOf(FLUID_STATE, f.state) : ''}` })),
    ...medRecs.map((m) => ({ id: m.id, kind: 'med' as const, time: m.time ?? '', text: m.kind === 'hospital' ? `${m.medName}：病院での処置` : `${m.medName}：${labelOf(MED_RESULT, m.result)}` })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const remove = (it: Item) => {
    update((x) => ({
      ...x,
      conditions: it.kind === 'cond' ? x.conditions.filter((c) => c.id !== it.id) : x.conditions,
      fluids: it.kind === 'fluid' ? x.fluids.filter((c) => c.id !== it.id) : x.fluids,
      medRecords: it.kind === 'med' ? x.medRecords.filter((c) => c.id !== it.id) : x.medRecords,
    }));
    setDeleting(undefined);
  };

  return (
    <Screen>
      <T sub>{today}</T>
      <H level={1}>今日の記録</H>
      <CatSwitcher />
      {adding ? addForm : <Button kind="quiet" label="＋ 猫を追加する" onPress={() => setAdding(true)} style={{ alignSelf: 'flex-start' }} />}
      {saveFailed ? <Note>このブラウザでは記録を保存できませんでした。画面を閉じると記録は消えます（試作のため）。</Note> : null}

      {cat ? (
        <>
          <View style={{ marginTop: 8 }}>
            <Button label={`${cat.name}ちゃんの体調を記録する${conds.length ? '（今日の記録を開く）' : ''}`} onPress={() => go({ name: 'condition' })} style={{ minHeight: 72 }} />
            <Button label="補液を記録する" onPress={() => go({ name: 'fluid' })} style={{ minHeight: 72 }} />
            <Button label="お薬を記録する" onPress={() => go({ name: 'meds' })} style={{ minHeight: 72 }} />
          </View>

          <H>今日のケア予定</H>
          <Card>
            {plans.length === 0 ? (
              <T sub>予定はありません。補液・お薬の画面から時刻を設定できます。</T>
            ) : (
              plans.map((p, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, paddingVertical: 6 }}>
                  <T bold style={{ width: 64 }}>{p.time}</T>
                  <View style={{ flex: 1 }}>
                    <T>{p.label}</T>
                    {p.done ? <T small sub>{p.done}</T> : null}
                  </View>
                </View>
              ))
            )}
          </Card>

          <H>今日つけた記録</H>
          <Card>
            {items.length === 0 ? (
              <T sub>まだ記録はありません。記録はいつでも、できるときにどうぞ。</T>
            ) : (
              items.map((it) => (
                <View key={it.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <T bold style={{ width: 64 }}>{it.time}</T>
                    <T style={{ flex: 1 }}>{it.text}</T>
                    <Button kind="quiet" label="消す" onPress={() => setDeleting(it.id)} />
                  </View>
                  {deleting === it.id ? (
                    <ConfirmBox message="この記録を消しますか？" yes="消す" no="消さない" onYes={() => remove(it)} onNo={() => setDeleting(undefined)} />
                  ) : null}
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}

      <Note>{TEXT.emergency}</Note>

      <H>試作用</H>
      <T small sub>{TEXT.prototypeNote}</T>
      <Button kind="secondary" label="サンプルの記録に入れ替える" onPress={() => replaceAll(sampleData())} />
      <Button kind="secondary" label="すべての記録を消す" onPress={() => setConfirmClear(true)} />
      {confirmClear ? (
        <ConfirmBox
          message="このブラウザに保存した、すべての猫と記録を消しますか？"
          yes="すべて消す"
          no="消さない"
          onYes={() => {
            replaceAll(emptyData);
            setConfirmClear(false);
          }}
          onNo={() => setConfirmClear(false)}
        />
      ) : null}
    </Screen>
  );
}
