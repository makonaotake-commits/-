# 第2弾の実現性の調査：自動の取り込み・読み取り・推定

- 作成：マンチカン（2026-11-16）／状態：`draft`（コードを書く前の調査）
- 依頼：ボンベイ（2026-11-15。`kickoff_answers.md` 末尾の要望「自律的に記録し、能動的に行動を促してほしい」の第2弾以降の部分）
- 調べ方：ウェブ検索の結果（製品ページ・パッケージのページ・開発者ブログ）。各メーカーの開発者向けページや利用規約は **開いて読めていない** ものが多い。確認できなかったことは「未確認」、自分の見立ては「推測」と書く。
- 判定にあたらない設計にできるかどうかは、ロシアンが判断する（本書では判断しない）。

---

## 0. まとめ（先に結論）

| 手段 | 第2弾での見込み | 外部への送信 | 主な壁 |
|---|---|---|---|
| ① スマート機器の連携（体重計・給水器・トイレ） | **公式の取り込み口は見つからなかった**。今の手段は「飼い主さんがメーカーのアプリで見た値を手入力する」か「CSV の取り込み（出せる製品だけ）」 | CSV 取り込みなら送信なし | 公開 API がない（未確認を含む）。非公式の解析は使えない |
| ①' 汎用の Bluetooth 体重計を直接つなぐ | 技術的には可能（推測）。ただし猫用の製品で、データの形式が公開されているものは見つからなかった | 送信なし（端末とはかりの間だけ） | Expo Go では動かない（開発用ビルドが必要）。機種ごとの対応が必要 |
| ② 検査結果の用紙の読み取り（OCR） | **端末の中だけでできる**（iOS は Apple の Vision、Android は Google の ML Kit。日本語に対応するものがある） | 端末の中で処理すれば送信なし | 用紙の形式が病院ごとにちがう。読み取りの誤り→飼い主さんが一つずつ確認（V6-6）。開発用ビルドが必要 |
| ③ 写真・動画からの推定 | 技術的には端末の中で画像の分類を動かせる。ただし **猫の体調に関わる推定に使える、根拠のあるモデルは見つからなかった** | 端末の中なら送信なし | 学習データ・精度の根拠がない。判定にあたるおそれ（ロシアン判断） |

- どの手段も、**Expo Go では試せず、開発用のビルド（EAS）が必要** になる（①'・②・③。Apple の開発者アカウントがあると進めやすい）。
- 第2弾で最初に手を付けるなら、**② 検査結果の読み取り（F-36）** が、端末の中で完結でき、外部 SDK も増やさずに済む見込みが高い（推測）。

---

## 1. スマート機器の連携

### 1-1. 調べた製品と、取り込みの方法

| 製品（例） | 記録するもの（メーカーの説明） | 公開 API | 書き出し（CSV など） | 確認元 |
|---|---|---|---|---|
| Catlog Board（RABO・日本） | トイレの下に置いて、体重・排尿・排便の回数と量を記録。多頭飼いの識別あり | **未確認**（記事では触れられていない） | **未確認** | 製品紹介記事 |
| Tuya Smart 連携の猫用トイレ | 回数・時刻・使用時間・体重の変化 | **未確認** | **未確認** | 製品紹介記事 |
| Petivity（Purina・米国） | トイレの下に置いて、猫ごとの体重とトイレの記録 | 見つからず（**未確認**） | 見つからず（**未確認**） | 製品ページ・App Store |
| Litter-Robot 4（Whisker・米国） | 体重・トイレの使用 | **公式の API は見つからず**。個人が非公式に解析した例はある | **未確認** | 個人の記事 |
| PETKIT（トイレ・給水器 EVERSWEET） | 給水器の上位機種は、カメラで猫を見分けて飲水を記録すると説明 | **公式の API は見つからず**。非公式の連携（Home Assistant）はある | サポートの掲示板に「書き出したい」という要望があり、少なくとも当時は機能がなかったと読める（**推測**） | サポート掲示板・製品ページ |
| Neakasa | トイレの使用 | 見つからず | サポートの回答は「書き出しはできない、30日分をアプリで見られる」 | サポートページ |
| homerunPET | トイレの使用 | 見つからず | 2026年のガイドに「アプリから CSV を書き出せる」との記述（**メーカーの一次情報は未確認**） | 販売元のブログ |

### 1-2. Apple ヘルスケア（HealthKit）経由
- HealthKit に **ペット用のデータの種類があるという公式の資料は見つからなかった**（未確認）。人の健康データ用の仕組みなので、猫の体重を入れる使い方は想定外と考えられる（推測）。→ **使わない方がよい**（推測。ヘルスケアに猫のデータが混ざると、飼い主さん本人のデータと区別できなくなる）。
- Android の Health Connect も同じ理由で対象外と考える（推測。未調査）。

