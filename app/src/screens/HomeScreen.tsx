import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, IconName } from '../components/Icons';
import { fonts } from '../config/theme';
import { useColors, useSizes } from '../config/useTheme';
import { HomeScene } from '../components/HomeScene';
import { NoticeLine } from '../components/NoticeLine';
import { ConfirmBox, Screen } from '../components/Screen';
import { Button, Card, CatSwitcher, Field, H, Input, Note, T, useCurrentCat } from '../components/ui';
import { FLUID_STATE, labelOf, MED_RESULT, TEXT } from '../config/labels';
import { Cat, isReminderDay, newId, nowParts, sampleData, shortDate, useStore } from '../data/store';
import type { Route } from '../../App';

export function HomeScreen({ go }: { go: (r: Route) => void }) {
  const { data, update, selectCat, replaceAll, saveFailed } = useStore();
  const cat = useCurrentCat();
  const { date } = nowParts();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState<string>();

  const patchCat = (id: string, p: Partial<Cat>) => update((x) => ({ ...x, cats: x.cats.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  // お休みの期間が過ぎた猫（自動では再開しない。画面の中でだけ聞く。F-10）
  const endedPauses = data.cats.filter((c) => !c.archived && c.paused?.until && c.paused.until < date && !c.paused.askedAfterEnd);

  const d = new Date();
  const today = `${d.getMonth() + 1}月${d.getDate()}日（${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]}）`;
  const c = useColors();
  const z = useSizes();

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

  const activeCats = data.cats.filter((c) => !c.archived);
  if (activeCats.length === 0) {
    return (
      <Screen title={data.cats.length === 0 ? 'はじめまして' : '今日の記録'}>
        <T style={{ marginBottom: 16 }}>このアプリは、腎臓病の猫との毎日を記録して、獣医師に見せるためのものです。診断・判定・治療の提案はしません。</T>
        <Note>{TEXT.vetFirst}</Note>
        <H>猫を登録する</H>
        {addForm}
        <H>試作をすぐに触ってみる</H>
        <T sub small style={{ marginBottom: 8 }}>架空の猫2匹（むぎ・こはく）と、2週間分の記録が入ります。</T>
        {data.cats.length > 0 ? <T sub small style={{ marginBottom: 8 }}>一覧にいる猫はいません。一覧から外した猫は、設定の「一覧から外した猫」から戻せます。</T> : null}
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
    ...conds.map((c) => ({ id: c.id, kind: 'cond' as const, time: c.time, text: '体調' + (c.weightKg !== undefined ? `　${c.weightKg.toFixed(2)} kg` : '') })),
    ...fluids.map((f) => ({ id: f.id, kind: 'fluid' as const, time: f.time, text: `補液${f.ml !== undefined ? `　${f.ml} mL` : ''}` })),
    ...medRecs.map((m) => ({ id: m.id, kind: 'med' as const, time: m.time ?? '', text: m.kind === 'hospital' ? `${m.medName}（病院）` : `${m.medName}　${labelOf(MED_RESULT, m.result)}` })),
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

  // 今日の一覧：予定（時刻）と記録をひとつにまとめ、アイコンと時刻で見せる
  type Row = { key: string; time: string; icon: IconName; name: string; done: boolean; recId?: string; kind?: 'cond' | 'fluid' | 'med' };
  const rows: Row[] = [];
  plans.forEach((p, i) => rows.push({ key: 'p' + i, time: p.time, icon: p.label === '補液' ? 'fluid' : 'med', name: p.label, done: !!p.done }));
  items.forEach((it) => rows.push({ key: it.id, time: it.time, icon: it.kind === 'cond' ? 'condition' : it.kind === 'fluid' ? 'fluid' : 'med', name: it.text, done: true, recId: it.id, kind: it.kind }));
  rows.sort((a, b) => a.time.localeCompare(b.time));

  const tiles: { icon: IconName; label: string; route: Route; done: boolean }[] = [
    { icon: 'condition', label: '体調', route: { name: 'condition' }, done: conds.length > 0 },
    { icon: 'fluid', label: '補液', route: { name: 'fluid' }, done: fluids.length > 0 },
    { icon: 'med', label: 'お薬', route: { name: 'meds' }, done: medRecs.length > 0 },
  ];

  return (
    <Screen>
      {/* 猫を選ぶ（顔のアイコン）・プロフィール・追加 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <CatSwitcher />
        </View>
        {cat ? <RoundButton icon="settings" a11y={`${cat.name}ちゃんのプロフィール・お休み`} onPress={() => go({ name: 'catProfile', id: cat.id })} /> : null}
        <RoundButton icon="plus" a11y="猫を追加する" onPress={() => setAdding(!adding)} />
      </View>
      {adding ? addForm : null}
      {saveFailed ? <Note>このブラウザでは記録を保存できませんでした。</Note> : null}

      {endedPauses.map((c) => (
        <ConfirmCard3 key={c.id} cat={c} onResume={() => patchCat(c.id, { paused: undefined })} onKeep={() => patchCat(c.id, { paused: { ...c.paused!, until: undefined, askedAfterEnd: true } })} onArchive={() => patchCat(c.id, { archived: true })} />
      ))}

      <HomeScene paused={!!cat?.paused} />
      {/* 何をするアプリかを1行で */}
      <T sub style={{ textAlign: 'center', marginTop: -4, marginBottom: 16 }}>腎臓病の猫との毎日を、ゆっくり記録する。</T>

      {cat ? (
        <>
          {/* 今日の記録：大きな3つのボタン（アイコン＋1語）。記録した日は小さな印 */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {tiles.map((t) => (
              <Pressable
                key={t.label}
                accessibilityRole="button"
                accessibilityLabel={`${cat.name}ちゃんの${t.label}を記録する${t.done ? '（今日の記録あり）' : ''}`}
                onPress={() => go(t.route)}
                style={({ pressed }) => ({
                  flex: 1,
                  aspectRatio: 0.95,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: t.label === '体調' ? c.primary : c.borderStrong,
                  backgroundColor: pressed ? c.primaryTint : t.label === '体調' ? c.primary : c.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                })}
              >
                <Icon name={t.icon} size={44} color={t.label === '体調' ? c.onPrimary : c.text} />
                <Text style={{ fontFamily: fonts.heading, fontSize: z.heading, color: t.label === '体調' ? c.onPrimary : c.text }}>{t.label}</Text>
                {t.done ? (
                  <View style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: t.label === '体調' ? c.onPrimary : c.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={16} color={t.label === '体調' ? c.primary : c.text} />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          {/* 通院日・お休み中：小さな印だけ */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {cat.nextVisit && cat.nextVisit >= date ? (
              <Chip icon="visit" label={`通院 ${Number(cat.nextVisit.slice(5, 7))}/${Number(cat.nextVisit.slice(8, 10))}`} />
            ) : null}
            {cat.paused ? <Chip label="通知はお休み中" /> : null}
          </View>

          {/* 今日：予定と記録を時刻順に（アイコン・時刻・名前だけ） */}
          {rows.length > 0 ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: z.heading, color: c.text, marginBottom: 6 }}>{today}</Text>
              {rows.map((r) => (
                <View key={r.key}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderBottomWidth: 1, borderColor: c.border }}>
                    <T bold style={{ width: 64 }}>{r.time}</T>
                    <Icon name={r.icon} size={24} />
                    <T style={{ flex: 1 }} small={!r.recId}>
                      {r.name}
                    </T>
                    {r.done && !r.recId ? <Icon name="check" size={20} /> : null}
                    {r.recId ? (
                      <Pressable accessibilityRole="button" accessibilityLabel="この記録を消す" onPress={() => setDeleting(r.recId)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                        <T sub>×</T>
                      </Pressable>
                    ) : null}
                  </View>
                  {r.kind === 'cond' && r.recId ? <NoticeLineFor id={r.recId} /> : null}
                  {deleting === r.recId && r.recId ? (
                    <ConfirmBox message="この記録を消しますか？" yes="消す" no="消さない" onYes={() => remove(items.find((x) => x.id === r.recId)!)} onNo={() => setDeleting(undefined)} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {!data.settings.dailyNoticeIntroShown && !data.settings.dailyNotice.enabled ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <T small sub style={{ flex: 1 }}>記録がない日に、決めた時刻にお知らせすることもできます（設定）。</T>
          <Pressable accessibilityRole="button" accessibilityLabel="この案内を閉じる" onPress={() => update((x) => ({ ...x, settings: { ...x.settings, dailyNoticeIntroShown: true } }))} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <T sub>×</T>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

function RoundButton({ icon, a11y, onPress }: { icon: IconName; a11y: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: c.borderStrong, backgroundColor: pressed ? c.primaryTint : c.surface, alignItems: 'center', justifyContent: 'center' })}>
      <Icon name={icon} size={24} />
    </Pressable>
  );
}

function Chip({ icon, label }: { icon?: IconName; label: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: 18, backgroundColor: c.accentTint }}>
      {icon ? <Icon name={icon} size={18} /> : null}
      <T small>{label}</T>
    </View>
  );
}

/** お休みの期間が過ぎたときの確認。3つの選択肢を同じ大きさで並べる */
function ConfirmCard3({ cat, onResume, onKeep, onArchive }: { cat: Cat; onResume: () => void; onKeep: () => void; onArchive: () => void }) {
  return (
    <Card>
      <T>
        {cat.name}ちゃんの通知のお休みの期間（{shortDate(cat.paused!.until!)} まで）が過ぎました。再開しますか？
      </T>
      <View style={{ gap: 0 }}>
        <Button kind="secondary" label="再開する" onPress={onResume} />
        <Button kind="secondary" label="このまま止めておく" onPress={onKeep} />
        <Button kind="secondary" label="一覧から外す" onPress={onArchive} />
      </View>
    </Card>
  );
}

function NoticeLineFor({ id }: { id: string }) {
  const { data } = useStore();
  const r = data.conditions.find((c) => c.id === id);
  return r ? <NoticeLine record={r} /> : null;
}
