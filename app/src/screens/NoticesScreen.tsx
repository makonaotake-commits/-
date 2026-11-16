// 記録のお知らせ（F-27）の設定。説明文と F27-1 の一文をいつも出す。条件の例・おすすめ・テンプレートは出さない。
// 第1弾はプッシュ通知を作らず、画面の目印だけ（ロシアン 2026-11-15）。
import React, { useState } from 'react';
import { View } from 'react-native';
import { NoticeMark } from '../components/Marks';
import { ConfirmBox, Screen } from '../components/Screen';
import { Button, Card, Choice, Field, H, Input, Note, T } from '../components/ui';
import { conditionActive, describeCondition, NOTICE_ITEMS, NOTICE_TEXT, NoticeCondition, NoticeItem } from '../data/notices';
import { newId, nowParts, shortDate, useStore } from '../data/store';

export function NoticesScreen({ back }: { back: () => void }) {
  const { data, update } = useStore();
  const n = data.notices;
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string>();
  const setNotices = (patch: Partial<typeof n>) => update((x) => ({ ...x, notices: { ...x.notices, ...patch } }));

  return (
    <Screen title="記録のお知らせ" onBack={back}>
      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <NoticeMark />
          <T style={{ flex: 1 }}>{NOTICE_TEXT.intro}</T>
        </View>
        <T style={{ marginTop: 8 }}>{NOTICE_TEXT.always}</T>
        <T small sub style={{ marginTop: 8 }}>{NOTICE_TEXT.consult}</T>
      </Card>

      <Field label="記録のお知らせを使う">
        <Choice
          options={[
            { v: 'off', label: '使わない' },
            { v: 'on', label: '使う' },
          ]}
          value={n.enabled ? 'on' : 'off'}
          onChange={(v) => v && setNotices({ enabled: v === 'on' })}
        />
      </Field>

      {n.enabled ? (
        <>
          <H>決めた条件</H>
          {n.conditions.length === 0 ? <T sub small style={{ marginBottom: 8 }}>条件はまだありません。条件がないときは、お知らせは出ません。</T> : null}
          {n.conditions.map((c) => {
            const cat = data.cats.find((x) => x.id === c.catId);
            const active = conditionActive(c, data.cats);
            return (
              <Card key={c.id}>
                <T bold>{cat?.name ?? '（猫が見つかりません）'}</T>
                <T>{describeCondition(c)}</T>
                <T small sub>作成日：{shortDate(c.createdAt)}</T>
                {!active ? <T small sub>この子はお休み中か一覧から外しているため、この条件は止まっています。</T> : null}
                <Button kind="secondary" label="この条件を消す" onPress={() => setRemoving(c.id)} />
                {removing === c.id ? (
                  <ConfirmBox
                    message="この条件を消しますか？"
                    yes="消す"
                    no="消さない"
                    onYes={() => {
                      setNotices({ conditions: n.conditions.filter((x) => x.id !== c.id) });
                      setRemoving(undefined);
                    }}
                    onNo={() => setRemoving(undefined)}
                  />
                ) : null}
              </Card>
            );
          })}
          {adding ? (
            <ConditionForm
              onCancel={() => setAdding(false)}
              onSave={(c) => {
                setNotices({ conditions: [...n.conditions, c] });
                setAdding(false);
              }}
            />
          ) : (
            <Button label="＋ 条件を作る" onPress={() => setAdding(true)} />
          )}
        </>
      ) : null}
    </Screen>
  );
}

function ConditionForm({ onSave, onCancel }: { onSave: (c: NoticeCondition) => void; onCancel: () => void }) {
  const { data } = useStore();
  const cats = data.cats.filter((c) => !c.archived && !c.paused);
  const [catId, setCatId] = useState<string | undefined>(cats[0]?.id);
  const [item, setItem] = useState<NoticeItem>();
  const [level, setLevel] = useState<string>();
  const [op, setOp] = useState<'gte' | 'lte'>();
  const [valueText, setValueText] = useState('');
  const def = NOTICE_ITEMS.find((x) => x.v === item);
  const value = (() => {
    const t = valueText.normalize('NFKC').trim();
    const v = Number(t);
    return t && isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : undefined;
  })();
  const ready = !!catId && !!def && (def.kind === 'count' || (def.kind === 'level' && !!level) || (def.kind === 'number' && !!op && value !== undefined));

  const save = () => {
    if (!ready || !catId || !def) return;
    onSave({
      id: newId(),
      catId,
      item: def.v,
      op: def.kind === 'level' ? 'level' : def.kind === 'count' ? 'recorded' : op!,
      level: def.kind === 'level' ? level : undefined,
      value: def.kind === 'number' ? value : undefined,
      createdAt: nowParts().date,
    });
  };

  if (cats.length === 0) {
    return (
      <Card>
        <T>条件を作れる猫がいません（お休み中や一覧から外した猫には作れません）。</T>
        <Button kind="secondary" label="閉じる" onPress={onCancel} />
      </Card>
    );
  }

  return (
    <Card>
      <Field label="猫">
        <Choice options={cats.map((c) => ({ v: c.id, label: c.name }))} value={catId} onChange={(v) => v && setCatId(v)} />
      </Field>
      <Field label="記録の項目">
        <Choice
          options={NOTICE_ITEMS.map((x) => ({ v: x.v, label: x.label }))}
          value={item}
          onChange={(v) => {
            setItem(v);
            setLevel(undefined);
            setOp(undefined);
            setValueText('');
          }}
        />
      </Field>
      {def?.kind === 'level' ? (
        <Field label="段階" hint="この段階が記録されたときに、お知らせします。">
          <Choice options={def.options!} value={level} onChange={setLevel} />
        </Field>
      ) : null}
      {def?.kind === 'count' ? <T style={{ marginBottom: 16 }}>1回以上が記録されたときに、お知らせします。</T> : null}
      {def?.kind === 'number' ? (
        <Field label="値" hint={NOTICE_TEXT.valueHint}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Input value={valueText} onChangeText={setValueText} keyboardType="decimal-pad" style={{ width: 140 }} accessibilityLabel="値（kg）" />
            <T>kg</T>
          </View>
          <View style={{ height: 10 }} />
          <Choice
            options={[
              { v: 'gte', label: '以上の記録があったとき' },
              { v: 'lte', label: '以下の記録があったとき' },
            ]}
            value={op}
            onChange={setOp}
          />
          <Note>{NOTICE_TEXT.always}</Note>
        </Field>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button kind="secondary" label="この条件を作る" onPress={save} disabled={!ready} style={{ flex: 1 }} />
        <Button kind="secondary" label="やめる" onPress={onCancel} style={{ flex: 1 }} />
      </View>
      {!ready ? <T small sub>猫・項目と、段階または値を選ぶと作れます。</T> : null}
    </Card>
  );
}