### 1-3. 汎用の Bluetooth はかり（①'）
- Expo では `react-native-ble-plx` で Bluetooth Low Energy の機器とつなげる。**Expo Go には入っていないため、開発用のビルドが必要**（Expo の公式ブログ）。
- 体重計は標準の Bluetooth の形式（GATT の体重計サービス）を使う製品もあるが、**猫用はかりで形式を公開しているものは見つからなかった**（未確認）。
- できる場合の流れ（推測）：はかりに乗せる → アプリが値を受け取る → **体調の記録の体重欄に入れる前に飼い主さんが確認して保存**（自動で保存しない）。

### 1-4. 使ってはいけない方法
- メーカーの非公式な API の解析（逆解析）・飼い主さんのメーカーアカウントのパスワードを預かる方式は、**利用規約違反・個人情報の扱いの問題** になりうるので使わない（推測。最終判断はロシアン）。

### 1-5. 送るデータと SDK 一覧への影響
- CSV の取り込み：外部への送信なし。追加 SDK なし（ファイルを選ぶ部品 `expo-document-picker` が増える。送信なし）。
- Bluetooth：外部への送信なし。`react-native-ble-plx` を SDK 一覧に追加（端末とはかりの間の通信だけ）。iOS・Android の Bluetooth の許可の説明文が必要。
- メーカーの公式 API が今後出た場合：メーカーのサーバーとの通信になり、**同意・開示・SDK 一覧への記載が必要**。

---

## 2. 検査結果の用紙の読み取り（F-36）

### 2-1. 端末の中で動く OCR
- iOS は Apple の **Vision**、Android は Google の **ML Kit** の文字認識で、端末の中で読み取れる。Expo から使えるパッケージが複数ある（例：`expo-ocr-kit`、`@zhanziyang/expo-text-extractor`〔日本語の指定あり〕、`expo-mlkit-ocr`、`@react-native-ml-kit/text-recognition`）。
- 注意点（パッケージの説明より）：
  - どれも **開発用のビルドが必要**（Expo Go では動かない）。
  - 小さい・新しいパッケージが多く、保守が続くかを確かめる必要がある（例：GitHub のスターが2つのもの）。
  - ML Kit の iOS 版は iOS 16 以上が必要という記述がある。
  - Vision と ML Kit の日本語の精度を比べた資料は見つからなかった（未確認）。
- ML Kit の文字認識は、端末の中で処理する設計とされている（**Google の一次情報は未確認**。採用前に、通信の有無と、Google に送られる利用状況のデータを確認する）。

### 2-2. 第2弾での作り方（推測）
1. 飼い主さんが用紙の写真を撮る（または写真を選ぶ）。
2. 端末の中で文字を読み取る。
3. 「項目名・値・単位・基準範囲」の候補を表にして見せる。**H／L の印・コメント・所見は取り込まない**（V6-6）。
4. 飼い主さんが **一つずつ確認・修正してから保存**。読み取った基準範囲は、写して入力したのと同じ扱い（F-16）。
5. 写真そのものは、保存するかどうかを飼い主さんが選ぶ（初期値は保存しない。推測）。

### 2-3. 限界（推測）
- 病院・検査機関ごとに用紙の並びがちがうため、項目名と値の対応づけは誤ることがある。→ 確認画面が必須。
- 手書き・かすれ・斜めの写真は誤りが増える。
- 単位のちがい（mg/dL と µmol/L など）は自動で直さず、飼い主さんが選ぶ（F-16 のとおり）。

### 2-4. 送るデータと SDK 一覧への影響
- 端末の中だけで処理すれば、**外部への送信なし**。OCR のパッケージ（中身は Apple Vision／Google ML Kit）を SDK 一覧に追加し、「送る情報：なし（端末の中で処理）」と書く。**ML Kit が利用状況などを Google に送るかは未確認**のため、採用前に確認する。
- 外部の OCR サービス（クラウド）を使う場合は、検査結果の写真が外部に出るため、**同意・開示が必要**（NFR-PRV）。第2弾では使わない方がよい（推測）。

---

## 3. 写真・動画からの推定

### 3-1. 技術的にできること
- 端末の中で画像の分類モデルを動かす仕組みはある。
  - `react-native-fast-tflite`：TensorFlow Lite。iOS では Core ML で速くできる。Expo の設定プラグインあり・開発用ビルドが必要。
  - React Native ExecuTorch：Core ML などに対応。
  - ML Kit の画像ラベル付け：一般的なものの分類。
