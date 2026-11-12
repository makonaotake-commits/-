// 薬の候補リスト（仮のデータ）
// 出典：docs/requirements/drug_list_draft.md（案 v0.2・draft）。
// v0.2 で「要確認」の行（verified: false）は、試作の仮データとしてだけ使います。製品版には確認が済むまで入れません。
// ⚠️ 獣医師の確認・出典の利用条件の確認・ロシアンのレビューが済んでいない試作用のデータです。
// 表示するのは「名前・剤形・メーカー名」だけ。効能・用途・区分は持たせません（F-26）。

export type DrugCandidate = {
  id: string;
  /** 画面に出す名前（検索しやすいよう半角数字にそろえる） */
  name: string;
  /** 検索で引っかける別名（一般名・製品名） */
  aliases: string[];
  form: string;
  maker: string; // 未確認のものは「確認中」
  /** 選んだときの記録の種類の初期値（注射は「病院での処置」） */
  kind: 'home' | 'hospital';
  /** 一次情報で確認済みか（v0.2 の「一次確認：済」）。false は試作用の仮データ */
  verified: boolean;
};

const UNKNOWN = '確認中';
const BI = 'ベーリンガーインゲルハイムアニマルヘルスジャパン株式会社';
const RV = 'リケンベッツファーマ株式会社';

export const DRUG_LIST_VERSION = '試作用（2026-11-11 の案 v0.2 をもとに作成。確認前の仮データを含む）';

const h = (id: string, generic: string, brands: string[], form: string): DrugCandidate => ({
  id,
  name: `${generic}（${brands.join('、')}）`,
  aliases: [generic, ...brands],
  form,
  maker: UNKNOWN,
  kind: 'home',
  verified: false,
});

export const DRUG_CANDIDATES: DrugCandidate[] = [
  // 動物用医薬品
  { id: 'covalzin', name: 'コバルジン', aliases: [], form: 'カプセル', maker: 'エランコジャパン（確認中）', kind: 'home', verified: false },
  { id: 'semintra4', name: 'セミントラ 4mg/mL 経口液猫', aliases: ['セミントラ'], form: '経口液', maker: BI, kind: 'home', verified: true },
  { id: 'semintra10', name: 'セミントラ 10mg/mL 経口液猫', aliases: ['セミントラ'], form: '経口液', maker: BI, kind: 'home', verified: true },
  { id: 'fortekor', name: 'フォルテコール', aliases: [], form: '錠剤', maker: UNKNOWN, kind: 'home', verified: false },
  { id: 'maropitat_tab', name: 'マロピタット錠16', aliases: ['マロピタット'], form: '錠剤', maker: RV, kind: 'home', verified: true },
  { id: 'maropitat_inj', name: 'マロピタット注', aliases: ['マロピタット'], form: '注射', maker: RV, kind: 'hospital', verified: true },
  { id: 'cerenia_tab', name: 'セレニア錠', aliases: ['セレニア'], form: '錠剤', maker: UNKNOWN, kind: 'home', verified: false },
  { id: 'cerenia_inj', name: 'セレニア注射液', aliases: ['セレニア'], form: '注射', maker: UNKNOWN, kind: 'hospital', verified: false },
  { id: 'rapros', name: 'ラプロス', aliases: [], form: '錠剤', maker: '東レ（確認中）', kind: 'home', verified: false },
  { id: 'renalzin', name: 'レンジアレン', aliases: [], form: UNKNOWN, maker: UNKNOWN, kind: 'home', verified: false },
  // 人体用医薬品（一般名＋代表的な製品名。v0.2 では全件「要確認」）
  h('kremezin', '球形吸着炭', ['クレメジン'], 'カプセル・細粒'),
  h('amlodipine', 'アムロジピン', ['ノルバスク', 'アムロジン'], '錠剤'),
  h('telmisartan', 'テルミサルタン', ['ミカルディス'], '錠剤'),
  h('benazepril', 'ベナゼプリル', ['チバセン'], '錠剤'),
  h('lanthanum', '炭酸ランタン', ['ホスレノール'], 'チュアブル錠・顆粒'),
  h('ferric_citrate', 'クエン酸第二鉄', ['リオナ'], '錠剤'),
  h('calcium_carbonate', '沈降炭酸カルシウム', ['カルタン'], '錠剤・細粒など'),
  h('sevelamer', 'セベラマー', ['レナジェル', 'フォスブロック'], '錠剤'),
  h('mirtazapine', 'ミルタザピン', ['リフレックス', 'レメロン'], '錠剤'),
  h('famotidine', 'ファモチジン', ['ガスター'], '錠剤・散'),
  h('metoclopramide', 'メトクロプラミド', ['プリンペラン'], '錠剤・シロップ'),
  h('ondansetron', 'オンダンセトロン', ['ゾフラン'], '錠剤'),
  h('k_gluconate', 'グルコン酸カリウム', ['グルコンサンK'], '錠剤・細粒'),
  h('k_citrate', 'クエン酸カリウム・クエン酸ナトリウム', ['ウラリット'], '錠剤・散'),
  h('lactulose', 'ラクツロース', ['モニラック'], 'シロップ'),
];

/** ひらがな→カタカナ、全角英数→半角、大文字小文字をそろえる */
export function normalize(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/\s+/g, '')
    .toLowerCase();
}

/** 2文字以上入力したときだけ候補を返す。並び順は五十音順（機械的な順）。 */
export function searchCandidates<T>(
  query: string,
  items: T[],
  keys: (item: T) => string[],
  label: (item: T) => string,
): T[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  return items
    .filter((it) => keys(it).some((k) => normalize(k).includes(q)))
    .sort((a, b) => label(a).localeCompare(label(b), 'ja'));
}
