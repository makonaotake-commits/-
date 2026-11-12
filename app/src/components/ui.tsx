import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { colors, fonts, sizes } from '../config/theme';
import { Cat, useStore } from '../data/store';

export function T({ children, style, sub, small, bold }: { children: React.ReactNode; style?: TextStyle; sub?: boolean; small?: boolean; bold?: boolean }) {
  return (
    <Text
      style={[
        { fontFamily: fonts.body, color: sub ? colors.textSub : colors.text, fontSize: small ? sizes.small : sizes.body, lineHeight: (small ? sizes.small : sizes.body) * 1.6 },
        bold && { fontWeight: '700' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function H({ children, level = 2 }: { children: React.ReactNode; level?: 1 | 2 }) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: fonts.heading,
        color: colors.text,
        fontWeight: '700',
        fontSize: level === 1 ? sizes.title : sizes.heading,
        marginTop: level === 1 ? 0 : 8,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
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
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[s.btnText, kind === 'quiet' && { fontWeight: '400', textDecorationLine: 'underline' }]}>{label}</Text>
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
            style={[s.chip, on && s.chipOn]}
          >
            <Text style={[s.chipText, on && { fontWeight: '700' }]}>
              {on ? '● ' : ''}
              {o.label}
              {on && copied ? '（コピー）' : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 回数の入力。未入力（—）と 0 を区別する */
export function Counter({ value, onChange, unit = '回' }: { value?: number; onChange: (v?: number) => void; unit?: string }) {
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
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={s.label}>{label}</Text>
      {hint ? <T small sub style={{ marginBottom: 6 }}>{hint}</T> : null}
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textSub} {...props} style={[s.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }, props.style]} />;
}

/** 記録対象の猫を名前つきで常に表示する（取り違え防止） */
export function CatBadge({ cat }: { cat?: Cat }) {
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
  if (data.cats.length === 0) return null;
  return (
    <View style={s.choiceWrap}>
      {data.cats.map((c) => {
        const on = c.id === selectedCatId;
        return (
          <Pressable
            key={c.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => selectCat(c.id)}
            style={[s.catTab, on && s.chipOn]}
          >
            <View style={[s.avatar, { width: 36, height: 36 }]}>
              <Text style={[s.avatarText, { fontSize: 16 }]}>{c.name.slice(0, 1)}</Text>
            </View>
            <Text style={[s.chipText, on && { fontWeight: '700' }]}>{c.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function useCurrentCat() {
  const { data, selectedCatId } = useStore();
  return data.cats.find((c) => c.id === selectedCatId);
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.note}>
      <T small>{children}</T>
    </View>
  );
}

export const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    padding: 20,
    marginBottom: sizes.gap,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    minHeight: sizes.touch,
    borderRadius: sizes.radius,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  btnPrimary: { backgroundColor: colors.sage },
  btnSecondary: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.sage },
  btnQuiet: { minHeight: 44, paddingHorizontal: 4 },
  btnText: { fontFamily: fonts.body, color: colors.text, fontSize: sizes.label, fontWeight: '700' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.text, backgroundColor: colors.sageTint },
  chipText: { fontFamily: fonts.body, color: colors.text, fontSize: sizes.label },
  catTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 14,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { fontFamily: fonts.heading, color: colors.text, fontSize: sizes.label, fontWeight: '700', marginBottom: 8 },
  input: {
    fontFamily: fonts.body,
    fontSize: sizes.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    minHeight: sizes.touch,
    paddingHorizontal: 14,
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.sage,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundText: { fontSize: 26, color: colors.text },
  counterValue: { fontFamily: fonts.body, fontSize: 22, color: colors.text, minWidth: 80, textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.peachTint, borderWidth: 2, borderColor: colors.peach, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heading, fontSize: 20, color: colors.text, fontWeight: '700' },
  note: { backgroundColor: colors.peachTint, borderRadius: 12, padding: 14, marginBottom: 16 },
});
