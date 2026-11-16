// はじめに（F-01・S-01）：短い3画面。文言は仮（ロシアンのレビュー対象）。
import React, { useState } from 'react';
import { View } from 'react-native';
import { Art } from '../art/Art';
import { Screen } from '../components/Screen';
import { Button, Card, Note, T } from '../components/ui';
import { TEXT } from '../config/labels';
import { useStore } from '../data/store';

const PAGES = [
  {
    title: 'このアプリでできること',
    body: [
      '腎臓病の猫との毎日の体調・補液・お薬を、記録できます。',
      '記録は、獣医師に見せるレポートにまとめられます。',
      '補液やお薬の時間を、自分で決めてお知らせできます（iPhone 版）。',
    ],
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
      <Card>
        {p.body.map((b, i) => (
          <T key={i} style={{ marginBottom: 8 }}>
            {b}
          </T>
        ))}
      </Card>
      {last ? (
        <>
          <Note>{TEXT.emergency}</Note>
          <T small sub style={{ marginBottom: 8 }}>利用規約とプライバシーポリシーは準備中です（試作）。</T>
          <Button label="同意して始める" onPress={finish} />
        </>
      ) : (
        <Button label="次へ" onPress={() => setPage(page + 1)} />
      )}
      <T small sub style={{ marginTop: 12 }}>この画面の文言は仮のものです。</T>
    </Screen>
  );
}
