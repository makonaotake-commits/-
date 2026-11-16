// 振り返り（S-08）：カレンダー（F-08。記録した日に葉っぱ）、その日のタイムライン（直す・消す）、体重の推移（F-12）
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarLeaf } from '../components/Marks';
import { NoticeLine } from '../components/NoticeLine';
import { ConfirmBox, Screen } from '../components/Screen';
import { Button, Card, CatSwitcher, Choice, H, Input, T, useCurrentCat } from '../components/ui';
import { WeightChart } from '../components/WeightChart';
import { APPETITE, ENERGY, FLUID_STATE, labelOf, MED_RESULT, STOOL_STATE, WATER } from '../config/labels';
import { fonts } from '../config/theme';
import { useColors, useSizes } from '../config/useTheme';
import { ConditionRecord, MedResult, nowParts, pad, shortDate, toDateStr, useStore } from '../data/store';
import type { Route } from '../../App';

const WD = ['日', '月', '火', '水', '木', '金', '土'];

function conditionSummary(c: ConditionRecord) {
  const parts: string[] = [];
  if (c.appetite) parts.push(`食欲：${labelOf(APPETITE, c.appetite)}`);
  if (c.water || c.waterMl !== undefined) parts.push(`飲水：${labelOf(WATER, c.water) ?? ''}${c.waterMl !== undefined ? ` ${c.waterMl} mL` : ''}`);
  if (c.urineCount !== undefined) parts.push(`尿 ${c.urineCount}回`);
  if (c.vomitCount !== undefined) parts.push(`嘔吐 ${c.vomitCount}回`);
  if (c.stoolCount !== undefined) parts.push(`便 ${c.stoolCount}回${c.stoolState ? `（${labelOf(STOOL_STATE, c.stoolState)}）` : ''}`);
  if (c.energy) parts.push(`元気さ：${labelOf(ENERGY, c.energy)}`);
  if (c.weightKg !== undefined) parts.push(`体重 ${c.weightKg.toFixed(2)} kg`);
  if (c.memo) parts.push(`メモ：${c.memo}`);
  return parts.join('／');
}

