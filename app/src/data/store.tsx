// 記録の保存（端末内。Web 版ではブラウザ内）。外部には送りません。
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Level3 = 'less' | 'usual' | 'more';

export type Cat = { id: string; name: string };

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
};

const EMPTY: Data = {
  cats: [],
  conditions: [],
  fluids: [],
  meds: [],
  medRecords: [],
  fluidReminders: {},
  customFluidNames: [],
  customMedNames: [],
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
          const parsed = { ...EMPTY, ...(JSON.parse(raw) as Data) };
          setData(parsed);
          setSelectedCatId(parsed.cats[0]?.id);
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
    setData(d);
    setSelectedCatId(d.cats[0]?.id);
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
      maker: '東レ（試作用の仮データ）',
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