- 例：写真に猫が写っているか、どの猫か（多頭飼いの取り違え防止）、の補助には使える可能性がある（推測）。

### 3-2. できないこと・限界
- **猫の体調・病気・体型（ボディコンディション）・吐いたものの中身・尿の塊の大きさを推定する、根拠のある公開モデルは見つからなかった**（未確認）。作るには、獣医師がラベルを付けた大量の写真と、精度の検証が必要（推測）。
- 写真の写り方（光・角度・距離）で結果が大きく変わる（推測）。
- PETKIT などのメーカーは、カメラで猫を見分けて飲水やトイレを記録する製品を出しているが、**仕組み・精度の公開資料は見つからなかった**（未確認）。
- 推定した結果を記録や画面に出すと、アプリによる **評価・判定と受け取られるおそれ** がある（獣医師法・動物用医療機器プログラムの観点）。→ ロシアンの判断が必要。

### 3-3. 判定にあたらない形にするなら（案。推測。ロシアンが判断）
- 推定を「記録の値」にしない。たとえば「写真に写っている猫：むぎ（候補）」のように、**取り違え防止の補助** にとどめ、体調の項目には使わない。
- 体調に関わる推定は、第2弾では作らない。

### 3-4. 送るデータと SDK 一覧への影響
- 端末の中だけなら、外部への送信なし。モデルのファイルをアプリに同梱するため、アプリが大きくなる（推測。数 MB〜数十 MB）。
- 実行の部品（`react-native-fast-tflite` など）を SDK 一覧に追加。

---

## 4. 次の一手（提案）
1. 第2弾の候補を **② 検査結果の読み取り（F-36）** にしぼり、OCR パッケージを2つほど比べる試作を、開発用ビルドで行う。そのためには、Apple の開発者アカウント（第1弾のストア申請でも必要）と EAS のビルドの準備が要る。
2. ①は、Catlog・Petivity・PETKIT などに **公式の取り込み方法（API・CSV）の有無を問い合わせる**（ユーザーまたはベンガルの担当。推測で進めない）。
3. ③は、ロシアンの判断が出るまで着手しない。

## 参考にした情報源
- [Catlog Board の一般販売（スマートウォッチライフ）](https://www.smartwatchlife.jp/25645/)
- [BCN リテール：猫用スマートトイレの記事](https://www.bcnretail.com/news/detail/20250325_503389.html)
- [Petivity Smart Litterbox Monitor（Purina）](https://www.purina.com/petivity)
- [Petivity（App Store）](https://apps.apple.com/us/app/petivity/id1500596230)
- [PETKIT サポート掲示板「Export data history」](https://support.petkit.com/support/discussions/topics/51000428472)
- [Neakasa サポート：履歴の書き出し](https://support.neakasa.com/hc/en-001/articles/33981786775065-Can-Neakasa-APP-export-the-cat-s-historical-usage-data)
- [homerunPET：App-Controlled Litter Box Health Tracking Guide 2026](https://homerunpet.com/blogs/pet-care-insights/app-controlled-litter-box-health-tracking-guide-2026)
- [Hackaday：Cat Tracking Dashboard（非公式の API 利用の例）](https://hackaday.com/2025/12/13/get-statistical-about-your-pet-with-this-cat-tracking-dashboard)
- [PETKIT：Interzoo 2026 の発表（EVERSWEET ULTRA）](https://www.petkit.com/blogs/blog/from-convenience-to-preventive-health-petkit-debuts-ai-powered-urinary-health-care-ecosystem-at-interzoo-2026)
- [home-assistant-petkit（非公式の連携）](https://awesome.ecosyste.ms/projects/github.com%2Frobertd502%2Fhome-assistant-petkit)
- [Expo Blog：How to build a Bluetooth Low Energy powered Expo app](https://expo.dev/blog/how-to-build-a-bluetooth-low-energy-powered-expo-app)
- [expo-ocr-kit](https://www.pkgstats.com/pkg:expo-ocr-kit)、[@zhanziyang/expo-text-extractor](https://cdn.jsdelivr.net/npm/@zhanziyang/expo-text-extractor@1.0.2/README.md)、[expo-mlkit-ocr](https://socket.dev/npm/package/expo-mlkit-ocr)、[@react-native-ml-kit/text-recognition](https://npmjs.com/package/@react-native-ml-kit/text-recognition)
- [react-native-fast-tflite](https://www.npmjs.com/package/react-native-fast-tflite)、[React Native ExecuTorch：Image Classification](https://docs.swmansion.com/react-native-executorch/docs/extensions/image-classification)
