import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { colors, fonts, sizes } from '../config/theme';
import { Button, T } from './ui';

/** 画面の外枠。Web 版はページ全体でスクロール（印刷しやすくするため） */
export function Screen({ children, title, onBack }: { children: React.ReactNode; title?: string; onBack?: () => void }) {
  const body = (
    <View style={{ padding: 20, paddingBottom: 120, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
      {onBack ? (
        <Pressable accessibilityRole="button" onPress={onBack} style={{ minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }} nativeID="noprint-back">
          <Text style={{ fontFamily: fonts.body, fontSize: sizes.label, color: colors.text }}>‹ もどる</Text>
        </Pressable>
      ) : null}
      {title ? (
        <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: sizes.title, color: colors.text, fontWeight: '700', marginBottom: 16 }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
  if (Platform.OS === 'web') return body;
  return <ScrollView keyboardShouldPersistTaps="handled">{body}</ScrollView>;
}

/** 確認の箱。2つの選択肢を同じ大きさで並べ、片方を強調しない */
export function ConfirmBox({
  message,
  yes,
  no,
  onYes,
  onNo,
}: {
  message: string;
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.text, borderRadius: sizes.radius, padding: 20, marginVertical: 12 }}
    >
      <T style={{ marginBottom: 12 }}>{message}</T>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button kind="secondary" label={yes} onPress={onYes} style={{ flex: 1 }} />
        <Button kind="secondary" label={no} onPress={onNo} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

/** 日付を1日ずつ動かす */
export function DateStepper({ date, onChange, max }: { date: string; onChange: (d: string) => void; max?: string }) {
  const move = (n: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + n);
    const p = (x: number) => (x < 10 ? '0' + x : String(x));
    const next = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    if (max && next > max) return;
    onChange(next);
  };
  const d = new Date(date + 'T00:00:00');
  const wd = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  const isMax = max !== undefined && date >= max;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Button kind="secondary" label="‹ 前の日" onPress={() => move(-1)} />
      <T bold style={{ flex: 1, textAlign: 'center' }}>
        {d.getMonth() + 1}月{d.getDate()}日（{wd}）
      </T>
      <Button kind="secondary" label="次の日 ›" onPress={() => move(1)} disabled={isMax} />
    </View>
  );
}
