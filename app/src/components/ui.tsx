import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { Colors, fonts, Sizes } from '../config/theme';
import { useColors, useSizes } from '../config/useTheme';
import { Cat, useStore } from '../data/store';

function makeStyles(c: Colors, sizes: Sizes) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: sizes.radius,
      padding: sizes.cardPadding,
      marginBottom: sizes.gap,
      borderWidth: 1,
      borderColor: c.border,
    },
    btn: {
      minHeight: sizes.touch,
      borderRadius: sizes.radius,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 6,
    },
    btnPrimary: { backgroundColor: c.primary },
    btnSecondary: { backgroundColor: c.surface, borderWidth: 2, borderColor: c.borderStrong },
    btnQuiet: { minHeight: 44, paddingHorizontal: 4 },
    btnText: { fontFamily: fonts.bodyBold, color: c.text, fontSize: sizes.label },
    choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      minHeight: 52,
      paddingHorizontal: 18,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: c.borderStrong,
      backgroundColor: c.surface,
      justifyContent: 'center',
    },
    chipOn: { borderColor: c.text, backgroundColor: c.primaryTint },
    chipText: { fontFamily: fonts.body, color: c.text, fontSize: sizes.label },
    chipTextOn: { fontFamily: fonts.bodyBold },
    catTab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: sizes.touch,
      paddingHorizontal: 14,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: c.borderStrong,
      backgroundColor: c.surface,
    },
    label: { fontFamily: fonts.heading, color: c.text, fontSize: sizes.label, marginBottom: 8 },
    input: {
      fontFamily: fonts.body,
      fontSize: sizes.body,
      color: c.text,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.borderStrong,
      borderRadius: sizes.radiusSmall,
      minHeight: sizes.touch,
      paddingHorizontal: 14,
    },
    counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    round: {
      width: sizes.touch,
      height: sizes.touch,
      borderRadius: sizes.touch / 2,
      borderWidth: 2,
      borderColor: c.borderStrong,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roundText: { fontSize: Math.round(sizes.body * 1.45), color: c.text },
    counterValue: { fontFamily: fonts.body, fontSize: Math.round(sizes.body * 1.22), color: c.text, minWidth: 80, textAlign: 'center' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primaryTint,
      borderWidth: 2,
      borderColor: c.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontFamily: fonts.heading, fontSize: 20, color: c.text },
    note: { backgroundColor: c.accentTint, borderRadius: sizes.radiusSmall, padding: 14, marginBottom: 16 },
  });
}

/** 今の明暗に合わせた共通スタイル */
export function useStyles() {
  const c = useColors();
  const z = useSizes();
  return useMemo(() => ({ c, z, s: makeStyles(c, z) }), [c, z]);
}

export function T({ children, style, sub, small, bold }: { children: React.ReactNode; style?: TextStyle; sub?: boolean; small?: boolean; bold?: boolean }) {
  const c = useColors();
  const sizes = useSizes();
  const size = small ? sizes.small : sizes.body;
  return (
    <Text style={[{ fontFamily: bold ? fonts.bodyBold : fonts.body, color: sub ? c.textSub : c.text, fontSize: size, lineHeight: size * 1.6 }, style]}>
      {children}
    </Text>
  );
}

export function H({ children, level = 2 }: { children: React.ReactNode; level?: 1 | 2 }) {
  const c = useColors();
  const sizes = useSizes();
  const size = level === 1 ? sizes.title : sizes.heading;
  return (
    <Text
      accessibilityRole="header"
      style={{ fontFamily: fonts.heading, color: c.text, fontSize: size, lineHeight: size * 1.45, marginTop: level === 1 ? 0 : 8, marginBottom: 8 }}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { s } = useStyles();
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'quiet';
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const { c, s } = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        kind === 'primary' && s.btnPrimary,
        kind === 'secondary' && s.btnSecondary,
        kind === 'quiet' && s.btnQuiet,
        pressed && (kind === 'primary' ? { opacity: 0.85 } : { backgroundColor: c.primaryTint }),
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text style={[s.btnText, kind === 'primary' && { color: c.onPrimary }, kind === 'quiet' && { fontFamily: fonts.body }]}>{label}</Text>
    </Pressable>
  );
}

