// 記録のお知らせ（F-27・自分で決めた条件）。条件は飼い主さんが作る。アプリ側の条件・閾値・初期値は持たない。
// 判定は、体調の記録を保存したときに、その記録だけを端末の中で照らす。外部・分析には送らない。
// 「前回と同じ」でコピーして直さずに保存した項目も照らす（ロシアン 2026-11-15 回答1）。
import { APPETITE, ENERGY, STOOL_STATE, URINE_CLUMP, WATER } from '../config/labels';
import type { Cat, ConditionRecord } from './store';

export type NoticeItem = 'appetite' | 'water' | 'urineCount' | 'urineClump' | 'vomitCount' | 'stoolCount' | 'stoolState' | 'energy' | 'weightKg';

export type NoticeCondition = {
  id: string;
  catId: string;
  item: NoticeItem;
  /** level：その段階が記録されたとき／recorded：回数が記録されたとき（1回以上）／gte・lte：入れた値以上・以下 */
  op: 'level' | 'recorded' | 'gte' | 'lte';
  level?: string;
  value?: number;
  createdAt: string; // YYYY-MM-DD
};

export type Notices = { enabled: boolean; conditions: NoticeCondition[] };

/** 記録画面と同じ並び */
export const NOTICE_ITEMS: { v: NoticeItem; label: string; kind: 'level' | 'count' | 'number'; options?: readonly { v: string; label: string }[] }[] = [
  { v: 'appetite', label: '食べた量', kind: 'level', options: APPETITE },
  { v: 'water', label: '飲水', kind: 'level', options: WATER },
  { v: 'urineCount', label: '尿の回数', kind: 'count' },
  { v: 'urineClump', label: '尿の塊の大きさ', kind: 'level', options: URINE_CLUMP },
  { v: 'vomitCount', label: '嘔吐の回数', kind: 'count' },
  { v: 'stoolCount', label: '便の回数', kind: 'count' },
  { v: 'stoolState', label: '便の状態', kind: 'level', options: STOOL_STATE },
  { v: 'energy', label: '元気さ', kind: 'level', options: ENERGY },
  { v: 'weightKg', label: '体重', kind: 'number' },
];

export const itemLabel = (i: NoticeItem) => NOTICE_ITEMS.find((x) => x.v === i)?.label ?? '';

/** 条件の説明（一覧に出す。事実だけ） */
export function describeCondition(c: NoticeCondition) {
  const it = NOTICE_ITEMS.find((x) => x.v === c.item);
  if (c.op === 'level') return `${it?.label}：「${it?.options?.find((o) => o.v === c.level)?.label ?? ''}」が記録されたとき`;
  if (c.op === 'recorded') return `${it?.label}：1回以上が記録されたとき`;
  return `${it?.label}：${c.value?.toFixed(2)} kg ${c.op === 'gte' ? '以上' : '以下'}の記録があったとき`;
}

export function conditionActive(c: NoticeCondition, cats: Cat[]) {
  const cat = cats.find((x) => x.id === c.catId);
  return !!cat && !cat.archived && !cat.paused;
}

function matches(c: NoticeCondition, r: ConditionRecord) {
  const v = r[c.item];
  if (v === undefined) return false;
  if (c.op === 'level') return v === c.level;
  if (c.op === 'recorded') return typeof v === 'number' && v >= 1;
  if (typeof v !== 'number' || c.value === undefined) return false;
  return c.op === 'gte' ? v >= c.value : v <= c.value;
}

/** 保存する記録にあてはまる条件の id。機能がオフ、条件がない、お休み中・外した猫のときは何も返さない */
export function evaluateNotices(n: Notices | undefined, cats: Cat[], r: ConditionRecord): string[] {
  if (!n?.enabled) return [];
  return n.conditions.filter((c) => c.catId === r.catId && conditionActive(c, cats) && matches(c, r)).map((c) => c.id);
}

/** 画面に出すお知らせの文言（値・増減・評価語は入れない） */
export function noticeText(catName: string, items: NoticeItem[]) {
  const labels = Array.from(new Set(items.map(itemLabel)));
  return `設定した条件にあてはまる記録がありました（${catName}・${labels.join('・')}）`;
}

export const NOTICE_TEXT = {
  intro: 'あなたが決めた条件にあてはまる記録があったときに、そのことをお知らせします。判定や診断はしません。',
  always: 'お知らせは記録されたときにだけ出ます。記録がない日や、条件にない変化では出ません。心配なときは、お知らせを待たずにかかりつけの動物病院へ',
  consult: '条件は、かかりつけの先生と相談して決めることもできます。',
  valueHint: 'かかりつけの先生と相談して決めた値を入れる欄です',
};

/** 画面に出すお知らせの項目（機能がオフ、条件が消された、お休み中・外した猫のときは出さない） */
export function hitItems(n: Notices | undefined, cats: Cat[], r: ConditionRecord): NoticeItem[] {
  if (!n?.enabled || !r.noticeHits?.length) return [];
  return n.conditions.filter((c) => r.noticeHits!.includes(c.id) && conditionActive(c, cats)).map((c) => c.item);
}
