import React, { useState } from 'react';
import { View } from 'react-native';
import { CalendarLeaf, FUR_OPTIONS, GuideCat, NoticeMark } from '../components/Marks';
import { Screen } from '../components/Screen';
import { Button, Card, Choice, Field, H, Note, T } from '../components/ui';
import { TEXT } from '../config/labels';
import { LICENSES } from '../data/licenses';
import { Settings, useStore } from '../data/store';

export function SettingsScreen() {
  const { data, update } = useStore();
  const st = data.settings;
  const [openLicense, setOpenLicense] = useState<string>();
  const set = (patch: Partial<Settings>) => update((x) => ({ ...x, settings: { ...x.settings, ...patch } }));

  return (
    <Screen title="設定">
      <H>見やすさ</H>
      <Card>
        <Field label="表示の明るさ">
          <Choice
            options={[
              { v: 'system', label: '端末に合わせる' },
              { v: 'light', label: '明るい表示' },
              { v: 'dark', label: '暗い表示' },
            ]}
            value={st.appearance}
            onChange={(v) => v && set({ appearance: v })}
          />
        </Field>
        <Field label="演出を控えめにする" hint="オンにすると、ホームの絵の季節・時間帯・しぐさの切りかえと、記録したときの動きを止めて、静かな絵だけにします。">
          <Choice
            options={[
              { v: 'off', label: 'オフ' },
              { v: 'on', label: 'オン（控えめにする）' },
            ]}
            value={st.calmMotion ? 'on' : 'off'}
            onChange={(v) => v && set({ calmMotion: v === 'on' })}
          />
        </Field>
        <Field label="案内役の猫の毛色" hint="いつでも変えられます。初期値は「しろ」です。">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            <GuideCat fur={st.guideFur} size={72} />
          </View>
          <Choice options={FUR_OPTIONS} value={st.guideFur} onChange={(v) => v && set({ guideFur: v })} />
          {st.guideFur !== 'white' ? <Button kind="quiet" label="初期値（しろ）に戻す" onPress={() => set({ guideFur: 'white' })} style={{ alignSelf: 'flex-start' }} /> : null}
        </Field>
      </Card>

      <H>目印の見本（試作用）</H>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <NoticeMark />
          <T>記録のお知らせの目印（しおり）</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CalendarLeaf />
          <T>記録した日の葉っぱ（カレンダーの中だけ）</T>
        </View>
        <T small sub style={{ marginTop: 8 }}>記録のお知らせとカレンダーは、まだ試作に入っていません。形と色の確認用です。</T>
      </Card>

      <Note>{TEXT.emergency}</Note>

      <H>ライセンス</H>
      <Card>
        <T small sub>このアプリは、次のフォントを SIL Open Font License 1.1 のもとで使っています。</T>
        {LICENSES.map((l) => (
          <View key={l.name}>
            <Button kind="secondary" label={openLicense === l.name ? `${l.name}（閉じる）` : l.name} onPress={() => setOpenLicense(openLicense === l.name ? undefined : l.name)} />
            {openLicense === l.name ? <T small>{l.text}</T> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
