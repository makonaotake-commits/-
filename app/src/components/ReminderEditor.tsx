import React, { useState } from 'react';
import { View } from 'react-native';
import { TEXT, WEEKDAYS } from '../config/labels';
import { Frequency, Reminder, toDateStr } from '../data/store';
import { Button, Choice, Field, Input, Note, T } from './ui';

export const defaultReminder = (): Reminder => ({ enabled: false, times: [], freq: { kind: 'daily' } });

function validTime(t: string) {
  const m = /^(\d{1,2})[:：](\d{2})$/.exec(t.trim().normalize('NFKC'));
  if (!m) return undefined;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return undefined;
  return `${h < 10 ? '0' + h : h}:${m[2]}`;
}

/** リマインダーの時刻と頻度。飼い主さんが自分で決める（初期値の時刻は入れない） */
export function ReminderEditor({ value, onChange }: { value: Reminder; onChange: (r: Reminder) => void }) {
  const [timeText, setTimeText] = useState('');
  const [timeError, setTimeError] = useState(false);
  const kind = value.freq.kind;

  const setFreq = (k?: 'daily' | 'everyN' | 'weekdays') => {
    if (!k) return;
    let f: Frequency;
    if (k === 'daily') f = { kind: 'daily' };
    else if (k === 'everyN') f = { kind: 'everyN', n: 2, start: toDateStr(new Date()) };
    else f = { kind: 'weekdays', days: [] };
    onChange({ ...value, freq: f });
  };

  return (
    <View>
      <Field label="リマインダー">
        <Choice
          options={[
            { v: 'on', label: '使う' },
            { v: 'off', label: '使わない' },
          ]}
          value={value.enabled ? 'on' : 'off'}
          onChange={(v) => v && onChange({ ...value, enabled: v === 'on' })}
        />
      </Field>
      {value.enabled ? (
        <>
          <Field label="時刻" hint="例：8:00、20:30">
            {value.times.map((t) => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <T bold>{t}</T>
                <Button kind="quiet" label="この時刻を消す" onPress={() => onChange({ ...value, times: value.times.filter((x) => x !== t) })} />
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Input value={timeText} onChangeText={(t) => { setTimeText(t); setTimeError(false); }} placeholder="8:00" style={{ flex: 1 }} />
              <Button
                kind="secondary"
                label="時刻を足す"
                onPress={() => {
                  const t = validTime(timeText);
                  if (!t) return setTimeError(true);
                  if (!value.times.includes(t)) onChange({ ...value, times: [...value.times, t].sort() });
                  setTimeText('');
                }}
              />
            </View>
            {timeError ? <T small>「8:00」のように、時と分を「:」で区切って入力してください。</T> : null}
          </Field>
          <Field label="くり返し">
            <Choice
              options={[
                { v: 'daily', label: '毎日' },
                { v: 'everyN', label: '◯日おき' },
                { v: 'weekdays', label: '曜日を選ぶ' },
              ]}
              value={kind}
              onChange={setFreq}
            />
            {value.freq.kind === 'everyN' ? (
              <View style={{ marginTop: 12 }}>
                <Choice
                  options={[2, 3, 4, 5, 7].map((n) => ({ v: String(n), label: n === 2 ? '1日おき（2日ごと）' : `${n}日ごと` }))}
                  value={String(value.freq.n)}
                  onChange={(v) => v && value.freq.kind === 'everyN' && onChange({ ...value, freq: { ...value.freq, n: Number(v) } })}
                />
                <T small sub>今日から数えます。</T>
              </View>
            ) : null}
            {value.freq.kind === 'weekdays' ? (
              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {WEEKDAYS.map((w, i) => {
                  const days = value.freq.kind === 'weekdays' ? value.freq.days : [];
                  const on = days.includes(i);
                  return (
                    <Button
                      key={w}
                      kind={on ? 'primary' : 'secondary'}
                      label={on ? `● ${w}` : w}
                      style={{ minWidth: 64 }}
                      onPress={() => onChange({ ...value, freq: { kind: 'weekdays', days: on ? days.filter((d) => d !== i) : [...days, i].sort() } })}
                    />
                  );
                })}
              </View>
            ) : null}
          </Field>
          <Note>{TEXT.webReminderNote}</Note>
        </>
      ) : null}
    </View>
  );
}
