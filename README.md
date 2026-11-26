# 熊大さんぽ

熊本大学の歴史的建造物とゆかりの人物を学び、探索できるモバイルアプリ。
絵本風イラストのマップでキャンパスを歩くように楽しめることを目指します。

## 技術構成
- Expo + TypeScript + Expo Router（iOS / Android）
- コンテンツ配信：Cloudflare（アカウント登録・ログインなし）
- 個人データ（お気に入り・訪問スタンプ）は端末内保存
- 配布：限定配布（知り合い・学内、EAS内部配布）

## 開発体制
- 実装は coding agent（Cursor）が担当します。着手前に `AGENTS.md` と `.cursor/skills/` の該当skillを参照してください
- 公式skillsの導入（プロジェクトルートで実行）：
  - `npx skills add expo/skills`
  - `npx skills add cloudflare/skills`

## フォルダ構成
| フォルダ | 内容 |
|---|---|
| `app/` | Expo Router のルート（画面） |
| `src/` | components / features / lib / theme |
| `assets/illustrations/` | 区画イラスト・建物イラスト |
| `content/` | 建物・人物・コースの正データ（JSON） |
| `data/geo/` | スポット座標（spots.csv）、区画ポリゴン、下敷き |
| `worker/` | Cloudflare Worker（コンテンツ配信） |
| `scripts/` | データ検証・変換 |
| `docs/` | 仕様メモ、リポジトリ設定案 |
| `.cursor/skills/` | 自作skills（project-spec / illustrated-map / content-data / design-picturebook） |

## データの出典
- 地理データ：© OpenStreetMap contributors（ODbL）。アプリ内にもクレジット表記を行います
- 建物・人物の情報：大学公式資料等の調査に基づきます（`docs/仕様-決め打ち.md` 参照）

## 状態
- 仕様決め打ち済み。マップは4区画（黒髪北・黒髪南・本荘・大江）の下敷きとイラスト試作が確定済み
- 下敷き・イラスト等の画像素材は別途追加予定（`data/geo/README.md` 参照）
