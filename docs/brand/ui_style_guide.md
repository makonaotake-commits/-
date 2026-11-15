# UI スタイルガイド — ねこと、ゆっくり（マンチカン向け）

- バージョン：v1.0（2026-11-15）／作成：ペルシャ
- ステータス：`draft`（ロシアンのレビュー待ち。目印・グラフ・演出の部分は確認が必要）
- 前提：`docs/brand/brand_guide.md`、いまの試作 `app/src/config/theme.ts`・`app/src/components/ui.tsx`
- ねらい：**`theme.ts` の値を差し替えるだけで、全画面がこの見た目になる**ようにする。旧トークン名（`sage`・`peach` など）からの置きかえ表を §2-3 に載せています。

---

## 1. 基本の考え方
- 余白を多く、1画面でやることは1つ。主役のボタンは1画面に1つ。
- 押せるものは、高さ 56 以上（`sizes.touch`）。年配の飼い主さんが片手で押せる大きさにする。
- 色だけで意味を伝えない（文字や形もそえる）。**信号の色（赤・黄・緑）で、記録や数値を塗り分けない。**
- OS の明るい表示・暗い表示に合わせて切りかえる（`useColorScheme()`）。

## 2. 色のトークン

### 2-1. 値
| トークン | 明るい表示 | 暗い表示 | 用途 |
|---|---|---|---|
| `background` | `#FBF5EA` | `#1F1A14` | 画面の背景 |
| `surface` | `#FFFDF8` | `#2A231B` | カード・入力欄・シート |
| `text` | `#4D3F33` | `#F3E8D8` | 本文・見出し・アイコンの線・線画の線 |
| `textSub` | `#6F5E4A` | `#C2B19A` | 補助の文字・プレースホルダー・グラフの目盛り |
| `border` | `#E6D7C0` | `#43382B` | カードの縁・区切り線（飾り） |
| `borderStrong` | `#9A8468` | `#8E7B62` | 入力欄・選択肢・2番目のボタンの縁 |
| `primary` | `#87602F` | `#E2B87F` | 主役のボタンの地・ロゴの日だまり・猫の鼻 |
| `onPrimary` | `#FFFFFF` | `#1F1A14` | 主役のボタンの文字 |
| `primaryTint` | `#F3E3C8` | `#3E3222` | 選択中の地・アバターの地・押したときの地 |
| `accent` | `#8FB5A8` | `#9CC3B5` | 飾りの線（文字には使わない） |
| `accentTint` | `#E2EDE8` | `#263530` | お知らせ欄（Note）の地・タグの地・線画の面・カレンダーの葉っぱ |
| `chartLine` | `#4D3F33` | `#F3E8D8` | グラフの線と点（`text` と同じ） |
| `focus` | `#4D3F33` | `#F3E8D8` | キーボード操作の枠（Web 版） |
| `mark` | `#4D3F33` | `#F3E8D8` | 記録のお知らせの目印（`text` と同じ。§7） |

### 2-2. コントラスト比（WCAG 2.x の式で計算。実機では未確認）
| 組み合わせ | 明るい | 暗い | 基準 |
|---|---|---|---|
| text／background | 9.33 | 14.26 | 4.5 |
| text／surface | 9.96 | 12.80 | 4.5 |
| textSub／background | 5.73 | 8.26 | 4.5 |
| textSub／surface | 6.12 | 7.42 | 4.5 |
| text／primaryTint | 8.02 | 10.30 | 4.5 |
| text／accentTint | 8.44 | 10.61 | 4.5 |
| onPrimary／primary | 5.61 | 9.37 | 4.5 |
| primary／surface（ボタンの形） | 5.52 | 8.41 | 3 |
| borderStrong／surface | 3.52 | 3.81 | 3 |
| borderStrong／background | 3.29 | 4.24 | 3 |
| accent／surface | 2.21 | 8.04 | 飾りのみ（明るい表示では意味を持たせない） |

### 2-3. 旧トークンからの置きかえ
| いまの試作 | 置きかえ先 | 備考 |
|---|---|---|
| `colors.sage`（主役ボタンの地） | `colors.primary` | 文字色は `colors.onPrimary` に変える（いまは `text`） |
| `colors.sage`（2番目のボタン・選択中の縁） | `colors.borderStrong` | |
| `colors.sageTint` | `colors.primaryTint` | 選択中・押したときの地 |
| `colors.peach` | `colors.borderStrong` | アバターの縁 |
| `colors.peachTint` | `colors.primaryTint`（アバター）／`colors.accentTint`（Note） | |
| `ReportScreen` の `'#F3EEE7'` | `colors.background` | 直書きの色をなくす |
| `colors.border`（入力欄の縁） | `colors.borderStrong` | 入力欄は 3 以上が必要 |

