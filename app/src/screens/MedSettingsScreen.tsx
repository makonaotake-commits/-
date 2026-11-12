import React, { useState } from 'react';
import { View } from 'react-native';
import { Autocomplete } from '../components/Autocomplete';
import { defaultReminder, ReminderEditor } from '../components/ReminderEditor';
import { ConfirmBox, Screen } from '../components/Screen';
import { Button, Card, CatBadge, Choice, Field, H, Input, Note, T, useCurrentCat } from '../components/ui';
import { TEXT } from '../config/labels';
import { DRUG_CANDIDATES, DRUG_LIST_VERSION, DrugCandidate, searchCandidates } from '../data/drugs';
import { Medication, newId, useStore } from '../data/store';

const FORMS = ['錠剤', '粉薬', '液体', 'ペースト', 'その他'];

type Draft = Omit<Medication, 'id' | 'catId'> & { id?: string };
const emptyDraft = (): Draft => ({ name: '', kind: 'home', reminder: defaultReminder() });

type Suggest = { kind: 'drug'; d: DrugCandidate } | { kind: 'own'; name: string };

export function MedSettingsScreen({ back }: { back: (msg?: string) => void }) {
  const { data, update } = useStore();
  const cat = useCurrentCat();
  const meds = data.meds.filter((m) => m.catId === cat?.id);
  const [draft, setDraft] = useState<Draft>();
  const [removing, setRemoving] = useState<string>();

  const suggestions: Suggest[] = draft
    ? [
        ...searchCandidates(draft.name, DRUG_CANDIDATES, (d) => [d.name, ...d.aliases], (d) => d.name).map((d) => ({ kind: 'drug' as const, d })),
        ...searchCandidates(draft.name, data.customMedNames, (n) => [n], (n) => n).map((name) => ({ kind: 'own' as const, name })),
      ].filter((x) => (x.kind === 'drug' ? x.d.name !== draft.name : x.name !== draft.name))
    : [];

  const save = () => {
    if (!cat || !draft || !draft.name.trim()) return;
    const name = draft.name.trim();
    const m: Medication = { ...draft, id: draft.id ?? newId(), catId: cat.id, name, dose: draft.kind === 'home' ? draft.dose?.trim() || undefined : undefined, reminder: draft.kind === 'home' ? draft.reminder : { ...draft.reminder, enabled: false }, memo: draft.memo?.trim() || undefined };
    update((x) => ({
      ...x,
      meds: x.meds.some((y) => y.id === m.id) ? x.meds.map((y) => (y.id === m.id ? m : y)) : [...x.meds, m],
      customMedNames: !m.candidateId && !x.customMedNames.includes(name) ? [...x.customMedNames, name] : x.customMedNames,
    }));
    setDraft(undefined);
  };

  if (draft) {
    return (
      <Screen title={draft.id ? 'お薬を編集する' : 'お薬を登録する'} onBack={() => setDraft(undefined)}>
        <CatBadge cat={cat} />
        <Note>{TEXT.medListNote}</Note>
        <Card>
          <Field label="お薬の名前" hint="2文字以上入力すると候補が出ます。候補にない名前や「白い錠剤（朝）」のような呼び方でも登録できます。">
            <Autocomplete
              value={draft.name}
              onChangeText={(t) => setDraft({ ...draft, name: t, candidateId: undefined, maker: undefined })}
              suggestions={suggestions}
              render={(x) => (x.kind === 'drug' ? { title: x.d.name, sub: `${x.d.form}／${x.d.maker}${x.d.verified ? '' : '（試作用の仮データ）'}` } : { title: x.name, sub: '前に入力した名前' })}
              onPick={(x) =>
                x.kind === 'drug'
                  ? setDraft({ ...draft, name: x.d.name, candidateId: x.d.id, form: x.d.form, maker: x.d.maker, kind: x.d.kind })
                  : setDraft({ ...draft, name: x.name, candidateId: undefined })
              }
              placeholder="例：ラプロス"
            />
            <T small sub style={{ marginTop: 6 }}>{TEXT.candidateNote}</T>
          </Field>
          {draft.candidateId ? (
            <View style={{ backgroundColor: '#F3EEE7', borderRadius: 12, padding: 14, marginBottom: 20 }}>
              <T bold>選んだお薬</T>
              <T>{draft.name}</T>
              <T>剤形：{draft.form}</T>
              <T>メーカー：{draft.maker}</T>
              {DRUG_CANDIDATES.find((d) => d.id === draft.candidateId)?.verified === false ? <T small sub>※ 名前・剤形・メーカーを確認する前の、試作用の仮データです。</T> : null}
              <T small sub>名前の似たお薬とまちがえていないか、お手元のお薬と見比べてください。</T>
            </View>
          ) : (
            <Field label="形（任意）">
              <Choice options={FORMS.map((f) => ({ v: f, label: f }))} value={draft.form} onChange={(v) => setDraft({ ...draft, form: v })} />
            </Field>
          )}
          <Field label="記録の種類" hint="注射などを選ぶと「病院での処置」になります。変えることもできます。">
            <Choice
              options={[
                { v: 'home', label: '自宅で与える' },
                { v: 'hospital', label: '病院での処置' },
              ]}
              value={draft.kind}
              onChange={(v) => v && setDraft({ ...draft, kind: v })}
            />
          </Field>
          {draft.kind === 'home' ? (
            <Field label="1回の量（任意）" hint="獣医師に指示された量を入力してください。">
              <Input value={draft.dose ?? ''} onChangeText={(t) => setDraft({ ...draft, dose: t })} placeholder="例：1錠、半分、0.5mL" />
            </Field>
          ) : null}
          <Field label="メモ（任意）">
            <Input value={draft.memo ?? ''} onChangeText={(t) => setDraft({ ...draft, memo: t })} multiline />
          </Field>
          {draft.kind === 'home' ? <ReminderEditor value={draft.reminder} onChange={(r) => setDraft({ ...draft, reminder: r })} /> : null}
        </Card>
        <Button label="保存する" onPress={save} disabled={!draft.name.trim()} />
        <T small sub style={{ marginTop: 12 }}>候補リスト：{DRUG_LIST_VERSION}</T>
      </Screen>
    );
  }

  return (
    <Screen title="お薬リスト・時刻の設定" onBack={() => back()}>
      <CatBadge cat={cat} />
      {meds.length === 0 ? <T sub style={{ marginBottom: 12 }}>まだ登録されたお薬はありません。</T> : null}
      {meds.map((m) => (
        <Card key={m.id}>
          <T bold>{m.name}</T>
          <T small sub>{[m.form, m.maker && m.candidateId ? m.maker : undefined, m.dose].filter(Boolean).join('／')}</T>
          <T small sub>
            {m.kind === 'hospital' ? '病院での処置' : `リマインダー：${m.reminder.enabled && m.reminder.times.length ? m.reminder.times.join('・') : '使わない'}`}
          </T>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button kind="secondary" label="編集する" onPress={() => setDraft({ ...m })} style={{ flex: 1 }} />
            <Button kind="secondary" label="リストから外す" onPress={() => setRemoving(m.id)} style={{ flex: 1 }} />
          </View>
          {removing === m.id ? (
            <ConfirmBox
              message={`「${m.name}」をお薬リストから外しますか？これまでの記録は残ります。`}
              yes="外す"
              no="外さない"
              onYes={() => {
                update((x) => ({ ...x, meds: x.meds.filter((y) => y.id !== m.id) }));
                setRemoving(undefined);
              }}
              onNo={() => setRemoving(undefined)}
            />
          ) : null}
        </Card>
      ))}
      <Button label="＋ お薬を登録する" onPress={() => setDraft(emptyDraft())} />
      <H>補液のリマインダー</H>
      <T sub small>補液の時刻は、「補液を記録する」画面の下で設定できます。</T>
    </Screen>
  );
}
