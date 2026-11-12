// 画面の言葉（仮）。ロシアンのレビュー前の試作用の文言です。
// 選択肢の言葉は F-03 の案（Q-06 で「案でOK」）に合わせています。評価語（良い・悪い）は使いません。

export const APPETITE = [
  { v: 'none', label: '食べなかった' },
  { v: 'less', label: 'いつもより少ない' },
  { v: 'usual', label: 'いつもくらい' },
  { v: 'more', label: 'いつもより多い' },
] as const;

export const WATER = [
  { v: 'less', label: '少ない' },
  { v: 'usual', label: 'いつもくらい' },
  { v: 'more', label: '多い' },
] as const;

export const ENERGY = [
  { v: 'less', label: 'いつもより静か' },
  { v: 'usual', label: 'いつもくらい' },
  { v: 'more', label: 'いつもより活発' },
] as const;

export const URINE_CLUMP = [
  { v: 'small', label: '小さめ' },
  { v: 'usual', label: 'いつもくらい' },
  { v: 'large', label: '大きめ' },
] as const;

export const STOOL_STATE = [
  { v: 'hard', label: 'かたい' },
  { v: 'normal', label: 'ふつう' },
  { v: 'soft', label: 'やわらかい' },
] as const;

export const FLUID_STATE = [
  { v: 'smooth', label: 'スムーズ' },
  { v: 'bitReluctant', label: '少し嫌がった' },
  { v: 'stopped', label: '途中でやめた' },
] as const;

export const MED_RESULT = [
  { v: 'ok', label: '飲めた' },
  { v: 'partial', label: '一部飲めた' },
  { v: 'no', label: '飲めなかった' },
  { v: 'spit', label: '吐き出した' },
] as const;

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function labelOf(list: readonly { v: string; label: string }[], v?: string) {
  return list.find((x) => x.v === v)?.label;
}

export const TEXT = {
  vetFirst: '治療・補液・お薬は、かかりつけの獣医師の指示を優先してください。',
  emergency: '急に様子が変わったときは、記録より先に、かかりつけの動物病院にご相談ください。',
  fluidAmountHint: '獣医師に指示された量を入力してください。',
  fluidUpdateHint: '指示された量が変わったら、その量を入力してください。',
  medListNote: '獣医師から処方・指示された薬だけを記録してください。人の薬を自己判断で与えないでください。',
  candidateNote: 'かかりつけの獣医師に指示されたものを記録してください。',
  reportCover:
    'このレポートは飼い主さんの記録をまとめたものです。アプリは内容の評価や判定をしていません。記録のない日・項目は「—」で示しています。',
  noRecord: '—',
  webReminderNote:
    'ブラウザの試作では、通知は鳴りません。設定した時刻は、ホームの「今日のケア予定」に表示されます。',
  prototypeNote: 'これは試作です。記録はこのブラウザの中だけに保存され、外部には送られません。',
};
