// 記録の保存（端末内。Web 版ではブラウザ内）。外部には送りません。
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Notices } from './notices';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Level3 = 'less' | 'usual' | 'more';

export type Cat = {
  id: string;
  name: string;
  birthYear?: string;
  memo?: string;
  /** お休み（F-10）：この猫の通知をすべて止める。until がなければ「再開するまで」。期間が過ぎても自動では再開しない */
  paused?: { since: string; until?: string; askedAfterEnd?: boolean };
  /** 一覧から外した（F-10）：ホームと記録の対象から外す。記録は残る */
  archived?: boolean;
  /** 次の通院日（F-13）。1つだけ。通知はしない */
  nextVisit?: string;
};

/** お休み中か（期間を指定していても、期間が過ぎたあとも、飼い主さんが再開するまではお休みのまま） */
export function isPaused(c?: Cat) {
  return !!c?.paused;
}

export type ConditionRecord = {
  id: string;
  catId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  appetite?: Level3 | 'none';
  water?: Level3;
  waterMl?: number;
  urineCount?: number;
  urineClump?: 'small' | 'usual' | 'large';
  vomitCount?: number;
  stoolCount?: number;
  stoolState?: 'hard' | 'normal' | 'soft';
  energy?: Level3;
  weightKg?: number;
  /** 「前回と同じ」でコピーして、直さずに保存した項目 */
  copiedFields?: string[];
  memo?: string;
  /** 記録のお知らせ（F-27）：保存したときにあてはまった条件の id */
  noticeHits?: string[];
};

export type FluidRecord = {
  id: string;
  catId: string;
  date: string;
  time: string;
  ml?: number;
  site?: string;
  side?: string;
  fluidName?: string;
  state?: 'smooth' | 'bitReluctant' | 'stopped';
  memo?: string;
  /** 通知のボタンから記録した（内部の項目。レポートの集計は変えない） */
  viaNotification?: boolean;
};

export type Frequency = { kind: 'daily' } | { kind: 'everyN'; n: number; start: string } | { kind: 'weekdays'; days: number[] };

export type Reminder = { enabled: boolean; times: string[]; freq: Frequency };

export type Medication = {
  id: string;
  catId: string;
  name: string;
  candidateId?: string;
  form?: string;
  maker?: string;
  dose?: string;
  memo?: string;
  /** 自宅で与える薬か、病院での処置（注射など）か */
  kind: 'home' | 'hospital';
  reminder: Reminder;
};

export type MedResult = 'ok' | 'partial' | 'no' | 'spit';

export type MedRecord = {
  id: string;
  catId: string;
  medId: string;
  medName: string;
  date: string;
  /** 病院での処置は日付だけ（時刻なし） */
  time?: string;
  kind: 'home' | 'hospital';
  /** 病院での処置には付けない */
  result?: MedResult;
  memo?: string;
  /** 通知のボタンから記録した（内部の項目。レポートの集計は変えない） */
  viaNotification?: boolean;
};

export type Data = {
  cats: Cat[];
  conditions: ConditionRecord[];
  fluids: FluidRecord[];
  meds: Medication[];
  medRecords: MedRecord[];
  fluidReminders: Record<string, Reminder>; // catId → 補液のリマインダー
  customFluidNames: string[];
  customMedNames: string[];
  settings: Settings;
  usage: Usage;
  /** 記録のお知らせ（F-27）。初期値オフ・条件なし */
  notices: Notices;
};

export type FurColor = 'white' | 'tabby' | 'black' | 'calico' | 'brown' | 'gray';