export function ReviewScreen({ go }: { go: (r: Route) => void }) {
  const { data, update } = useStore();
  const c = useColors();
  const z = useSizes();
  const cat = useCurrentCat();
  const today = nowParts().date;
  const [month, setMonth] = useState(today.slice(0, 7)); // YYYY-MM
  const [day, setDay] = useState(today);
  const [deleting, setDeleting] = useState<string>();
  const [editingMed, setEditingMed] = useState<{ id: string; result?: MedResult; memo: string }>();
  const [period, setPeriod] = useState<'30' | '90' | 'all'>('30');

  if (!cat) return <Screen title="振り返り"><T>猫を登録すると、ここで記録を振り返れます。</T></Screen>;

  const conds = data.conditions.filter((x) => x.catId === cat.id);
  const fluids = data.fluids.filter((x) => x.catId === cat.id);
  const meds = data.medRecords.filter((x) => x.catId === cat.id);
  const recorded = new Set([...conds.map((x) => x.date), ...fluids.map((x) => x.date), ...meds.map((x) => x.date)]);

  // カレンダーの日付
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (string | undefined)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(undefined);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`);
  while (cells.length % 7) cells.push(undefined);
  const moveMonth = (n: number) => {
    const d = new Date(y, m - 1 + n, 1);
    setMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };
  const isThisMonth = month >= today.slice(0, 7);

  // その日のタイムライン
  type Item = { id: string; kind: 'cond' | 'fluid' | 'med'; time: string; title: string; detail?: string };
  const items: Item[] = [
    ...conds.filter((x) => x.date === day).map((x) => ({ id: x.id, kind: 'cond' as const, time: x.time, title: '体調', detail: conditionSummary(x) })),
    ...fluids
      .filter((x) => x.date === day)
      .map((x) => ({
        id: x.id,
        kind: 'fluid' as const,
        time: x.time,
        title: `補液 ${x.ml !== undefined ? x.ml + ' mL' : ''}`,
        detail: [x.fluidName, x.site && `${x.site}${x.side ? '・' + x.side : ''}`, labelOf(FLUID_STATE, x.state), x.memo].filter(Boolean).join('／'),
      })),
    ...meds
      .filter((x) => x.date === day)
      .map((x) => ({
        id: x.id,
        kind: 'med' as const,
        time: x.time ?? '',
        title: x.kind === 'hospital' ? `${x.medName}（病院での処置）` : `${x.medName}：${labelOf(MED_RESULT, x.result)}`,
        detail: x.memo,
      })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const remove = (it: Item) => {
    update((x) => ({
      ...x,
      conditions: it.kind === 'cond' ? x.conditions.filter((r) => r.id !== it.id) : x.conditions,
      fluids: it.kind === 'fluid' ? x.fluids.filter((r) => r.id !== it.id) : x.fluids,
      medRecords: it.kind === 'med' ? x.medRecords.filter((r) => r.id !== it.id) : x.medRecords,
    }));
    setDeleting(undefined);
  };

  const edit = (it: Item) => {
    if (it.kind === 'cond') go({ name: 'condition', date: day });
    else if (it.kind === 'fluid') go({ name: 'fluid', id: it.id });
    else {
      const r = meds.find((x) => x.id === it.id);
      setEditingMed({ id: it.id, result: r?.result, memo: r?.memo ?? '' });
    }
  };

  // 体重グラフの期間（F-12）
  const weightAll = conds.filter((x) => x.weightKg !== undefined).sort((a, b) => a.date.localeCompare(b.date));
  let from: string;
  if (period === 'all') from = weightAll[0]?.date ?? today;
  else {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() - (Number(period) - 1));
    from = toDateStr(d);
  }
  const weightPts = weightAll.filter((x) => x.date >= from).map((x) => ({ date: x.date, kg: x.weightKg!, copied: x.copiedFields?.includes('weightKg') }));

  const cellW = `${100 / 7}%` as const;
  const dayLabel = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getMonth() + 1}月${dt.getDate()}日（${WD[dt.getDay()]}）`;
  };

  return (
    <Screen title="振り返り">
      <CatSwitcher />
      <Card style={{ marginTop: 12 }}>
        <T bold style={{ textAlign: 'center' }}>
          {y}年{m}月
        </T>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button kind="secondary" label="‹ 前の月" onPress={() => moveMonth(-1)} style={{ flex: 1 }} />
          <Button kind="secondary" label="次の月 ›" onPress={() => moveMonth(1)} disabled={isThisMonth} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {WD.map((w) => (
            <Text key={w} style={{ width: cellW, textAlign: 'center', fontFamily: fonts.body, fontSize: z.small, color: c.textSub }}>
              {w}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => {
            if (!d) return <View key={i} style={{ width: cellW, height: 56 }} />;
            const on = d === day;
            const future = d > today;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityLabel={`${dayLabel(d)}${recorded.has(d) ? '、記録あり' : ''}`}
                disabled={future}
                onPress={() => setDay(d)}
                style={{
                  width: cellW,
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  borderWidth: on ? 2 : 0,
                  borderColor: c.text,
                  backgroundColor: on ? c.primaryTint : 'transparent',
                  opacity: future ? 0.45 : 1,
                }}
              >
                <Text style={{ fontFamily: on ? fonts.bodyBold : fonts.body, fontSize: z.label, color: c.text }}>{Number(d.slice(8))}</Text>
                {/* 記録した日だけに葉っぱ。記録のない日は何も出さない。数えない（F-29） */}
                <View style={{ height: 14, justifyContent: 'center' }}>{recorded.has(d) ? <CalendarLeaf /> : null}</View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <H>{dayLabel(day)}</H>
      <Card>
        {items.length === 0 ? <T sub>この日の記録はありません。</T> : null}
        {items.map((it) => (
          <View key={it.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <T bold style={{ width: 64 }}>{it.time || '—'}</T>
              <View style={{ flex: 1 }}>
                <T bold>{it.title}</T>
                {it.detail ? <T small sub>{it.detail}</T> : null}
                {it.kind === 'cond' && conds.find((x) => x.id === it.id) ? <NoticeLine record={conds.find((x) => x.id === it.id)!} /> : null}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button kind="secondary" label="直す" onPress={() => edit(it)} style={{ flex: 1 }} />
              <Button kind="secondary" label="消す" onPress={() => setDeleting(it.id)} style={{ flex: 1 }} />
            </View>
            {deleting === it.id ? <ConfirmBox message="この記録を消しますか？" yes="消す" no="消さない" onYes={() => remove(it)} onNo={() => setDeleting(undefined)} /> : null}
            {editingMed?.id === it.id ? (
              <View style={{ marginTop: 8 }}>
                {meds.find((x) => x.id === it.id)?.kind !== 'hospital' ? (
                  <Choice options={MED_RESULT} value={editingMed.result} onChange={(v) => v && setEditingMed({ ...editingMed, result: v })} />
                ) : null}
                <Input value={editingMed.memo} onChangeText={(t) => setEditingMed({ ...editingMed, memo: t })} placeholder="メモ（任意）" style={{ marginTop: 8 }} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Button
                    kind="secondary"
                    label="保存する"
                    style={{ flex: 1 }}
                    onPress={() => {
                      update((x) => ({
                        ...x,
                        medRecords: x.medRecords.map((r) => (r.id === editingMed.id ? { ...r, result: r.kind === 'hospital' ? undefined : editingMed.result, memo: editingMed.memo.trim() || undefined } : r)),
                      }));
                      setEditingMed(undefined);
                    }}
                  />
                  <Button kind="secondary" label="やめる" onPress={() => setEditingMed(undefined)} style={{ flex: 1 }} />
                </View>
              </View>
            ) : null}
          </View>
        ))}
        {day <= today ? <Button kind="quiet" label="この日の体調を記録する" onPress={() => go({ name: 'condition', date: day })} style={{ alignSelf: 'flex-start' }} /> : null}
      </Card>

      <H>体重の推移</H>
      <Card>
        <Choice
          options={[
            { v: '30', label: '1か月' },
            { v: '90', label: '3か月' },
            { v: 'all', label: '全期間' },
          ]}
          value={period}
          onChange={(v) => v && setPeriod(v)}
        />
        <View style={{ height: 12 }} />
        <WeightChart points={weightPts} from={from} to={today} />
      </Card>
      <T small sub>記録した日に、小さな葉っぱが付きます。{shortDate(today)} より先の日は選べません。</T>
    </Screen>
  );
}
