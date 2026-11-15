import React, { useState } from 'react';
import { View } from 'react-native';
import { CalendarLeaf, FUR_OPTIONS, GuideCat, NoticeMark } from '../components/Marks';
import { ConfirmBox, Screen } from '../components/Screen';
import { Button, Card, Choice, Field, H, Input, Note, T } from '../components/ui';
import { TEXT } from '../config/labels';
import { LICENSES } from '../data/licenses';
import { emptyData, nowParts, sampleData, Settings, toDateStr, useStore } from '../data/store';
import type { Route } from '../../App';

function validTime(t: string) {
  const m = /^(\d{1,2})[:：](\d{2})$/.exec(t.trim().normalize('NFKC'));
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return undefined;
  return `${Number(m[1]) < 10 ? '0' + Number(m[1]) : m[1]}:${m[2]}`;
}

export function SettingsScreen({ go }: { go: (r: Route) => void }) {
  const { data, update, replaceAll } = useStore();
  const st = data.settings;
  const [openLicense, setOpenLicense] = useState<string>();
  const [confirmClear, setConfirmClear] = useState(false);
  const [qStart, setQStart] = useState(st.quietHours.start);
  const [qEnd, setQEnd] = useState(st.quietHours.end);
  const set = (patch: Partial<Settings>) => update((x) => ({ ...x, settings: { ...x.settings, ...patch } }));

  // 利用のまとめ（F-28）：この1か月の件数を事実として出すだけ。目標・連続日数・比較・色は出さない
  const since = (() => {
    const d = new Date(nowParts().date + 'T00:00:00');
    d.setDate(d.getDate() - 29);
    return toDateStr(d);
  })();
  const activeIds = new Set(data.cats.filter((c) => !c.archived).map((c) => c.id));
  const inMonth = <X extends { catId: string; date: string }>(xs: X[]) => xs.filter((x) => activeIds.has(x.catId) && x.date >= since);
  const recordDays = new Set([...inMonth(data.conditions), ...inMonth(data.fluids), ...inMonth(data.medRecords)].map((x) => x.date)).size;
  const fluidCount = inMonth(data.fluids).length;
  const medCount = inMonth(data.medRecords).filter((m) => m.kind !== 'hospital').length;
  const reportCount = data.usage.reportOpens.filter((t) => t.slice(0, 10) >= since).length;
  const archivedCount = data.cats.filter((c) => c.archived).length;

  return (
    <Screen title="設定">
      <H>見やすさ</H>
      <Card>
        <Field label="文字の大きさ">
          <Choice
            options={[
              { v: 'normal', label: '標準' },
              { v: 'large', label: '大' },
              { v: 'xlarge', label: '特大' },
            ]}
            value={st.textSize}
            onChange={(v) => v && set({ textSize: v })}
          />
        </Field>
        <Field label="表示の明るさ">
          <Choice
            options={[
              { v: 'system', label: '端末に合わせる' },
              { v: 'light', label: '明るい表示' },
              { v: 'dark', label: '暗い表示' },
            ]}
            value={st.appearance}
            onChange={(v) => v && set({ appearance: v })}
          />
        </Field>
        <Field label="演出を控えめにする" hint="オンにすると、季節・時間帯の日だまり・しぐさの切りかえと、記録したときの動きをすべて止めて、静かな絵1枚だけにします。端末の「視差効果を減らす」がオンのときも、同じ表示になります。">
          <Choice
            options={[
              { v: 'off', label: 'オフ' },
              { v: 'on', label: 'オン（控えめにする）' },
            ]}
            value={st.calmMotion ? 'on' : 'off'}
            onChange={(v) => v && set({ calmMotion: v === 'on' })}
          />
        </Field>
        <Field label="案内役の猫の毛色" hint="いつでも変えられます。初期値は「しろ」です。">
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <GuideCat fur={st.guideFur} size={72} />
          </View>
          <Choice options={FUR_OPTIONS} value={st.guideFur} onChange={(v) => v && set({ guideFur: v })} />
          {st.guideFur !== 'white' ? <Button kind="quiet" label="初期値（しろ）に戻す" onPress={() => set({ guideFur: 'white' })} style={{ alignSelf: 'flex-start' }} /> : null}
        </Field>
      </Card>

      <H>通知</H>
      <Card>
        <Note>ブラウザの試作では、通知は鳴りません。ここで決めた内容は、iPhone 版の通知で使います。</Note>
        <Field label="夜間に通知を鳴らさない">
          <Choice
            options={[
              { v: 'off', label: '使わない' },
              { v: 'on', label: '使う' },
            ]}
            value={st.quietHours.enabled ? 'on' : 'off'}
            onChange={(v) => v && set({ quietHours: { ...st.quietHours, enabled: v === 'on' } })}
          />
          {st.quietHours.enabled ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Input
                value={qStart}
                onChangeText={setQStart}
                onBlur={() => {
                  const t = validTime(qStart);
                  if (t) set({ quietHours: { ...st.quietHours, start: t } });
                  setQStart(t ?? st.quietHours.start);
                }}
                style={{ width: 110 }}
              />
              <T>から</T>
              <Input
                value={qEnd}
                onChangeText={setQEnd}
                onBlur={() => {
                  const t = validTime(qEnd);
                  if (t) set({ quietHours: { ...st.quietHours, end: t } });
                  setQEnd(t ?? st.quietHours.end);
                }}
                style={{ width: 110 }}
              />
              <T>まで</T>
            </View>
          ) : null}
        </Field>
        <Field label="通知の内容を隠す" hint="オンにすると、ロック画面には「ケアの時間です」だけを出し、猫の名前やお薬・補液の内容を出しません。">
          <Choice
            options={[
              { v: 'off', label: 'オフ' },
              { v: 'on', label: 'オン（隠す）' },
            ]}
            value={st.hideNotificationContent ? 'on' : 'off'}
            onChange={(v) => v && set({ hideNotificationContent: v === 'on' })}
          />
        </Field>
      </Card>

      <H>猫</H>
      <Card>
        <T small sub>名前の変更・通知のお休み・一覧から外すは、ホームの「◯◯ちゃんのプロフィール・お休み」からできます。</T>
        <Button kind="secondary" label={`一覧から外した猫${archivedCount ? `（${archivedCount}匹）` : ''}`} onPress={() => go({ name: 'archivedCats' })} />
      </Card>

      <H>記録のデータ</H>
      <Card>
        <Button kind="secondary" label="記録を書き出す（CSV）" onPress={() => go({ name: 'export' })} />
        <Button kind="secondary" label="すべての記録を消す" onPress={() => setConfirmClear(true)} />
        {confirmClear ? (
          <ConfirmBox
            message="この端末に保存した、すべての猫と記録を消しますか？消した記録は元に戻せません。"
            yes="すべて消す"
            no="消さない"
            onYes={() => {
              replaceAll(emptyData);
              setConfirmClear(false);
            }}
            onNo={() => setConfirmClear(false)}
          />
        ) : null}
        <Field label="使われ方の集計を送る（仮）" hint="アプリの使われ方と件数だけを送ります。記録の中身（値・お薬の名前・メモ・猫の名前）や記録の種類は送りません。いつでもオフにできます。※ 試作では、送る仕組みはまだ入っていません。">
          <Choice
            options={[
              { v: 'on', label: 'オン' },
              { v: 'off', label: 'オフ' },
            ]}
            value={st.analytics ? 'on' : 'off'}
            onChange={(v) => v && set({ analytics: v === 'on' })}
          />
        </Field>
      </Card>

      <H>利用のまとめ</H>
      <Card>
        <T small sub>この端末の中で数えた、この1か月の件数です（一覧にいる猫の分）。</T>
        <T>記録した日：{recordDays}日</T>
        <T>補液の記録：{fluidCount}回</T>
        <T>お薬の記録（自宅）：{medCount}回</T>
        <T>レポートを開いた回数：{reportCount}回</T>
      </Card>

      <H>目印の見本（試作用）</H>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <NoticeMark />
          <T>記録のお知らせの目印（しおり）</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CalendarLeaf />
          <T>記録した日の葉っぱ（振り返りのカレンダー）</T>
        </View>
        <T small sub style={{ marginTop: 8 }}>記録のお知らせは、まだ試作に入っていません。</T>
      </Card>

      <Note>{TEXT.emergency}</Note>

      <H>このアプリについて</H>
      <Card>
        <T small sub>監修者・運営者・収益源の開示、利用規約、プライバシーポリシー、お問い合わせ先は準備中です。</T>
        <T small>{TEXT.vetFirst}</T>
      </Card>

      <H>ライセンス</H>
      <Card>
        <T small sub>このアプリは、次のフォントを SIL Open Font License 1.1 のもとで使っています。</T>
        {LICENSES.map((l) => (
          <View key={l.name}>
            <Button kind="secondary" label={openLicense === l.name ? `${l.name}（閉じる）` : l.name} onPress={() => setOpenLicense(openLicense === l.name ? undefined : l.name)} />
            {openLicense === l.name ? <T small>{l.text}</T> : null}
          </View>
        ))}
      </Card>

      <H>試作用</H>
      <Card>
        <T small sub>{TEXT.prototypeNote}</T>
        <Button kind="secondary" label="サンプルの記録に入れ替える" onPress={() => replaceAll(sampleData())} />
        <Button kind="secondary" label="「はじめに」をもう一度見る" onPress={() => set({ onboarded: false })} />
      </Card>
    </Screen>
  );
}
