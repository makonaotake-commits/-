import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Autocomplete } from '../components/Autocomplete';
import { defaultReminder, ReminderEditor } from '../components/ReminderEditor';
import { ConfirmBox, DateStepper, Screen } from '../components/Screen';
import { Button, Card, CatBadge, Choice, Field, H, Input, Note, T, useCurrentCat } from '../components/ui';
import { FLUID_STATE, TEXT } from '../config/labels';
import { FLUID_CONFIRM_ABOVE_ML, FLUID_NAME_CANDIDATES, FLUID_SIDES, FLUID_SITES } from '../config/vetValues';
import { searchCandidates } from '../data/drugs';
import { FluidRecord, newId, nowParts, shortDate, useStore } from '../data/store';

export function FluidScreen({ back }: { back: (msg?: string) => void }) {
  const { data, update } = useStore();
  const cat = useCurrentCat();
  const now = nowParts();
  const [date, setDate] = useState(now.date);
  const [time, setTime] = useState(now.time);
  const [mlText, setMlText] = useState('');
  const [site, setSite] = useState<string>();
  const [side, setSide] = useState<string>();
  const [fluidName, setFluidName] = useState('');
  const [state, setState] = useState<FluidRecord['state']>();
  const [memo, setMemo] = useState('');
  const [confirmBig, setConfirmBig] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  const past = useMemo(
    () => data.fluids.filter((f) => f.catId === cat?.id).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)),
    [data.fluids, cat?.id],
  );
  const prevMl = past.find((f) => f.ml !== undefined);
  const prevSite = past.find((f) => f.site);
  const prevName = past.find((f) => f.fluidName);

  const ml = (() => {
    const t = mlText.normalize('NFKC').trim();
    if (!t) return undefined;
    const n = Number(t.replace(/[^\d.]/g, ''));
    return isFinite(n) && n > 0 ? n : undefined;
  })();

  const nameOptions = useMemo(
    () => Array.from(new Set([...FLUID_NAME_CANDIDATES, ...data.customFluidNames, ...past.map((f) => f.fluidName).filter((x): x is string => !!x)])),
    [data.customFluidNames, past],
  );
  const suggestions = searchCandidates(fluidName, nameOptions, (x) => [x], (x) => x).filter((x) => x !== fluidName);

  const hasAny = ml !== undefined || !!site || !!state || !!fluidName.trim() || !!memo.trim();

  const doSave = () => {
    if (!cat) return;
    const name = fluidName.trim() || undefined;
    const r: FluidRecord = { id: newId(), catId: cat.id, date, time, ml, site, side, fluidName: name, state, memo: memo.trim() || undefined };
    update((x) => ({
      ...x,
      fluids: [...x.fluids, r],
      customFluidNames: name && !x.customFluidNames.includes(name) && !FLUID_NAME_CANDIDATES.includes(name) ? [...x.customFluidNames, name] : x.customFluidNames,
    }));
    back('補液の記録を保存しました');
  };

  const save = () => {
    if (!hasAny) return;
    if (ml !== undefined && ml > FLUID_CONFIRM_ABOVE_ML) return setConfirmBig(true);
    doSave();
  };

  const reminder = (cat && data.fluidReminders[cat.id]) || defaultReminder();

  return (
    <Screen title="補液を記録する" onBack={() => back()}>
      <CatBadge cat={cat} />
      <DateStepper date={date} onChange={setDate} max={now.date} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <T>時刻</T>
        <Input value={time} onChangeText={setTime} style={{ width: 120 }} />
      </View>

      <Card style={{ marginTop: 16 }}>
        <Field label="量" hint={prevMl ? `前回 ${prevMl.ml} mL（${shortDate(prevMl.date)}）` : TEXT.fluidAmountHint}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Input value={mlText} onChangeText={setMlText} keyboardType="number-pad" placeholder="量" style={{ width: 160 }} />
            <T>mL</T>
          </View>
          {prevMl ? (
            <Button kind="quiet" label={`前回と同じ量（${prevMl.ml} mL）を入れる`} style={{ alignSelf: 'flex-start' }} onPress={() => setMlText(String(prevMl.ml))} />
          ) : null}
          <T small sub>{TEXT.fluidUpdateHint}</T>
        </Field>

        <Field label="部位（任意）" hint={prevSite ? `前回：${prevSite.site}${prevSite.side ? '・' + prevSite.side : ''}（${shortDate(prevSite.date)}）` : undefined}>
          <Choice options={FLUID_SITES.map((x) => ({ v: x, label: x }))} value={site} onChange={setSite} />
          <View style={{ height: 10 }} />
          <Choice options={FLUID_SIDES.map((x) => ({ v: x, label: x }))} value={side} onChange={setSide} />
        </Field>

        <Field label="輸液の名前（任意）" hint={prevName ? `前回：${prevName.fluidName}（${shortDate(prevName.date)}）` : '自由に入力できます。前に入力した名前は、2文字以上入力すると候補に出ます。'}>
          <Autocomplete value={fluidName} onChangeText={setFluidName} suggestions={suggestions} render={(x) => ({ title: x })} onPick={setFluidName} placeholder="例：乳酸リンゲル液" />
          {prevName && !fluidName ? (
            <Button kind="quiet" label={`前回と同じ（${prevName.fluidName}）を入れる`} style={{ alignSelf: 'flex-start' }} onPress={() => setFluidName(prevName.fluidName!)} />
          ) : null}
        </Field>

        <Field label="様子">
          <Choice options={FLUID_STATE} value={state} onChange={setState} />
        </Field>

        <Field label="メモ">
          <Input value={memo} onChangeText={setMemo} multiline />
        </Field>
      </Card>

      {confirmBig ? (
        <ConfirmBox
          message={`入力された量は ${ml} mL です。このまま保存しますか？`}
          yes="このまま保存する"
          no="量を直す"
          onYes={doSave}
          onNo={() => setConfirmBig(false)}
        />
      ) : (
        <Button label="保存する" onPress={save} disabled={!hasAny} />
      )}

      <H>補液のリマインダー</H>
      {showReminder ? (
        <Card>
          <ReminderEditor value={reminder} onChange={(r) => cat && update((x) => ({ ...x, fluidReminders: { ...x.fluidReminders, [cat.id]: r } }))} />
          <Button kind="secondary" label="閉じる" onPress={() => setShowReminder(false)} />
        </Card>
      ) : (
        <Button
          kind="secondary"
          label={reminder.enabled && reminder.times.length ? `設定中：${reminder.times.join('・')}（変える）` : '時刻を設定する'}
          onPress={() => setShowReminder(true)}
        />
      )}
      <Note>{TEXT.vetFirst}</Note>
    </Screen>
  );
}
