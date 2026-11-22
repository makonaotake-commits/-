// 丸を1つ押して答える入力（体調の記録のカードで使う）。
// 評価の色は使わない。選んだ丸だけを塗る。もう一度押すと未入力に戻る。
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { fonts } from '../config/theme';
import { useColors, useSizes } from '../config/useTheme';
import { Icon, IconName } from './Icons';
import { Counter, T } from './ui';

function Bubble({ label, selected, copied, onPress, a11y, size, flex }: { label: string; selected: boolean; copied?: boolean; onPress: () => void; a11y: string; size: number; flex?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={a11y}
      onPress={onPress}
      style={{
        ...(flex ? { flex: 1, aspectRatio: 1, maxWidth: size } : { width: size, height: size }),
        borderRadius: size,
        borderWidth: 2,
        borderStyle: selected && copied ? 'dashed' : 'solid',
        borderColor: selected ? c.text : c.borderStrong,
        backgroundColor: selected ? c.primary : c.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: Math.round(size * 0.36), color: selected ? c.onPrimary : c.text }}>{label}</Text>
    </Pressable>
  );
}

/** 段階の質問：丸を横に並べ、下にそれぞれの言葉を出す。番号は付けない（点数・評価に見えないように。ロシアン 2026-11-16） */
/** 質問の見出し：アイコン＋短い言葉 */
export function QuestionTitle({ icon, title, copied }: { icon?: IconName; title: string; copied?: boolean }) {
  const c = useColors();
  const z = useSizes();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      {icon ? <Icon name={icon} size={28} /> : null}
      <Text style={{ fontFamily: fonts.heading, fontSize: z.label, color: c.text }}>{title}</Text>
      {copied ? <T small sub>前回</T> : null}
    </View>
  );
}

/** 絵のボタン（量の絵・しぐさの絵）。選ぶと地の色と枠で示す。前回の内容のときは点線 */
function PictureTile({ children, selected, copied, onPress, a11y }: { children: React.ReactNode; selected: boolean; copied?: boolean; onPress: () => void; a11y: string }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={a11y}
      onPress={onPress}
      style={{
        width: '100%',
        aspectRatio: 1,
        maxWidth: 88,
        borderRadius: 18,
        borderWidth: selected ? 3 : 2,
        borderStyle: selected && copied ? 'dashed' : 'solid',
        borderColor: selected ? c.text : c.border,
        backgroundColor: selected ? c.primaryTint : c.surface,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {children}
    </Pressable>
  );
}

export function ScaleQuestion<V extends string>({
  question,
  options,
  value,
  onChange,
  copied,
  icon,
  pictures,
}: {
  question: string;
  options: readonly { v: V; label: string }[];
  value?: V;
  onChange: (v?: V) => void;
  copied?: boolean;
  icon?: IconName;
  /** 選択肢ごとの絵（あれば丸の代わりに絵のボタンにする） */
  pictures?: Partial<Record<V, React.ReactNode>>;
}) {
  const z = useSizes();
  const size = Math.max(52, Math.round(z.touch * 0.95));
  return (
    <View style={{ marginBottom: 24 }}>
      <QuestionTitle icon={icon} title={question} copied={value !== undefined && copied} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        {options.map((o) => (
          <View key={o.v} style={{ flex: 1, alignItems: 'center' }}>
            {pictures?.[o.v] ? (
              <PictureTile selected={value === o.v} copied={copied} a11y={o.label} onPress={() => onChange(value === o.v ? undefined : o.v)}>
                {pictures[o.v]}
              </PictureTile>
            ) : (
              <Bubble label={value === o.v ? '●' : ''} selected={value === o.v} copied={copied} size={size} a11y={o.label} onPress={() => onChange(value === o.v ? undefined : o.v)} />
            )}
            <T small style={{ textAlign: 'center', marginTop: 6 }}>
              {o.label}
            </T>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 回数の質問：0〜5 の丸から選ぶ。6回以上は丸の「6+」を押してから＋で増やす */
export function CountQuestion({
  question,
  value,
  onChange,
  copied,
  children,
  icon,
}: {
  icon?: IconName;
  question: string;
  value?: number;
  onChange: (v?: number) => void;
  copied?: boolean;
  children?: React.ReactNode;
}) {
  const z = useSizes();
  const size = Math.max(48, Math.round(z.touch * 0.85));
  const nums = [0, 1, 2, 3, 4, 5];
  const many = value !== undefined && value >= 6;
  return (
    <View style={{ marginBottom: 24 }}>
      <QuestionTitle icon={icon} title={question} copied={value !== undefined && copied} />
      {/* 7つの丸を1行に収める（幅に合わせて縮む） */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {nums.map((n) => (
          <Bubble key={n} flex label={String(n)} selected={value === n} copied={copied} size={size} a11y={`${n}回`} onPress={() => onChange(value === n ? undefined : n)} />
        ))}
        <Bubble flex label="6+" selected={many} copied={copied} size={size} a11y="6回以上" onPress={() => onChange(many ? undefined : 6)} />
      </View>
      {many ? (
        <View style={{ marginTop: 8 }}>
          <Counter value={value} onChange={(v) => onChange(v === undefined || v < 6 ? v : v)} />
        </View>
      ) : (
        null
      )}
      {children}
    </View>
  );
}
