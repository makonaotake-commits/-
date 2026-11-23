# 体験の見本用の絵（猫の部屋・カード・絵日記・話しかける猫・なでる）

- 作成：ペルシャ／2026-11-23 ／ 依頼：ボンベイ（ユーザーの選択「体験の形式」、`docs/kickoff_answers.md`）
- 状態：`draft`（見本用。ユーザーが体験を選んだあとに清書・追加する）
- 生成：`docs/brand/assets/tools/generate_svg.js`（手で SVG を直さない）
- 全体の見本：`docs/brand/assets/png/experience/experience_assets.png`
- どの絵も f2 の顔・線画ルール（細い線・すきまのある輪郭・ベタはしっぽ1か所）。猫が入るものは毛色6種（接尾辞なし＝しろ、`_tabby`・`_black`・`_calico`・`_brown`・`_gray`）× 明暗（`light/`・`dark/`）
- 気持ちは「落ち着く・安心する」。動きや色は控えめに。答えの絵のルール（表情・色で良し悪しを付けない、「静か」を具合が悪そうにしない）を守る。

## ① 猫の部屋（`svg/{light|dark}/room/`）
部屋の部品は、すべて同じ viewBox `0 0 360 240` なので、重ねるだけで組み上がる。床は y=200。

| 重ねる順 | ファイル | 内容 |
|---|---|---|
| 1 | `window_morning`・`window_noon`・`window_evening`・`window_night` | 窓（左上、アーチ形。十字の桟は入れない）。時間帯で空の色と太陽・月が変わる |
| 2 | `weather_cloudy`・`weather_rain`・`weather_snow` | 窓の中の天気（晴れは重ねない） |
| 3 | `floor`・`bed`・`toilet_back` | 床、寝床、トイレの奥側 |
| 4 | 猫（下の表） | 場所ごとに置く |
| 5 | `bowl_food`・`bowl_water`・`toilet_front` | 手前の器とトイレの手前側（猫の前に重ねる） |

猫のしぐさ（`room/cat_walk`・`cat_eat`・`cat_bed`、ほかに `poses/pose_sit`・`pose_window`）は 120×80（地面 y=80）。しぐさの「地面の中央（60,80）」を、次の点に合わせて置く（倍率 1.0）。

| 場所 | 点 (x, y) | しぐさ | 手前に重ねるもの |
|---|---|---|---|
| 寝床 | (72, 196) | `cat_bed`（丸まって目を開けてくつろぐ） | — |
| 窓辺 | (72, 192) | `pose_window`（うしろ姿で窓の外を見る） | — |
| ごはん | (150, 196) | `cat_eat` | `bowl_food` |
| お水 | (196, 196) | `cat_eat` | `bowl_water` |
| トイレ | (292, 194) | `pose_sit` | `toilet_front` |
| 歩く | (240, 200) | `cat_walk` | — |

- 季節は、窓辺や床に `seasons/season_*` を小さく置く（窓の外の木などは描かない）。
- 「寝ている」場面は、横たわって目を閉じた姿にしない（brand_guide §5-2）。寝床で丸まって、目を開けた姿で表す。

## ② カード（`svg/{light|dark}/cards/`、160×120）
`card_food`（ごはんの器）・`card_water`（お水の器としずく）・`card_toilet`（トイレとスコップ）・`card_energy`（すわる猫。毛色ごと）。答えの選択肢の絵ではなく、問いの絵柄。

## ③ 絵日記（`svg/{light|dark}/diary/`、200×140）
1コマの完成形：`diary_meal`（ごはんの前）・`diary_drink`（お水）・`diary_rest`（寝床でくつろぐ）・`diary_window`（窓辺）。枠つき。毛色ごと。

## ④ 話しかける猫（`svg/{light|dark}/talk/`）
`talk_face`（80×80。どの質問でも同じおだやかな顔）＋`bubble`（200×80 のふきだし。文字はアプリ側で入れる）。

## なでたときの反応（`svg/{light|dark}/pet/`、案内役と同じ 64×32）
`guide/guide_peek`（ふだん）→ `pet_squint`（目を細める）→ `pet_purr`（ごろごろ：ほおの横に小さな弧）。しっぽは `#tail` を回転させて動かす（1回、1.6秒以内）。音・振動の有無は、「演出を控えめにする」設定に従う。
