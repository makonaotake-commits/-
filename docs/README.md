# ドキュメント索引

| フォルダ | 内容 | 担当エージェント |
|---|---|---|
| `status.md` | 進捗ボード | ボンベイ（統括） |
| `kickoff_answers.md` | キックオフ確認シートの回答と論点 | ボンベイ（統括） |
| `kickoff_questions.html` / `dispatch_plan.html` / `risk_decisions.html` / `instagram_design.html` / `requirements_decisions.html` / `marketing_decisions.html` / `dev_plan.html` / `dev_cat.html` / `drug_list_review.html` / `brand_cat.html` / `analytics_confirm.html` / `vet_check_dec.html` / `req_v4_decisions.html` / `drug_verify.html` / `app_name_check.html` / `autonomy.html` / `drug_v03.html` / `req_v6_decisions.html` / `f37_ad_promise.html` | ユーザー向け確認シート（Artifact の元ファイル） | ボンベイ（統括） |
| `requirements/` | 要件定義（概要・ペルソナ・ストーリー・機能/非機能・MVP） | ブリショー |
| └ `01_overview.md` | 背景・目的・課題・やらないこと・KGI/KPI | ブリショー |
| └ `02_personas.md` | 飼い主ペルソナ3名とカスタマージャーニー | ブリショー |
| └ `03_user_stories.md` | ユーザーストーリーと受け入れ条件 | ブリショー |
| └ `04_functional_requirements.md` | 機能一覧（MoSCoW・リリース・⚠️）と画面一覧 | ブリショー |
| └ `05_non_functional_requirements.md` | 個人情報・法令・広告・アクセシビリティ・トーン・オフライン | ブリショー |
| └ `06_mvp_scope.md` | 第1弾・第2弾の範囲とリリース計画 | ブリショー |
| └ `07_open_questions.md` | 確認事項（ユーザー・ロシアン）とリスク | ブリショー |
| └ `drug_list_draft.md` | 薬の候補リスト（F-26）初版の案と出典の利用条件の確認状況（draft） | ブリショー |
| └ `research_auto_capture.md` | 第2弾の実現性の調査（機器連携・検査結果の読み取り・写真からの推定）（draft） | マンチカン |
| `marketing/` | 市場分析・ポジショニング・チャネル・KPI・ローンチ計画 | ベンガル |
| `sns/trends/` | 週次トレンドレポート | アビシニアン |
| `sns/instagram/` | プロフィール・投稿カレンダー・投稿案 | スコティ |
| `brand/` | ブランドガイド・UIスタイルガイド・資材 | ペルシャ |
| └ `brand_base_proposal.md` / `brand_base_sheet.html` | ブランドの土台の案（アプリ名・配色・フォント・線画・ロゴ）と選択シート（draft） | ペルシャ |
| └ `brand_art_v2_proposal.md` / `brand_art_v2_sheet.html` | 線画の磨き込み案・続けたくなる工夫・配色 c3 の画面用調整・アプリ名の確認結果と選択シート（draft） | ペルシャ |
| └ `brand_guide.md` / `ui_style_guide.md` / `assets/` | ブランドガイド・UI スタイルガイド（theme.ts のトークン）・SVG ラフ・フォントの OFL（draft） | ペルシャ |
| └ `brand_art_v3_proposal.md` / `brand_art_v3_sheet.html` | 線画の清書案（参考画像の雰囲気を取り入れた版）と選択シート（draft） | ペルシャ |
| └ `brand_logo_sheet.html` | ロゴとアプリアイコンの最終確認シート（`answers/brand_logo`） | ペルシャ |
| `../app/` | アプリのコード（Expo） | マンチカン |
| `compliance/` | 獣医療・法令レビュー記録（`initial_risks_2026-11-09.md`＝アプリ全体の初期リスク整理、`review_2026-11-09_requirements.md`＝要件定義書 初版のレビュー、`review_2026-11-09_requirements_v2.md`＝第2版の再レビュー、`review_2026-11-09_requirements_v3.md`＝第3版の差分レビュー、`review_2026-11-11_requirements_v4.md`＝第4版（F-27 ほか）と薬リスト v0.2 のレビュー、`review_2026-11-12_requirements_v5.md`＝第5版（数値の条件・輸液剤リスト）のレビュー、`review_2026-11-15_drug_list_v03.md`＝薬・輸液剤リスト v0.3 のレビュー、`review_2026-11-15_requirements_r14.md`＝やさしい演出・演出を控えめにする設定のレビュー、`review_2026-11-15_requirements_v6.md`＝第6版（自動記録と行動のうながし）のレビュー、`review_2026-11-09_instagram_dec.md`＝Instagram 12月分のレビュー、`review_2026-11-11_instagram_v2.md`＝12月分の再レビューと返信テンプレート、`review_2026-11-09_marketing.md`＝マーケ戦略 初版のレビュー、`review_2026-11-09_marketing_v2.md`＝修正版の再レビュー、`review_2026-11-10_marketing_v3.md`＝確認シート反映版の差分レビュー、`review_2026-11-10_kpi_analytics.md`＝KPI 計測（分析イベント）のレビュー、`review_2026-11-11_marketing_v4.md`＝リスク判断シート反映版のレビュー、`review_2026-11-11_vet_reviewer_request.md`＝外部獣医師への依頼書のレビュー、`review_2026-11-12_app_prototype.md`＝アプリ試作の文言と SDK 一覧のレビュー、`review_2026-11-15_app_prototype_v2.md`＝試作 第1弾の残りの画面のレビュー、`review_2026-11-15_app_f27_and_ios.md`＝F-27 実装設計と iPhone 版の通知・PDF のレビュー、`review_2026-11-12_marketing_v5.md`＝分析の確定とアプリ名の反映のレビュー、`review_2026-11-12_brand_art_v2.md`＝線画・記録を続けたくなる工夫・アプリ名のレビュー、`review_2026-11-15_brand_guide.md`＝ブランドガイド・UI スタイルガイドのレビュー、`review_2026-11-15_marketing_v6.md`＝自律的な記録と「うながし」の伝え方のレビュー） | ロシアン |

## 使い方
- `/kickoff` … 初期ドキュメント一式を作成
- `/weekly-sns [本数]` … 週次の SNS 運用サイクル
- `/review <ファイル>` … コンプライアンスレビュー
- 個別に頼む場合：「ブリショーで食事記録機能のユーザーストーリーを書いて」など
- [通知「やった」の記録 確認シート](notify_done.html)（[公開ページ](https://claude.ai/artifact/T8oaw54gtfXfae4swPazmK)）
- [アイコンの耳選び 確認シート](icon_ear.html)（[公開ページ](https://claude.ai/artifact/Q8nQDVgjoZFhPzcrC9A65W)）
- [第1弾のスケジュール 確認シート](schedule.html)（[公開ページ](https://claude.ai/artifact/5KJRPm5wPQEiKg7JCEvxqW)）
- [開発者アカウント登録の手順](ops/dev_account_guide.md)
- [開発者アカウントの名義 確認シート](dev_account.html)（[公開ページ](https://claude.ai/artifact/N1TLraXzKsHQgwj2AELbeC)）
- [アイコンの新しい方向 確認シート](icon_v2.html)（[公開ページ](https://claude.ai/artifact/HVGNUJEM56HkHWhX6MQSBh)）
