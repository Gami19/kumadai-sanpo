# 熊大さんぽ

熊本大学の歴史的建造物とゆかりの人物を学び、探索できるモバイルアプリ。
絵本風イラストのマップでキャンパスを歩くように楽しめることを目指します。

## 技術構成
- Expo + TypeScript + Expo Router（iOS / Android）
- コンテンツ配信：Cloudflare（アカウント登録・ログインなし）
- 個人データ（お気に入り・訪問スタンプ）は端末内保存
- 配布：限定配布（知り合い・学内、EAS内部配布）

## iPhone（Expo Go）で起動する

このアプリは Expo SDK 58 です。App Store の Expo Go 58.0.5 以降（SDK 58 対応）で開きます。本番用の EAS プロファイルと Cloudflare Worker はまだありません。確認は開発サーバーだけです。

1. iPhone の Expo Go を App Store で最新にする
2. パソコンで依存関係を入れる：`npm install`
3. 開発サーバーを起動する：`npx expo start`（または `npm run start`）
4. パソコンと iPhone を同じ Wi-Fi につなぐ
5. ターミナルに出る QR コードを、iPhone のカメラで読み取る
6. Expo Go で「熊大さんぽ」が開いたら、下のタブ（ホーム / マップ / 建物 / 人物 / さんぽ帳）か、ホームのリンクで画面を行き来する

別のネットワークから開くときは `npx expo start --tunnel` を使います。型チェックは `npm run typecheck`、lint は `npm run lint` です。

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
- Expo SDK 58 のアプリ骨格（5画面の仮ルート）あり。建物・人物の中身と絵本マップの実装はこれから
- 仕様決め打ち済み。マップは4区画（黒髪北・黒髪南・本荘・大江）の下敷きとイラスト試作が確定済み
- 下敷き・イラストの画像素材は追加済み
  - 下敷き（いずれも確定版）：黒髪北 kurokami-north-underlay.png、黒髪南 kurokami-south-underlay.png、本荘 v7 honjo-campus-underlay-v7.png、大江 v8 ooe-campus-underlay-v8.png（`data/geo/`）
  - 区画イラスト（試作、区画名の4枚）：黒髪北 kurokami-north-illustrated.webp、黒髪南 kurokami-south-illustrated.webp、本荘 honjo-illustrated.webp、大江 ooe-illustrated.webp（`assets/illustrations/`）