### 2-4. theme.ts の形（案）
```ts
import { Platform, useColorScheme } from 'react-native';

export const lightColors = {
  background: '#FBF5EA', surface: '#FFFDF8',
  text: '#4D3F33', textSub: '#6F5E4A',
  border: '#E6D7C0', borderStrong: '#9A8468',
  primary: '#87602F', onPrimary: '#FFFFFF', primaryTint: '#F3E3C8',
  accent: '#8FB5A8', accentTint: '#E2EDE8',
  chartLine: '#4D3F33', focus: '#4D3F33', mark: '#4D3F33',
};
export const darkColors: typeof lightColors = {
  background: '#1F1A14', surface: '#2A231B',
  text: '#F3E8D8', textSub: '#C2B19A',
  border: '#43382B', borderStrong: '#8E7B62',
  primary: '#E2B87F', onPrimary: '#1F1A14', primaryTint: '#3E3222',
  accent: '#9CC3B5', accentTint: '#263530',
  chartLine: '#F3E8D8', focus: '#F3E8D8', mark: '#F3E8D8',
};
export function useColors() {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}
// 暗い表示への対応が済むまでは、互換のため light を既定で出しておく
export const colors = lightColors;
```
- いまは `StyleSheet.create` に色を直接書いているので、暗い表示に対応するときは、スタイルを `useColors()` から作る形に移します。急がなければ、まず `colors = lightColors` の差し替えだけでもかまいません。

## 3. 文字

### 3-1. フォント
| トークン | フォント | 備考 |
|---|---|---|
| `fonts.heading` | Zen Maru Gothic 700（見出し）／500（小見出し） | |
| `fonts.body` | BIZ UDPGothic 400／700 | 本文・数字・単位・ボタン |

- iPhone・Android 版では `@expo-google-fonts/zen-maru-gothic`・`@expo-google-fonts/biz-udpgothic` で同梱する（`useFonts` で読み込み、読み込むまではスプラッシュを表示）。ネイティブでは `fontWeight` が効かないことがあるので、太字は `ZenMaruGothic_700Bold` のように別のフォント名で指定する。
- ライセンス（OFL 1.1）の表示：設定画面に「ライセンス」を置き、`docs/brand/assets/fonts/` の OFL 全文を載せる。

### 3-2. 大きさ（いまの `sizes` を引き継ぐ）
| トークン | 大きさ | 行間 | 用途 |
|---|---|---|---|
| `sizes.title` | 24 | 1.4 | 画面タイトル（Zen Maru Gothic 700） |
| `sizes.heading` | 20 | 1.45 | 見出し（Zen Maru Gothic 700） |
| `sizes.body` | 18 | 1.6 | 本文 |
| `sizes.label` | 17 | 1.5 | ボタン・選択肢・入力欄の名前 |
| `sizes.small` | 15 | 1.6 | 補足・注記（これより小さくしない） |
| `sizes.number` | 28 | 1.2 | ホームなどで大きく見せる数値（例：補液 100 mL）。BIZ UDPGothic 700 |

- 数値と単位のあいだは半角スペース（`4.12 kg`・`100 mL`）。
- OS の文字サイズの設定に合わせて大きくなるようにする（`allowFontScaling` を切らない）。

## 4. 余白・角・影
| トークン | 値 | 用途 |
|---|---|---|
| `sizes.gap` | 16 | 部品どうしの間 |
| `sizes.screenPadding` | 20 | 画面の左右の余白 |
| `sizes.cardPadding` | 20 | カードの内側 |
| `sizes.radius` | 16 | カード・ボタン |
| `sizes.radiusSmall` | 12 | 入力欄・Note |
| `sizes.touch` | 56 | 押せるものの最小の高さ |

- 影はつけない（縁の線で区切る）。

## 5. 部品

| 部品 | 決まり |
|---|---|
| 主役のボタン（primary） | 地 `primary`、文字 `onPrimary`・`sizes.label`・太字、高さ 56、角 16。1画面に1つ |
| 2番目のボタン（secondary） | 地 `surface`、縁 `borderStrong` 2px、文字 `text` |
| 控えめなボタン（quiet） | 地なし、文字 `text`（下線なし）、高さ 44 以上 |
| 押したとき | 地を `primaryTint` に（primary は不透明度 0.85）。縮むなどの動きはつけない |
| 使えないとき | 不透明度 0.45 ＋ 理由を文字で添える |
| カード | 地 `surface`、縁 `border` 1px、角 16、内側 20 |
| 選択肢（chip） | 地 `surface`、縁 `borderStrong` 2px。選択中は地 `primaryTint`・縁 `text`・文字を太字（色だけで区別しない） |
| 入力欄 | 地 `surface`、縁 `borderStrong` 2px、角 12、高さ 56。プレースホルダーは `textSub` |
| Note（補足の欄） | 地 `accentTint`、角 12、文字 `text`・`sizes.small` |
| 確認の欄（ConfirmBox） | 地 `surface`、縁 `text` 2px。「消す」など戻せない操作も、赤にしない（文言で伝える） |
| 猫のアバター | 地 `primaryTint`、縁 `borderStrong`、頭文字は `text`。写真があれば丸く切り抜く |
| 猫の切りかえ（CatSwitcher） | 選択中は地 `primaryTint`・縁 `text`・太字 |
| フォーカス（Web） | `focus` 色の 3px の枠、2px 外側 |

