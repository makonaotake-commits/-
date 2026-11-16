import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { CountQuestion, ScaleQuestion } from '../components/QuizInputs';
import { DateStepper, Screen } from '../components/Screen';
import { useColors } from '../config/useTheme';
import { Button, Card, CatBadge, Choice, Counter, Field, Input, Note, T, useCurrentCat } from '../components/ui';
import { APPETITE, ENERGY, STOOL_STATE, TEXT, URINE_CLUMP, WATER } from '../config/labels';
import { evaluateNotices } from '../data/notices';
import { ConditionRecord, newId, nowParts, shortDate, useStore } from '../data/store';

const CARDS = ['ごはん・お水・元気', 'トイレ', '体重・メモ'];

// 丸の下に出す短い言葉（質問に「いつもとくらべて」を入れたので短くできる。記録とレポートの言葉は変えない）
const SHORT_APPETITE: Record<string, string> = { none: '食べなかった', less: '少ない', usual: 'いつもくらい', more: '多い' };
const SHORT_ENERGY: Record<string, string> = { less: '静か', usual: 'いつもくらい', more: '活発' };
function short<V extends string>(opts: readonly { v: V; label: string }[], map: Record<string, string>) {
  return opts.map((o) => ({ v: o.v, label: map[o.v] ?? o.label }));
}

const COPY_FIELDS = ['appetite', 'water', 'waterMl', 'urineCount', 'urineClump', 'vomitCount', 'stoolCount', 'stoolState', 'energy', 'weightKg'] as const;
type CopyField = (typeof COPY_FIELDS)[number];

function parseWeight(t: string): number | undefined {
  const n = Number(t.normalize('NFKC').replace(/[^\d.]/g, ''));
  if (!t.trim() || !isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100) / 100;
}

