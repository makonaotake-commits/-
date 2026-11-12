# アプリ（試作）— マンチカン担当

React Native ＋ Expo（TypeScript）。今は「タップできる試作」の段階です。

- 試作（ブラウザ版）：https://claude.ai/artifact/V7JqhUfoTPy25hUZmrA2k4 （非公開。共有はページの共有メニューから）
- 記録はブラウザの中（端末内）だけに保存します。外部には何も送りません。

## 入っている画面
| 画面 | 要件 |
|---|---|
| ホーム（猫の切り替え・今日のケア予定・今日つけた記録） | S-03、F-02 |
| 体調を記録する | S-04、F-03 |
| 補液を記録する（量・部位・輸液の名前・様子・リマインダー設定） | S-05、F-04、F-06 |
| お薬を記録する（自宅で与えたお薬／病院での処置） | S-06、F-05 |
| お薬リスト・時刻の設定（候補は2文字以上で表示） | S-07、F-05、F-06、F-26 |
| 獣医師に見せるレポート（一覧・体重グラフ） | S-09、F-07、F-12 |

## 差し替えやすくしてある場所
| ファイル | 中身 |
|---|---|
| `src/config/theme.ts` | 配色・フォント・文字の大きさ（ペルシャのスタイルガイドが届いたらここを差し替える） |
| `src/config/vetValues.ts` | 獣医師が決める値（補液量の確認を出す境目・体重グラフの縦軸の最小幅・部位の選択肢・輸液名の候補） |
| `src/config/labels.ts` | 画面の言葉（ロシアンのレビュー前の仮） |
| `src/data/drugs.ts` | 薬の候補リスト（`drug_list_draft.md` v0.2 の仮データ。「要確認」の行は試作用） |

## 使っているライブラリ（SDK 一覧のたたき台。NFR-PRV-05）
| 名前 | 目的 | 外部に送る情報 |
|---|---|---|
| expo / react-native / react-native-web | アプリの土台 | なし |
| @react-native-async-storage/async-storage | 端末内への保存 | なし |
| react-native-svg | 体重グラフ | なし |
| react-native-safe-area-context / expo-status-bar | 画面の端の調整 | なし |
| Google Fonts（Web 版のみ） | フォントの読み込み | フォントの取得時に、閲覧者の IP アドレスなど通常の通信情報が Google に届く。記録の内容は送らない |

分析・クラッシュ報告の SDK はまだ入れていません（Q-27。ロシアンの確認後に追加）。

## 作り方（開発者向け）
```
npm install
npm run web        # 手元で開く
npm run build:web  # dist/prototype.html（1ファイル）を作る
npm run typecheck
```
