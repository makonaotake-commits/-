// はじめに（F-01・S-01）：短い3画面。文言は仮（ロシアンのレビュー対象）。
import React, { useState } from 'react';
import { View } from 'react-native';
import { Art } from '../art/Art';
import { Icon, IconName } from '../components/Icons';
import { useColors } from '../config/useTheme';
import { Screen } from '../components/Screen';
import { Button, Card, Note, T } from '../components/ui';
import { TEXT } from '../config/labels';
import { useStore } from '../data/store';

const FLOW: { icon: IconName; label: string }[] = [
  { icon: 'condition', label: '毎日を記録' },
  { icon: 'review', label: 'ふりかえる' },
  { icon: 'report', label: '先生に見せる' },
];

const PAGES = [
  {
    title: 'ねこと、ゆっくり',
    body: [],
  },
  {
    title: 'このアプリがしないこと',
    body: [
      '診断や判定、治療の提案はしません。',
      '記録の内容を評価したり、良い・悪いを伝えたりしません。',
      TEXT.vetFirst,
    ],
  },
  {
    title: '記録の扱い',
    body: [
      '記録そのものは、この端末の中だけに保存します。アカウントの登録はいりません。',
      '記録の内容を、広告に使うことはありません。',
      'アプリを開いた回数、記録を保存した件数、レポートを作った回数などの集計だけを送ります。記録の中身（値・お薬の名前・メモ・猫の名前）や記録の種類は送りません。設定で、いつでもオフにできます。',
    ],
  },
];

export function OnboardingScreen() {
  const { update, data } = useStore();
  const c = useColors();
  const [page, setPage] = useState(0);
  const p = PAGES[page];
  const last = page === PAGES.length - 1;
  const finish = () => update((x) => ({ ...x, settings: { ...x.settings, onboarded: true } }));

  return (
    <Screen title={p.title} onBack={page > 0 ? () => setPage(page - 1) : undefined}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Art name="guide_peek" width={112} fur={data.settings.guideFur} />
      </View>
      <T small sub style={{ textAlign: 'center', marginBottom: 12 }}>
        {page + 1} / {PAGES.length}
      </T>
      {page === 0 ? (
        <>
          <T style={{ textAlign: 'center', marginBottom: 20 }}>腎臓病の猫との毎日を、ゆっくり記録する。</T>
          {/* 何をするアプリか：絵で3つの流れを見せる */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
            {FLOW.map((f, i) => (
              <React.Fragment key={f.label}>
                {i > 0 ? <T sub style={{ marginTop: 26 }}>›</T> : null}
                <View style={{ alignItems: 'center', width: 104, gap: 8 }}>
                  <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: c.borderStrong, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={f.icon} size={36} />
                  </View>
                  <T small style={{ textAlign: 'center' }}>{f.label}</T>
                </View>
              </React.Fragment>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            {(['condition', 'fluid', 'med'] as IconName[]).map((n, i) => (
              <View key={n} style={{ alignItems: 'center', gap: 4 }}>
                <Icon name={n} size={28} />
                <T small sub>{['体調', '補液', 'お薬'][i]}</T>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Card>
          {p.body.map((b, i) => (
            <T key={i} style={{ marginBottom: 8 }}>
              {b}
            </T>
          ))}
        </Card>
      )}
      {last ? (
        <>
          <Note>{TEXT.emergency}</Note>
          <T small sub style={{ marginBottom: 8 }}>利用規約とプライバシーポリシーは準備中です（試作）。</T>
          <Button label="同意して始める" onPress={finish} />
        </>
      ) : (
        <Button label="次へ" onPress={() => setPage(page + 1)} />
      )}
    </Screen>
  );
}