export function ConditionScreen({ back, initialDate }: { back: (msg?: string) => void; initialDate?: string }) {
  const { data, update } = useStore();
  const cat = useCurrentCat();
  const today = nowParts().date;
  const [date, setDate] = useState(initialDate ?? today);

  const existing = data.conditions.find((c) => c.catId === cat?.id && c.date === date);
  const useDraft = data.settings.draftFromPrevious;
  // 前回のパターンを下書きにする（F-33）：その日の記録がないときだけ、前回の内容（体重・メモを除く）を入れて始める。
  // 自動では保存しない。直さずに保存した項目には、コピーの印（レポートの ※）が付く。
  const draftFor = (d: string): Partial<ConditionRecord> => {
    if (!useDraft) return {};
    const p = data.conditions.filter((c) => c.catId === cat?.id && c.date < d).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    if (!p) return {};
    const next: Partial<ConditionRecord> = {};
    const cf: string[] = [];
    COPY_FIELDS.forEach((f) => {
      if (f !== 'weightKg' && p[f] !== undefined) {
        (next as Record<string, unknown>)[f] = p[f];
        cf.push(f);
      }
    });
    next.copiedFields = cf;
    return next;
  };
  const [rec, setRec] = useState<Partial<ConditionRecord>>(() => existing ?? draftFor(date));
  const [weightText, setWeightText] = useState(existing?.weightKg !== undefined ? existing.weightKg.toFixed(2) : '');
  const [loadedFor, setLoadedFor] = useState(date);

  // 日付を変えたら、その日の記録を読み込む
  if (loadedFor !== date) {
    const ex = data.conditions.find((c) => c.catId === cat?.id && c.date === date);
    setRec(ex ?? draftFor(date));
    setWeightText(ex?.weightKg !== undefined ? ex.weightKg.toFixed(2) : '');
    setLoadedFor(date);
  }

  const prev = useMemo(
    () => data.conditions.filter((c) => c.catId === cat?.id && c.date < date).sort((a, b) => (a.date < b.date ? 1 : -1))[0],
    [data.conditions, cat?.id, date],
  );
  const prevWeight = useMemo(
    () => data.conditions.filter((c) => c.catId === cat?.id && c.date < date && c.weightKg !== undefined).sort((a, b) => (a.date < b.date ? 1 : -1))[0],
    [data.conditions, cat?.id, date],
  );

  const copied = new Set(rec.copiedFields ?? []);
  const c = useColors();
  const [card, setCard] = useState(0);
  const [showWaterMl, setShowWaterMl] = useState(false);
  // どのカードに入力があるか（タブに ● を付けるだけ。数や良し悪しは出さない）
  const cardFilled = [
    rec.appetite !== undefined || rec.water !== undefined || rec.waterMl !== undefined || rec.energy !== undefined,
    rec.urineCount !== undefined || rec.stoolCount !== undefined || rec.vomitCount !== undefined,
    !!weightText.trim() || !!rec.memo?.trim(),
  ];
  const set = <K extends CopyField>(k: K, v: ConditionRecord[K] | undefined) => {
    const cf = (rec.copiedFields ?? []).filter((f) => f !== k);
    setRec({ ...rec, [k]: v, copiedFields: cf });
  };

  const copyPrev = () => {
    if (!prev) return;
    const next: Partial<ConditionRecord> = { ...rec };
    const cf: string[] = [];
    COPY_FIELDS.forEach((f) => {
      if (prev[f] !== undefined) {
        (next as Record<string, unknown>)[f] = prev[f];
        cf.push(f);
      }
    });
    next.copiedFields = cf;
    setRec(next);
    setWeightText(prev.weightKg !== undefined ? prev.weightKg.toFixed(2) : '');
  };

  const weight = parseWeight(weightText);
  const hasAny = COPY_FIELDS.some((f) => (f === 'weightKg' ? weight !== undefined : rec[f] !== undefined)) || !!rec.memo?.trim();

  const save = () => {
    if (!cat || !hasAny) return;
    const t = nowParts().time;
    const r: ConditionRecord = {
      ...(rec as ConditionRecord),
      id: existing?.id ?? newId(),
      catId: cat.id,
      date,
      time: existing?.time ?? t,
      weightKg: weight,
      memo: rec.memo?.trim() || undefined,
      copiedFields: (rec.copiedFields ?? []).filter((f) => (f === 'weightKg' ? weight !== undefined && weight === prev?.weightKg : true)),
    };
    // 記録のお知らせ（F-27）：保存したこの記録だけを、飼い主さんが決めた条件と照らす（端末の中だけ）
    r.noticeHits = evaluateNotices(data.notices, data.cats, r);
    if (r.noticeHits.length === 0) delete r.noticeHits;
    update((x) => ({ ...x, conditions: [...x.conditions.filter((c) => c.id !== r.id), r] }));
    back('記録しました');
  };

  return (
    <Screen title="体調を記録する" onBack={() => back()}>
      <CatBadge cat={cat} />
      <DateStepper date={date} onChange={setDate} max={today} />
      <T small sub style={{ marginVertical: 8 }}>
        {existing
          ? 'この日の記録を開いています。直して保存できます。'
          : (rec.copiedFields?.length ?? 0) > 0
            ? '前回の内容を下書きとして入れています。点線の項目が前回の内容です。保存するまで記録されません。体重は入れていません。'
            : '1つの項目だけでも保存できます。'}
      </T>
      {prev ? (
        <Button kind="secondary" label={`前回（${shortDate(prev.date)}）と同じ内容を入れる`} onPress={copyPrev} />
      ) : null}
      {copied.size > 0 ? <T small sub>「（前回の内容）」の付いた項目は、前回の内容をそのまま入れたものです。選び直すと印は消えます。</T> : null}

      {/* 3枚のカード（まとまった数問ずつ）。上のタブでどのカードにも移れる */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 }}>
        {CARDS.map((title, i) => {
          const on = card === i;
          return (
            <Pressable
              key={title}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setCard(i)}
              style={{ flex: 1, minHeight: 56, borderRadius: 12, borderWidth: 2, borderColor: on ? c.text : c.borderStrong, backgroundColor: on ? c.primaryTint : c.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}
            >
              <T small bold={on} style={{ textAlign: 'center' }}>
                {i + 1}. {title}
                {cardFilled[i] ? ' ●' : ''}
              </T>
            </Pressable>
          );
        })}
      </View>

      <Card>
        {card === 0 ? (
          <>
            <ScaleQuestion question="食欲は？（いつもとくらべて）" options={short(APPETITE, SHORT_APPETITE)} value={rec.appetite} onChange={(v) => set('appetite', v)} copied={copied.has('appetite')} />
            <ScaleQuestion question="お水を飲む量は？（いつもとくらべて）" options={WATER} value={rec.water} onChange={(v) => set('water', v)} copied={copied.has('water')} />
            {showWaterMl || rec.waterMl !== undefined ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -12, marginBottom: 20 }}>
                <Input
                  value={rec.waterMl !== undefined ? String(rec.waterMl) : ''}
                  onChangeText={(t) => {
                    const n = Number(t.normalize('NFKC').replace(/[^\d]/g, ''));
                    set('waterMl', t.trim() && isFinite(n) ? n : undefined);
                  }}
                  keyboardType="number-pad"
                  placeholder="量（任意）"
                  style={{ width: 140 }}
                />
                <T>mL{copied.has('waterMl') ? '（前回の内容）' : ''}</T>
              </View>
            ) : (
              <Button kind="quiet" label="飲んだ量（mL）も入れる" onPress={() => setShowWaterMl(true)} style={{ alignSelf: 'flex-start', marginTop: -16, marginBottom: 12 }} />
            )}
            <ScaleQuestion question="元気さは？（いつもとくらべて）" options={short(ENERGY, SHORT_ENERGY)} value={rec.energy} onChange={(v) => set('energy', v)} copied={copied.has('energy')} />
          </>
        ) : null}

        {card === 1 ? (
          <>
            <CountQuestion question="おしっこの回数は？" value={rec.urineCount} onChange={(v) => set('urineCount', v)} copied={copied.has('urineCount')}>
              {(rec.urineCount ?? 0) >= 1 ? (
                <View style={{ marginTop: 12 }}>
                  <ScaleQuestion question="塊の大きさは？（任意）" options={URINE_CLUMP} value={rec.urineClump} onChange={(v) => set('urineClump', v)} copied={copied.has('urineClump')} />
                </View>
              ) : null}
            </CountQuestion>
            <CountQuestion question="うんちの回数は？" value={rec.stoolCount} onChange={(v) => set('stoolCount', v)} copied={copied.has('stoolCount')}>
              {(rec.stoolCount ?? 0) >= 1 ? (
                <View style={{ marginTop: 12 }}>
                  <ScaleQuestion question="かたさは？（任意）" options={STOOL_STATE} value={rec.stoolState} onChange={(v) => set('stoolState', v)} copied={copied.has('stoolState')} />
                </View>
              ) : null}
            </CountQuestion>
            <CountQuestion question="吐いた回数は？" value={rec.vomitCount} onChange={(v) => set('vomitCount', v)} copied={copied.has('vomitCount')} />
          </>
        ) : null}

        {card === 2 ? (
          <>
            <Field label={`体重${copied.has('weightKg') ? '（前回の内容）' : ''}`} hint={prevWeight ? `前回 ${prevWeight.weightKg!.toFixed(2)} kg（${shortDate(prevWeight.date)}）` : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Input
                  value={weightText}
                  onChangeText={(t) => {
                    setWeightText(t);
                    setRec({ ...rec, copiedFields: (rec.copiedFields ?? []).filter((f) => f !== 'weightKg') });
                  }}
                  keyboardType="decimal-pad"
                  placeholder="例：3.45"
                  style={{ width: 160 }}
                />
                <T>kg</T>
              </View>
              {prevWeight ? (
                <Button
                  kind="quiet"
                  label="前回と同じ体重を入れる"
                  style={{ alignSelf: 'flex-start' }}
                  onPress={() => {
                    setWeightText(prevWeight.weightKg!.toFixed(2));
                    setRec({ ...rec, copiedFields: [...(rec.copiedFields ?? []).filter((f) => f !== 'weightKg'), 'weightKg'] });
                  }}
                />
              ) : null}
            </Field>
            <Field label="メモ">
              <Input value={rec.memo ?? ''} onChangeText={(t) => setRec({ ...rec, memo: t })} multiline placeholder="気づいたこと、先生に聞きたいことなど" />
            </Field>
          </>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {card > 0 ? <Button kind="secondary" label="‹ 前のカード" onPress={() => setCard(card - 1)} style={{ flex: 1 }} /> : null}
        {card < CARDS.length - 1 ? <Button kind="secondary" label="次のカード ›" onPress={() => setCard(card + 1)} style={{ flex: 1 }} /> : null}
      </View>
      <Button label="保存する" onPress={save} disabled={!hasAny} />
      {!hasAny ? <T small sub>どれか1つ入力すると保存できます。</T> : null}
      <Note>{TEXT.emergency}</Note>
    </Screen>
  );
}
