# AGENTS.md — 熊大さんぽ（Cursor用・下書き）

このファイルは coding agent（Cursor）が常時読み込む契約書。実装コードではなく、進め方のルールを定める。

## プロジェクト概要
- アプリ名：熊大さんぽ。熊本大学の歴史的建造物とゆかりの人物を学び、探索できるアプリ
- 技術：Expo + TypeScript + Expo Router、iOS/Android両対応
- 配信基盤：Cloudflare（コンテンツ配信のみ。ユーザーアカウント機能は作らない）
- 配布：限定配布（知り合い・学内）。EAS内部配布を想定。ストア公開はしない

## 正となる資料（推測で置き換えない）
- 仕様：`docs/仕様-決め打ち.md`（決め打ち事項の正）
- 座標：`data/geo/spots.csv`（ピンの緯度経度の正）
- マップ境界ルール：`docs/仕様-決め打ち.md` の「マップの敷地境界ルール」
- 確定済み下敷き・イラスト：`data/geo/`（下敷き）と `assets/illustrations/`（イラスト）

## 禁止事項
- 座標・史実（竣工年、文化財指定、人物の経歴）を創作しない。不明な点はデータ側に「未確認」と明記する
- OpenStreetMap（ODbL）のクレジット表記を外さない
- アカウント登録・ログイン機能を追加しない
- 山崎記念館の位置は推定（32.7953, 130.7108）のまま扱い、確定値として表示しない

## 作業の進め方
- 画面・ナビゲーション作業の前に `.cursor/skills/` の該当skillを読む（project-spec は常に最初）
- データ（content/、data/geo/）を変更したら `scripts/` の検証を回す
- 個人データ（お気に入り・訪問スタンプ）は端末内保存のみ。Cloudflareへ送らない
- コンテンツ（建物・人物・イラスト）は Cloudflare から配信し、アプリ更新なしで差し替え可能にする

## 主要コマンド
- 起動：`npm run start`（`npx expo start`）
- 型チェック：`npm run typecheck`（`npx tsc --noEmit`）
- Lint：`npm run lint`（`npx expo lint`）
- Worker ローカル：未作成。コンテンツ配信の Worker を足すときは `worker/` 配下で wrangler dev