## 6. グラフ（体重など）
- 線と点は `chartLine`。目盛りの文字は `textSub`、軸は `border`。
- **基準線・目標線・正常範囲の帯を付けない。良し悪しの色分けもしない**（ロシアンの条件）。
- 縦軸の最小の幅は `vetValues.ts` の値（獣医師が決める）に従う。
- コピーした記録の点は白抜き（`surface` で塗り、`chartLine` の縁）にして区別する（いまの試作のまま）。
- 増減を矢印・色・言葉（「減少」「注意」など）で強調しない。

## 7. 記録のお知らせ（F-27）の目印
- アイコン：しおり形（`docs/brand/assets/svg/mark_notice.svg`）、20×24、線 1.8、色 `mark`。
- **赤・黄・感嘆符・ベル・点滅・数字のバッジは使わない。動かさない。**
- カレンダーの葉っぱ（§8）とは別の形にする。
- お知らせの一覧には、目印と、記録の事実（例：「むぎ：食欲の記録が入りました」）だけを出す。文言は F-27 の推奨文案に従う。

## 8. 記録した日の葉っぱ（F-08 のカレンダー）
- アイコン：葉っぱ形（`docs/brand/assets/svg/mark_calendar_leaf.svg`）、22×14、地 `accentTint`、線 `text` 1.2。
- ロシアンの条件：①数えない・ためない（育つ・集まる形にしない） ②1種類だけ（件数や内容で変えない） ③カレンダーの中だけ（ホームに並べない） ④記録のない日は何も出さない ⑤お知らせの目印と別の形。

## 9. 線画・案内役・演出

### 9-1. 線画の部品
- 置き場所：`docs/brand/assets/svg/`（`guide_cat.svg`・`logo_mark.svg` など）。アプリでは `react-native-svg` で描く。
- 色はトークンで渡す（線 `text`、面 `surface`・`accentTint`・`primaryTint`、鼻 `primary`）。暗い表示では、同じトークンの暗い値に切りかわる。
- 描き方のルールは `brand_guide.md` §5。

### 9-2. 記録したときの反応
- 保存できたら、案内役のしっぽを 1 回ゆらし、目を細める。合計 1.6 秒以内、1 回だけ。音・振動なし。
- 文言は「記録しました」だけ。何を記録しても同じ。
- `AccessibilityInfo.isReduceMotionEnabled()` が true のときは、動きなしで文言だけ。
- お休み中・一覧から外した猫・見送りのあとは、反応を出さず、文言だけ。

### 9-3. 季節・時間帯・しぐさ・毛色
| 演出 | 切りかえ方 |
|---|---|
| 季節 | 月で切りかえ：3〜5月 若葉／6〜8月 風鈴／9〜11月 色づいた葉・どんぐり／12〜2月 ちらつく雪 |
| 時間帯 | 端末の時刻：5〜10時 朝／10〜17時 昼／17〜5時 夜 |
| しぐさ | 日付で順番に（すわる → 香箱 → 窓の外 → …）。記録や体調とは関係させない |
| 案内役の毛色 | 最初の設定と設定画面で選ぶ。初期値「しろ」。いつでも戻せる |

- 演出は、ホームの上の小さな絵（高さ 120 くらいまで）にとどめ、記録のボタンより目立たせない。
- お休み中・一覧から外した猫・見送りのあとは、演出を止めて静かな絵（日だまりだけ）にする。外した猫の絵や写真を、ほかの猫の画面に使わない。

## 10. ストア画像・資材に画面を使うとき
- 薬の名前は「お薬A」「お薬B」のような架空の名前にする（実在の製品名を出さない。ロシアン P-1）。
- 禁止語（NFR-TONE-06・06b）は、画像の中の文字にも当てはまる。
- 猫の名前と数値は架空のサンプルにする。

## 11. 未確認・あとで決めること
- 線画・ロゴの清書（いまは SVG のラフ）と、24px 以下での見え方。
- ユーザーの参考画像（share.google のリンク2つ）が開けていない。内容がわかったら、線画の部品を調整する。
- 実機での色の見え方。
- ロシアンのレビュー（目印・葉っぱ・演出・言葉づかい）。