/** 選択肢。もう一度押すと選択を外せる（未入力に戻せる） */
export function Choice<V extends string>({
  options,
  value,
  onChange,
  copied,
}: {
  options: readonly { v: V; label: string }[];
  value?: V;
  onChange: (v?: V) => void;
  copied?: boolean;
}) {
  const { s } = useStyles();
  return (
    <View style={s.choiceWrap}>
      {options.map((o) => {
        const on = value === o.v;
        return (
          <Pressable
            key={o.v}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(on ? undefined : o.v)}
            style={[s.chip, on && s.chipOn, on && copied && { borderStyle: 'dashed' }]}
          >
            <Text style={[s.chipText, on && s.chipTextOn]}>
              {on ? '● ' : ''}
              {o.label}
              {on && copied ? '（前回の内容）' : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 回数の入力。未入力（—）と 0 を区別する */
export function Counter({ value, onChange, unit = '回' }: { value?: number; onChange: (v?: number) => void; unit?: string }) {
  const { s } = useStyles();
  return (
    <View>
      <View style={s.counterRow}>
        <Pressable accessibilityLabel="1つ減らす" onPress={() => onChange(Math.max(0, (value ?? 0) - 1))} style={s.round}>
          <Text style={s.roundText}>−</Text>
        </Pressable>
        <Text style={s.counterValue}>{value === undefined ? '—' : `${value} ${unit}`}</Text>
        <Pressable accessibilityLabel="1つ増やす" onPress={() => onChange((value ?? 0) + 1)} style={s.round}>
          <Text style={s.roundText}>＋</Text>
        </Pressable>
      </View>
      {value === undefined ? (
        <Button kind="quiet" label={`0${unit}として記録する`} onPress={() => onChange(0)} style={{ alignSelf: 'flex-start' }} />
      ) : (
        <Button kind="quiet" label="未入力に戻す" onPress={() => onChange(undefined)} style={{ alignSelf: 'flex-start' }} />
      )}
    </View>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  const { s } = useStyles();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={s.label}>{label}</Text>
      {hint ? (
        <T small sub style={{ marginBottom: 6 }}>
          {hint}
        </T>
      ) : null}
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  const { c, s } = useStyles();
  return <TextInput placeholderTextColor={c.textSub} {...props} style={[s.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }, props.style]} />;
}

/** 記録対象の猫を名前つきで常に表示する（取り違え防止） */
export function CatBadge({ cat }: { cat?: Cat }) {
  const { s } = useStyles();
  if (!cat) return null;
  return (
    <View style={s.badge}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{cat.name.slice(0, 1)}</Text>
      </View>
      <T bold>{cat.name}ちゃんの記録</T>
    </View>
  );
}

export function CatSwitcher() {
  const { data, selectedCatId, selectCat } = useStore();
  const { s } = useStyles();
  const cats = data.cats.filter((c) => !c.archived);
  if (cats.length === 0) return null;
  return (
    <View style={s.choiceWrap}>
      {cats.map((cat) => {
        const on = cat.id === selectedCatId;
        return (
          <Pressable
            key={cat.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => selectCat(cat.id)}
            style={[s.catTab, on && s.chipOn]}
          >
            <View style={[s.avatar, { width: 36, height: 36 }]}>
              <Text style={[s.avatarText, { fontSize: 16 }]}>{cat.name.slice(0, 1)}</Text>
            </View>
            <Text style={[s.chipText, on && s.chipTextOn]}>
              {cat.name}
              {cat.paused ? '（お休み中）' : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function useCurrentCat() {
  const { data, selectedCatId } = useStore();
  return data.cats.find((c) => c.id === selectedCatId) ?? data.cats.find((c) => !c.archived);
}

export function Note({ children }: { children: React.ReactNode }) {
  const { s } = useStyles();
  return (
    <View style={s.note}>
      <T small>{children}</T>
    </View>
  );
}
