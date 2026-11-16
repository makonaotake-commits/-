import React, { useState } from 'react';
import { View } from 'react-native';
import { Art } from '../art/Art';
import { CalendarLeaf, FUR_OPTIONS, NoticeMark } from '../components/Marks';
import { ConfirmBox, Screen } from '../components/Screen';
import { Button, Card, Choice, Field, H, Input, Note, T } from '../components/ui';
import { TEXT } from '../config/labels';
import { LICENSES } from '../data/licenses';
import { dailyNoticeStopped } from '../notifications/plan';
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
            <Art name="guide_peek" width={96} fur={st.guideFur} />
          </View>
          <Choice options={FUR_OPTIONS} value={st.guideFur} onChange={(v) => v && set({ guideFur: v })} />
          {st.guideFur !== 'white' ? <Button kind="quiet" label="初期値（しろ）に戻す" onPress={() => set({ guideFur: 'white' })} style={{ alignSelf: 'flex-start' }} /> : null}
        </Field>
      </Card>

      <H>記録</H>
      <Card>
        <Field label="体調の記録を、前回の内容から始める" hint="体調の記録を開いたときに、前回の内容（体重を除く）を下書きとして入れます。点線の項目が前回の内容で、保存するまで記録されません。直さずに保存した項目は、レポートで ※ が付きます。">
          <Choice
            options={[
              { v: 'on', label: 'オン' },
              { v: 'off', label: 'オフ' },
            ]}
            value={st.draftFromPrevious ? 'on' : 'off'}
            onChange={(v) => v && set({ draftFromPrevious: v === 'on' })}
          />
        </Field>
      </Card>

      <H>通知</H>
      <Card>
        <Note>ブラウザの試作では、通知は鳴りません。ここで決めた内容は、iPhone 版の通知で使います。</Note>
        <Field label="今日の記録のお知らせ" hint="その日の体調の記録がない猫について、決めた時刻に1回だけお知らせします。同じ子に3日続けて記録がなかったときは、記録されるまでお知らせを止めます。">
          <Choice
            options={[
              { v: 'off', label: '使わない' },
              { v: 'on', label: '使う' },
            ]}
            value={st.dailyNotice.enabled ? 'on' : 'off'}
            onChange={(v) => v && set({ dailyNotice: { ...st.dailyNotice, enabled: v === 'on' } })}
          />
          {st.dailyNotice.enabled ? (
            <View style={{ marginTop: 8 }}>
              <TimeField value={st.dailyNotice.time} onChange={(t) => set({ dailyNotice: { ...st.dailyNotice, time: t } })} />
              {data.cats
                .filter((c) => !c.archived && !c.paused && dailyNoticeStopped(data, c.id, nowParts().date))
                .map((c) => (
                  <T key={c.id} small sub>
                    {c.name}ちゃんへのお知らせは、記録されるまでお休みしています。
                  </T>
                ))}
            </View>
          ) : null}
        </Field>
        <Field label="予定のお知らせ（通院日の前日）" hint="猫のプロフィールで登録した通院日の前日にお知らせします。">
          <Choice
            options={[
              { v: 'on', label: '使う' },
              { v: 'off', label: '使わない' },
            ]}
            value={st.visitNotice.enabled ? 'on' : 'off'}
            onChange={(v) => v && set({ visitNotice: { ...st.visitNotice, enabled: v === 'on' } })}
          />
          {st.visitNotice.enabled ? (
            <View style={{ marginTop: 8 }}>
              <TimeField value={st.visitNotice.time} onChange={(t) => set({ visitNotice: { ...st.visitNotice, time: t } })} />
            </View>
          ) : null}
        </Field>
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

      <H>記録のお知らせ</H>
      <Card>
        <T small sub>自分で決めた条件にあてはまる記録があったときに、画面に目印を出します。いまは{data.notices.enabled ? `使っています（条件 ${data.notices.conditions.length}件）` : '使っていません'}。</T>
        <Button kind="secondary" label="記録のお知らせの設定" onPress={() => go({ name: 'notices' })} />
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
        <Field label="使われ方の集計を送る（仮）" hint="アプリを開いた回数、記録を保存した件数、レポートを作った回数などの集計だけを送ります。記録の中身（値・お薬の名前・メモ・猫の名前）や記録の種類は送りません。いつでもオフにできます。※ 試作では、送る仕組みはまだ入っていません。">
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
        <T>レポートを作った回数：{reportCount}回</T>
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

/** 時刻の入力（「8:00」のように入れる） */
function TimeField({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <T>時刻</T>
      <Input
        value={text}
        onChangeText={setText}
        onBlur={() => {
          const t = validTime(text);
          if (t) onChange(t);
          setText(t ?? value);
        }}
        style={{ width: 110 }}
      />
    </View>
  );
}