export type Settings = {
  /** 表示の明るさ。初期値は端末の設定に合わせる */
  appearance: 'system' | 'light' | 'dark';
  /** 演出を控えめにする（動きを止め、静かな絵だけにする） */
  calmMotion: boolean;
  /** 案内役の毛色。初期値「しろ」 */
  guideFur: FurColor;
  /** 文字サイズ（F-11） */
  textSize: 'normal' | 'large' | 'xlarge';
  /** 夜間に通知を鳴らさない時間帯（F-11） */
  quietHours: { enabled: boolean; start: string; end: string };
  /** 通知の内容を隠す（F-24） */
  hideNotificationContent: boolean;
  /** 使われ方の集計を送る（Q-27：初期値オン。いまは送る仕組みが入っていない） */
  analytics: boolean;
  /** はじめに（F-01）を見て同意したか */
  onboarded: boolean;
  /** 体調の記録を前回の内容の下書きから始める（F-33。初期値オン） */
  draftFromPrevious: boolean;
  /** 今日の記録のお知らせ（F-31。初期値オフ・確定 Q-35） */
  dailyNotice: { enabled: boolean; time: string };
  /** F-31 を使えることを、ホームで1回だけ案内したか */
  dailyNoticeIntroShown: boolean;
  /** 予定のお知らせ（F-32）：通院日の前日 */
  visitNotice: { enabled: boolean; time: string };
};

export const DEFAULT_SETTINGS: Settings = {
  appearance: 'system',
  calmMotion: false,
  guideFur: 'white',
  textSize: 'normal',
  quietHours: { enabled: false, start: '22:00', end: '07:00' },
  hideNotificationContent: false,
  analytics: true,
  onboarded: false,
  draftFromPrevious: true,
  dailyNotice: { enabled: false, time: '21:00' }, // 時刻は仮
  dailyNoticeIntroShown: false,
  visitNotice: { enabled: true, time: '19:00' }, // 初期値・時刻は仮
};

/** 利用のまとめ（F-28）用に、端末内で数える件数 */
export type Usage = { reportOpens: string[] /* 開いた日時（ISO） */ };

const EMPTY: Data = {
  cats: [],
  conditions: [],
  fluids: [],
  meds: [],
  medRecords: [],
  fluidReminders: {},
  customFluidNames: [],
  customMedNames: [],
  settings: DEFAULT_SETTINGS,
  usage: { reportOpens: [] },
  notices: { enabled: false, conditions: [] },
};

const KEY = 'nyan-kidney-prototype:v1';

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function pad(n: number) {
  return n < 10 ? '0' + n : String(n);
}
export function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function nowParts() {
  const d = new Date();
  return { date: toDateStr(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
export function shortDate(date: string) {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

type Ctx = {
  data: Data;
  loaded: boolean;
  saveFailed: boolean;
  selectedCatId?: string;
  selectCat: (id: string) => void;
  update: (fn: (d: Data) => Data) => void;
  replaceAll: (d: Data) => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>();
  const first = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Data>;
          const parsed = { ...EMPTY, ...saved, settings: { ...DEFAULT_SETTINGS, ...(saved.settings ?? {}) }, usage: { ...EMPTY.usage, ...(saved.usage ?? {}) }, notices: saved.notices ?? EMPTY.notices };
          setData(parsed);
          setSelectedCatId(parsed.cats.find((c) => !c.archived)?.id);
        }
      })
      .catch(() => setSaveFailed(true))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (first.current) {
      first.current = false;
      return;
    }
    AsyncStorage.setItem(KEY, JSON.stringify(data))
      .then(() => setSaveFailed(false))
      .catch(() => setSaveFailed(true));
  }, [data, loaded]);

  const update = useCallback((fn: (d: Data) => Data) => setData((d) => fn(d)), []);
  const replaceAll = useCallback((d: Data) => {
    // 表示の設定は、記録の入れ替え・削除のあとも残す
    setData((cur) => ({ ...d, settings: cur.settings, usage: cur.usage, notices: d === EMPTY ? EMPTY.notices : cur.notices }));
    setSelectedCatId(d.cats.find((c) => !c.archived)?.id);
  }, []);

  const value = useMemo(
    () => ({ data, loaded, saveFailed, selectedCatId, selectCat: setSelectedCatId, update, replaceAll }),
    [data, loaded, saveFailed, selectedCatId, update, replaceAll],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('StoreProvider がありません');
  return c;
}

export const emptyData = EMPTY;

/** その日がリマインダーの対象日か */
export function isReminderDay(r: Reminder, date: string): boolean {
  if (!r.enabled || r.times.length === 0) return false;
  const d = new Date(date + 'T00:00:00');
  if (r.freq.kind === 'daily') return true;
  if (r.freq.kind === 'weekdays') return r.freq.days.includes(d.getDay());
  const start = new Date(r.freq.start + 'T00:00:00');
  const diff = Math.round((d.getTime() - start.getTime()) / 86400000);
  return diff >= 0 && diff % Math.max(1, r.freq.n) === 0;
}

