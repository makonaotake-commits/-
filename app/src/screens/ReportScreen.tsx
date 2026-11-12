import React, { useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card, CatSwitcher, Choice, H, Note, T, useCurrentCat } from '../components/ui';
import { WeightChart } from '../components/WeightChart';
import { APPETITE, ENERGY, FLUID_STATE, labelOf, MED_RESULT, STOOL_STATE, TEXT, URINE_CLUMP, WATER } from '../config/labels';
import { colors, fonts, sizes } from '../config/theme';
import { ConditionRecord, nowParts, shortDate, toDateStr, useStore } from '../data/store';

const NR = TEXT.noRecord;

type Period = '14' | '30' | 'all';

function daysBetween(from: string, to: string) {
  const out: string[] = [];
  const d = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (d <= end) {
    out.push(toDateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function Cell({ children, w = 96, head, first }: { children: React.ReactNode; w?: number; head?: boolean; first?: boolean }) {
  return (
    <View style={{ width: w, paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: head ? colors.sageTint : first ? '#F3EEE7' : colors.surface }}>
      <Text style={{ fontFamily: fonts.body, fontSize: sizes.small, color: colors.text, fontWeight: head ? '700' : '400' }}>{children}</Text>
    </View>
  );
}

/** 合計と「記録のある日数」を必ず並べる */
function sumWithDays(recs: (ConditionRecord | undefined)[], key: 'urineCount' | 'vomitCount' | 'stoolCount', totalDays: number) {
  const vals = recs.map((r) => r?.[key]).filter((v): v is number => v !== undefined);
  if (vals.length === 0) return `${NR}（記録のある日数 0/${totalDays}日）`;
  return `合計 ${vals.reduce((a, b) => a + b, 0)}回（記録のある日数 ${vals.length}/${totalDays}日）`;
}

export function ReportScreen() {
  const { data } = useStore();
  const cat = useCurrentCat();
  const [period, setPeriod] = useState<Period>('14');
  const to = nowParts().date;

  if (!cat) return <Screen title="獣医師に見せるレポート"><T>猫を登録すると、レポートを作れます。</T></Screen>;

  const allConds = data.conditions.filter((c) => c.catId === cat.id);
  const allDates = [
    ...allConds.map((c) => c.date),
    ...data.fluids.filter((f) => f.catId === cat.id).map((f) => f.date),
    ...data.medRecords.filter((m) => m.catId === cat.id).map((m) => m.date),
  ].sort();
  let from: string;
  if (period === 'all') from = allDates[0] ?? to;
  else {
    const d = new Date(to + 'T00:00:00');
    d.setDate(d.getDate() - (Number(period) - 1));
    from = toDateStr(d);
  }
  const days = daysBetween(from, to);
  const inRange = (d: string) => d >= from && d <= to;
  const conds = days.map((d) => allConds.find((c) => c.date === d));
  const fluids = data.fluids.filter((f) => f.catId === cat.id && inRange(f.date)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const medRecs = data.medRecords.filter((m) => m.catId === cat.id && inRange(m.date));
  const homeRecs = medRecs.filter((m) => m.kind !== 'hospital');
  const hospRecs = medRecs.filter((m) => m.kind === 'hospital').sort((a, b) => a.date.localeCompare(b.date));
  const medNames = Array.from(new Set(homeRecs.map((m) => m.medName)));

  // 補液の量の変更の履歴（前の記録と量が違うときだけ）
  const mlChanges: { date: string; ml: number }[] = [];
  let lastMl: number | undefined;
  data.fluids
    .filter((f) => f.catId === cat.id && f.ml !== undefined && f.date <= to)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .forEach((f) => {
      if (f.ml !== lastMl) {
        if (inRange(f.date)) mlChanges.push({ date: f.date, ml: f.ml! });
        lastMl = f.ml;
      }
    });

  const weightPts = conds.filter((c): c is ConditionRecord => !!c && c.weightKg !== undefined).map((c) => ({ date: c.date, kg: c.weightKg!, copied: c.copiedFields?.includes('weightKg') }));
  const memos = [
    ...conds.filter((c): c is ConditionRecord => !!c?.memo).map((c) => ({ date: c.date, text: `体調：${c.memo}` })),
    ...fluids.filter((f) => f.memo).map((f) => ({ date: f.date, text: `補液：${f.memo}` })),
    ...medRecs.filter((m) => m.memo).map((m) => ({ date: m.date, text: `${m.medName}：${m.memo}` })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const mark = (c: ConditionRecord | undefined, k: string, text?: string) => (text === undefined ? NR : text + (c?.copiedFields?.includes(k) ? ' ※' : ''));
  const count = (c: ConditionRecord | undefined, k: 'urineCount' | 'vomitCount' | 'stoolCount', extra?: string) =>
    c?.[k] === undefined ? NR : mark(c, k, `${c[k]}回${extra ? `（${extra}）` : ''}`);
  const hasCopy = conds.some((c) => c?.copiedFields?.length);
  const condDays = conds.filter(Boolean).length;
  const created = new Date();

  return (
    <Screen title="獣医師に見せるレポート">
      <View nativeID="noprint-controls">
        <CatSwitcher />
        <View style={{ height: 12 }} />
        <Choice
          options={[
            { v: '14', label: '直近2週間' },
            { v: '30', label: '直近1か月' },
            { v: 'all', label: '記録のある全期間' },
          ]}
          value={period}
          onChange={(v) => v && setPeriod(v)}
        />
        {Platform.OS === 'web' ? (
          <T small sub style={{ marginTop: 12 }}>ブラウザの試作では、画面で見る形だけです。PDF にして共有・印刷するのは、iPhone 版で作ります。</T>
        ) : null}
      </View>

      {/* 表紙 */}
      <Card style={{ marginTop: 16 }}>
        <T bold style={{ fontSize: 22 }}>{cat.name}ちゃんの記録</T>
        <T>期間：{shortDate(from)}〜{shortDate(to)}（{days.length}日間）</T>
        <T>作成日：{created.getFullYear()}年{created.getMonth() + 1}月{created.getDate()}日</T>
        <T small sub style={{ marginTop: 8 }}>{TEXT.reportCover}</T>
        {hasCopy ? <T small sub>※ は「前回と同じ」で前回の内容を入れ、直さずに保存した項目です。</T> : null}
      </Card>

      <H>体調の一覧</H>
      <T small sub>体調を記録した日：{condDays}/{days.length}日</T>
      <ScrollView horizontal style={{ marginVertical: 8 }}>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row' }}>
            {['日付', '食欲', '飲水', '尿', '嘔吐', '便', '元気さ', '体重'].map((h, i) => (
              <Cell key={h} head w={i === 0 ? 72 : i === 1 || i === 6 ? 128 : 104}>{h}</Cell>
            ))}
          </View>
          {days.map((d, i) => {
            const c = conds[i];
            return (
              <View key={d} style={{ flexDirection: 'row' }}>
                <Cell first w={72}>{shortDate(d)}</Cell>
                <Cell w={128}>{mark(c, 'appetite', labelOf(APPETITE, c?.appetite))}</Cell>
                <Cell w={104}>{mark(c, 'water', labelOf(WATER, c?.water) ?? (c?.waterMl !== undefined ? '' : undefined))}{c?.waterMl !== undefined ? ` ${c.waterMl}mL` : ''}</Cell>
                <Cell w={104}>{count(c, 'urineCount', labelOf(URINE_CLUMP, c?.urineClump))}</Cell>
                <Cell w={104}>{count(c, 'vomitCount')}</Cell>
                <Cell w={104}>{count(c, 'stoolCount', labelOf(STOOL_STATE, c?.stoolState))}</Cell>
                <Cell w={128}>{mark(c, 'energy', labelOf(ENERGY, c?.energy))}</Cell>
                <Cell w={104}>{c?.weightKg !== undefined ? mark(c, 'weightKg', `${c.weightKg.toFixed(2)} kg`) : NR}</Cell>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <Card>
        <T>尿：{sumWithDays(conds, 'urineCount', days.length)}</T>
        <T>嘔吐：{sumWithDays(conds, 'vomitCount', days.length)}</T>
        <T>便：{sumWithDays(conds, 'stoolCount', days.length)}</T>
        <T small sub>「{NR}」は記録がないこと、「0回」は 0回と記録したことを表します。</T>
      </Card>

      <H>体重の推移</H>
      <Card>
        <WeightChart points={weightPts} from={from} to={to} />
      </Card>

      <H>皮下輸液の記録</H>
      <Card>
        <T small sub>記録のある日数：{new Set(fluids.map((f) => f.date)).size}/{days.length}日</T>
        {fluids.length === 0 ? <T>{NR}（この期間の記録はありません）</T> : null}
        {fluids.map((f) => (
          <T key={f.id}>
            {shortDate(f.date)} {f.time}　{f.ml !== undefined ? `${f.ml} mL` : `量 ${NR}`}
            {f.fluidName ? `　${f.fluidName}` : ''}
            {f.site ? `　${f.site}${f.side ? '・' + f.side : ''}` : ''}
            {f.state ? `　${labelOf(FLUID_STATE, f.state)}` : ''}
          </T>
        ))}
        {mlChanges.length > 0 ? (
          <>
            <T bold style={{ marginTop: 12 }}>量の変更の履歴</T>
            {mlChanges.map((c, i) => (
              <T key={i}>{shortDate(c.date)} から {c.ml} mL</T>
            ))}
          </>
        ) : null}
      </Card>

      <H>投薬の記録（自宅で与えたもの）</H>
      <Card>
        {medNames.length === 0 ? <T>{NR}（この期間の記録はありません）</T> : null}
        {medNames.map((n) => {
          const rs = homeRecs.filter((r) => r.medName === n);
          const counts = MED_RESULT.map((o) => `${o.label} ${rs.filter((r) => r.result === o.v).length}回`).join('／');
          return (
            <View key={n} style={{ marginBottom: 12 }}>
              <T bold>{n}</T>
              <T>{counts}</T>
              <T small sub>記録のある日数 {new Set(rs.map((r) => r.date)).size}/{days.length}日</T>
            </View>
          );
        })}
      </Card>

      <H>病院での処置</H>
      <Card>
        {hospRecs.length === 0 ? <T>{NR}（この期間の記録はありません）</T> : null}
        {hospRecs.map((r) => (
          <T key={r.id}>{shortDate(r.date)}　{r.medName}</T>
        ))}
      </Card>

      <H>メモ</H>
      <Card>
        {memos.length === 0 ? <T>{NR}（この期間のメモはありません）</T> : null}
        {memos.map((m, i) => (
          <T key={i}>{shortDate(m.date)}　{m.text}</T>
        ))}
      </Card>
      <Note>{TEXT.vetFirst}</Note>
    </Screen>
  );
}
