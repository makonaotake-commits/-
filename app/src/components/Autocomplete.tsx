import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, fonts, sizes } from '../config/theme';
import { Input, T } from './ui';

/** 2文字以上入力したときだけ候補を出す入力欄。候補にないものもそのまま入力できる */
export function Autocomplete<C>({
  value,
  onChangeText,
  suggestions,
  render,
  onPick,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  suggestions: C[];
  render: (c: C) => { title: string; sub?: string };
  onPick: (c: C) => void;
  placeholder?: string;
}) {
  return (
    <View>
      <Input value={value} onChangeText={onChangeText} placeholder={placeholder} autoCorrect={false} />
      {suggestions.length > 0 ? (
        <View style={{ borderWidth: 2, borderColor: colors.border, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: colors.surface }}>
          <T small sub style={{ paddingHorizontal: 14, paddingTop: 8 }}>
            候補（五十音順）
          </T>
          {suggestions.slice(0, 8).map((c, i) => {
            const r = render(c);
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                onPress={() => onPick(c)}
                style={({ pressed }) => ({ minHeight: 52, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: pressed ? colors.sageTint : colors.surface })}
              >
                <Text style={{ fontFamily: fonts.body, fontSize: sizes.label, color: colors.text }}>{r.title}</Text>
                {r.sub ? <Text style={{ fontFamily: fonts.body, fontSize: sizes.small, color: colors.textSub }}>{r.sub}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
