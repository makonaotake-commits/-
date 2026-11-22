import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { fonts } from '../config/theme';
import { useColors, useSizes } from '../config/useTheme';
import { Button, T } from './ui';

/** 画面の外枠。Web 版はページ全体でスクロール（印刷しやすくするため） */
export function Screen({ children, title, onBack }: { children: React.ReactNode; title?: string; onBack?: () => void }) {
  const colors = useColors();
  const sizes = useSizes();
  const body = (
    <View style={{ padding: 20, paddingBottom: 120, maxWidth: 720, width: '100%', alignSelf: 'center' }}>
      {onBack ? (
        <Pressable accessibilityRole="button" onPress={onBack} style={{ minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }} nativeID="noprint-back">
          <Text style={{ fontFamily: fonts.body, fontSize: sizes.label, color: colors.text }}>‹ もどる</Text>
        </Pressable>
      ) : null}
      {title ? (
        <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: sizes.title, color: colors.text, lineHeight: sizes.title * 1.4, marginBottom: 16 }}>
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
  const colors = useColors();
  const sizes = useSizes();
  return (
    <View
      accessibilityRole="alert"
      style={{ backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.text, borderRadius: sizes.radius, padding: sizes.cardPadding, marginVertical: 12 }}
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
      <Arrow label="‹" a11y="前の日" onPress={() => move(-1)} />
      <T bold style={{ flex: 1, textAlign: 'center' }}>
        {d.getMonth() + 1}月{d.getDate()}日（{wd}）
      </T>
      <Arrow label="›" a11y="次の日" onPress={() => move(1)} disabled={isMax} />
    </View>
  );
}

function Arrow({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: pressed ? colors.primaryTint : colors.surface, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1 })}
    >
      <Text style={{ fontSize: 24, color: colors.text, marginTop: -2 }}>{label}</Text>
    </Pressable>
  );
}