/** 試作を触ってもらうためのサンプルデータ（架空の猫） */
export function sampleData(): Data {
  const cats: Cat[] = [
    { id: 'c1', name: 'むぎ' },
    { id: 'c2', name: 'こはく' },
  ];
  const conditions: ConditionRecord[] = [];
  const fluids: FluidRecord[] = [];
  const medRecords: MedRecord[] = [];
  const meds: Medication[] = [
    {
      id: 'm1',
      catId: 'c1',
      name: 'ラプロス',
      candidateId: 'rapros',
      form: '錠剤',
      maker: '東レ株式会社',
      dose: '1錠',
      kind: 'home',
      reminder: { enabled: true, times: ['08:00', '20:00'], freq: { kind: 'daily' } },
    },
    {
      id: 'm2',
      catId: 'c1',
      name: '白い粉薬（ごはんに混ぜる）',
      dose: '1包',
      kind: 'home',
      reminder: { enabled: true, times: ['08:00'], freq: { kind: 'daily' } },
    },
  ];
  meds.push({ id: 'm3', catId: 'c1', name: 'マロピタット注', candidateId: 'maropitat_inj', form: '注射', maker: 'リケンベッツファーマ株式会社', kind: 'hospital', reminder: { enabled: false, times: [], freq: { kind: 'daily' } } });
  const today = new Date();
  const visit = new Date(today);
  visit.setDate(visit.getDate() + 6);
  cats[0].nextVisit = toDateStr(visit);
  const weights = [3.62, 3.6, undefined, 3.58, 3.6, undefined, 3.55, 3.57, undefined, undefined, 3.54, 3.56, 3.55, 3.53];
  for (let i = 13; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = toDateStr(d);
    if (i === 9 || i === 5) continue; // 記録のない日
    const w = weights[13 - i];
    conditions.push({
      id: newId(),
      catId: 'c1',
      date,
      time: '21:00',
      appetite: i % 4 === 0 ? 'less' : 'usual',
      water: 'usual',
      urineCount: i === 7 ? undefined : 2 + (i % 2),
      vomitCount: i === 6 ? 1 : i === 7 ? undefined : 0,
      stoolCount: i % 3 === 0 ? 0 : 1,
      energy: 'usual',
      weightKg: w,
      copiedFields: i === 4 ? ['appetite', 'water', 'energy'] : undefined,
      memo: i === 6 ? '夕方に一度吐いた（毛玉まじり）' : undefined,
    });
    if (i === 6) medRecords.push({ id: newId(), catId: 'c1', medId: 'm3', medName: 'マロピタット注', date, kind: 'hospital', memo: '通院時に注射' });
    if (i % 2 === 1) {
      fluids.push({
        id: newId(),
        catId: 'c1',
        date,
        time: '20:30',
        ml: i > 6 ? 100 : 120,
        site: '背中',
        side: i % 4 === 1 ? '右' : '左',
        fluidName: '乳酸リンゲル液',
        state: i === 3 ? 'bitReluctant' : 'smooth',
      });
    }
    medRecords.push({ id: newId(), catId: 'c1', medId: 'm1', medName: 'ラプロス', date, time: '08:10', kind: 'home', result: 'ok' });
    if (i !== 8)
      medRecords.push({
        id: newId(),
        catId: 'c1',
        medId: 'm1',
        medName: 'ラプロス',
        date,
        time: '20:05',
        kind: 'home',
        result: i === 6 ? 'spit' : 'ok',
      });
    medRecords.push({
      id: newId(),
      catId: 'c1',
      medId: 'm2',
      medName: '白い粉薬（ごはんに混ぜる）',
      date,
      time: '08:15',
      kind: 'home',
      result: i === 10 ? 'partial' : 'ok',
    });
  }
  return {
    ...EMPTY,
    cats,
    conditions,
    fluids,
    meds,
    medRecords,
    fluidReminders: { c1: { enabled: true, times: ['20:30'], freq: { kind: 'everyN', n: 2, start: toDateStr(today) } } },
  };
}
