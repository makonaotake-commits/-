// 猫のプロフィール（S-10）：名前などの編集、次の通院日（F-13）、お休み・一覧から外す（F-10）
import React, { useState } from 'react';
import { View } from 'react-native';
import { ConfirmBox, DateStepper, Screen } from '../components/Screen';
import { Button, Card, CatBadge, Choice, Field, H, Input, Note, T } from '../components/ui';
import { Cat, nowParts, shortDate, useStore } from '../data/store';

export function CatProfileScreen({ catId, back }: { catId?: string; back: (msg?: string) => void }) {
  const { data, update, selectCat } = useStore();
  const cat = data.cats.find((c) => c.id === catId);
  const today = nowParts().date;
  const [name, setName] = useState(cat?.name ?? '');
  const [birthYear, setBirthYear] = useState(cat?.birthYear ?? '');
  const [memo, setMemo] = useState(cat?.memo ?? '');
  const [visitEditing, setVisitEditing] = useState(false);
  const [visit, setVisit] = useState(cat?.nextVisit ?? today);
  const [pauseMode, setPauseMode] = useState<'until-resume' | 'until-date'>();
  const [pauseUntil, setPauseUntil] = useState(today);
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (!cat) return <Screen title="猫のプロフィール" onBack={() => back()}><T>猫が見つかりませんでした。</T></Screen>;

  const patch = (p: Partial<Cat>) => update((x) => ({ ...x, cats: x.cats.map((c) => (c.id === cat.id ? { ...c, ...p } : c)) }));

  const saveProfile = () => {
    if (!name.trim()) return;
    patch({ name: name.trim(), birthYear: birthYear.trim() || undefined, memo: memo.trim() || undefined });
    back('保存しました');
  };

  const pause = () => {
    patch({ paused: { since: today, until: pauseMode === 'until-date' ? pauseUntil : undefined } });
    setPauseMode(undefined);
  };

  const archive = () => {
    update((x) => ({ ...x, cats: x.cats.map((c) => (c.id === cat.id ? { ...c, archived: true, paused: c.paused ?? { since: today } } : c)) }));
    const next = data.cats.find((c) => c.id !== cat.id && !c.archived);
    if (next) selectCat(next.id);
    back('一覧から外しました。設定の「一覧から外した猫」から、いつでも戻せます。');
  };

  return (
    <Screen title="猫のプロフィール" onBack={() => back()}>
      <CatBadge cat={cat} />
      <Card>
        <Field label="名前">
          <Input value={name} onChangeText={setName} />
        </Field>
        <Field label="生まれた年（任意）">
          <Input value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" placeholder="例：2012" style={{ width: 160 }} />
        </Field>
        <Field label="メモ（任意）" hint="病名や、獣医師から伝えられたことなど、自由に書けます。">
          <Input value={memo} onChangeText={setMemo} multiline />
        </Field>
        <Button label="保存する" onPress={saveProfile} disabled={!name.trim()} />
      </Card>

      <H>次の通院日</H>
      <Card>
        {cat.nextVisit && !visitEditing ? (
          <>
            <T>次の通院：{shortDate(cat.nextVisit).replace('/', '月')}日</T>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button kind="secondary" label="変える" onPress={() => { setVisit(cat.nextVisit!); setVisitEditing(true); }} style={{ flex: 1 }} />
              <Button kind="secondary" label="消す" onPress={() => patch({ nextVisit: undefined })} style={{ flex: 1 }} />
            </View>
          </>
        ) : visitEditing ? (
          <>
            <DateStepper date={visit} onChange={setVisit} />
            <Button kind="secondary" label="この日にする" onPress={() => { patch({ nextVisit: visit }); setVisitEditing(false); }} />
          </>
        ) : (
          <>
            <T sub small>1つだけ登録できます。ホームに表示します。通知はしません。</T>
            <Button kind="secondary" label="通院日を登録する" onPress={() => { setVisit(today); setVisitEditing(true); }} />
          </>
        )}
      </Card>

      <H>通知をお休みする</H>
      <Card>
        {cat.paused ? (
          <>
            <T>
              {cat.name}ちゃんの通知は、お休みしています
              {cat.paused.until ? `（${shortDate(cat.paused.until)} まで）` : '（再開するまで）'}。
            </T>
            <Button kind="secondary" label="通知を再開する" onPress={() => patch({ paused: undefined })} />
          </>
        ) : pauseMode ? (
          <>
            <Choice
              options={[
                { v: 'until-resume', label: '再開するまで' },
                { v: 'until-date', label: '期間を決める' },
              ]}
              value={pauseMode}
              onChange={(v) => v && setPauseMode(v)}
            />
            {pauseMode === 'until-date' ? (
              <View style={{ marginTop: 12 }}>
                <T small sub>この日までお休みします。期間が過ぎても、自動では再開しません。</T>
                <DateStepper date={pauseUntil} onChange={setPauseUntil} />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button kind="secondary" label="お休みする" onPress={pause} style={{ flex: 1 }} />
              <Button kind="secondary" label="やめる" onPress={() => setPauseMode(undefined)} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <>
            <T sub small>この子の通知を、すべてすぐに止めます。記録はこれまでどおりできます。</T>
            <T sub small>季節の絵や動きは、設定の「演出を控えめにする」で止められます。</T>
            <Button kind="secondary" label="通知をお休みする" onPress={() => setPauseMode('until-resume')} />
          </>
        )}
      </Card>

      <H>一覧から外す</H>
      <Card>
        <T sub small>ホームの一覧から外します。通知もすべて止まります。記録は消えず、設定の「一覧から外した猫」から、見る・レポートを作る・一覧に戻すができます。</T>
        <T sub small>季節の絵や動きは、設定の「演出を控えめにする」で止められます。</T>
        {confirmArchive ? (
          <ConfirmBox message={`${cat.name}ちゃんを一覧から外しますか？`} yes="外す" no="外さない" onYes={archive} onNo={() => setConfirmArchive(false)} />
        ) : (
          <Button kind="secondary" label="一覧から外す" onPress={() => setConfirmArchive(true)} />
        )}
      </Card>
    </Screen>
  );
}

/** 一覧から外した猫（S-11） */
export function ArchivedCatsScreen({ back, openReport }: { back: () => void; openReport: (catId: string) => void }) {
  const { data, update, selectCat } = useStore();
  const cats = data.cats.filter((c) => c.archived);
  return (
    <Screen title="一覧から外した猫" onBack={back}>
      {cats.length === 0 ? <T sub>一覧から外した猫はいません。</T> : null}
      {cats.map((c) => (
        <Card key={c.id}>
          <CatBadge cat={c} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button kind="secondary" label="記録を見る" onPress={() => openReport(c.id)} style={{ flex: 1 }} />
            <Button
              kind="secondary"
              label="一覧に戻す"
              onPress={() => {
                update((x) => ({ ...x, cats: x.cats.map((y) => (y.id === c.id ? { ...y, archived: false } : y)) }));
                selectCat(c.id);
              }}
              style={{ flex: 1 }}
            />
          </View>
          <T small sub>一覧に戻しても、通知はお休みのままです。再開はプロフィールからできます。</T>
        </Card>
      ))}
    </Screen>
  );
}
