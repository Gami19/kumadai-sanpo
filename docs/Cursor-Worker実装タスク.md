# Cursor実装タスク：コンテンツ配信用 Cloudflare Worker

Grok bot 経由で Cursor に渡す指示書。実装前に §0 の資料を必ず読むこと。

## 0. 前提（正となる資料）

- `AGENTS.md`（契約・禁止事項）
- `docs/環境構成.md`（dev／本番の分け方。このタスクの上位方針）
- `content/README.md`（配信契約の正）：アプリは `EXPO_PUBLIC_CONTENT_URL` があるときだけ `{URL}/buildings.json`・`{URL}/people.json`・`{URL}/quizzes.json` を読み、失敗したら同梱JSONに戻る
- アプリ側の実装は完了済み：`src/lib/content/buildings.ts`／`people.ts`／`quizzes.ts`
  - 素の `fetch(url)`（認証なし、クエリなし）。`response.ok` でなければ同梱に戻る
  - 受け取ったJSONはアプリ側で厳密に検証する（`schemaVersion` は 1、必須キー、id形式など）。形式違いは同梱に戻る
  - つまり Worker は「正しいJSONを正しいパスで 200 で返す」だけでよい。アプリ側の変更は §4 の環境変数設定のみ

## 1. ゴールと完成条件

- `worker/` に Cloudflare Worker を実装し、dev用／本番用の2つをデプロイできる状態にする
- 完成条件：
  1. dev用 Worker の URL で3ファイルが取得でき、アプリ側の検証（parse）が通る
  2. 実機（開発ビルドまたは Expo Go + 環境変数）で、配信JSONが同梱JSONより優先されることを確認できる
  3. 本番用 Worker へのデプロイ手順が dev と同じ手順で再現できる（手順を `worker/README.md` に残す）

## 2. Worker 仕様

### ルーティング
| メソッド | パス | 応答 |
|---|---|---|
| GET / HEAD | `/buildings.json` | `content/buildings.json` の内容 |
| GET / HEAD | `/people.json` | `content/people.json` の内容 |
| GET / HEAD | `/quizzes.json` | `content/quizzes.json` の内容 |
| その他 | それ以外すべて | 404（本文は短いテキストでよい） |
| GET/HEAD以外 | すべて | 405 |

### レスポンスヘッダー
- `Content-Type: application/json; charset=utf-8`
- `ETag`：内容のハッシュ等で付ける（wrangler のアセット機能を使う場合は自動付与でよい）
- `Cache-Control`：
  - dev用：`no-store`（確認のたびに最新を見るため）
  - 本番用：`public, max-age=300`（更新が最大5分で行き渡る。長くしすぎない）

### コンテンツの持ち方（フェーズ1）
- **KV・R2 は使わない。** `content/*.json` を正とし、デプロイ時に取り込む方式にする
  - 第一候補：Workers Static Assets（`wrangler.toml` の `[assets]` で `content/` を配信ディレクトリに指定）。ルーティングとヘッダーは `_headers` または Worker コード側で調整
  - 代替：Worker コードから `../../content/*.json` を import して返す（ファイルが小さいため可）
  - どちらを選んだかと理由を `worker/README.md` に書く
- 生成物・コピーを手で編集しない。配信内容は常にリポジトリの `content/` と一致させる

### 環境分け（wrangler）
- Worker名：dev = `kumadai-content-dev`、本番 = `kumadai-content`（`docs/環境構成.md` の例示どおり）
- 1つの `worker/wrangler.toml` に環境を定義し、`wrangler deploy --env dev` / `--env production`（または name 切替）で出し分ける。具体方式は wrangler の作法に従い、手順に明記する
- 秘密情報は持たない。secrets は追加しない

### やらないこと
- アカウント・認証・個人データの受信（AGENTS.md の禁止事項）
- イラスト・サムネイルの配信（アプリ側にURL契約がまだないため次段階）
- 管理用エンドポイント、POST の受け付け
- CORS の追加（ネイティブアプリの fetch には不要。必要になったら別途判断）

## 3. 実装手順（Cursor の作業順序）

1. Cloudflare 公式 skills（workers-best-practices / wrangler）を読み、`worker/` の現行 README と合わせて構成を決める
2. `worker/` に実装：`wrangler.toml`、Worker コード（Static Assets の場合は最小構成）、`package.json` が要る場合は worker 配下に閉じる（ルートの package.json に混ぜない）
3. ローカル確認：`wrangler dev` で §5 の curl チェックを通す
4. `content/` を変更していないことを確認し、既存の検証（`npm run check:data` 相当・型チェック）が green のままであること
5. dev へデプロイ → §5 のチェックを dev URL で再実施
6. アプリ側 §4 を設定し、実機で配信優先を確認
7. 本番へデプロイ（手順のみ先に整え、実行は Grok bot の指示を待つ）

## 4. アプリ側の残作業（Worker とセットで必要）

- `eas.json` のプロファイルごとに `EXPO_PUBLIC_CONTENT_URL` を設定する
  - development / preview → dev用 Worker の URL
  - production → 本番用 Worker の URL
  - URL はデプロイ後に確定する。確定値を eas.json の `env` に書くか EAS の環境変数で管理するかは、既存の運用（appVersionSource: remote 等）と矛盾しない方式を選び、理由を報告する
- URL 末尾のスラッシュ有無はアプリ側で吸収される（`buildings.ts` の実装参照）。値そのものは Worker のオリジンまで（パスなし）

## 5. 検証チェックリスト（dev URL で実施し、結果を報告する）

```
curl -i {DEV_URL}/buildings.json   → 200、Content-Type: application/json、schemaVersion: 1 を含む
curl -i {DEV_URL}/people.json      → 200、同上
curl -i {DEV_URL}/quizzes.json     → 200、同上
curl -i {DEV_URL}/                 → 404
curl -i {DEV_URL}/courses.json     → 404（未作成データは配信しない）
curl -i -X POST {DEV_URL}/buildings.json → 405
curl -I {DEV_URL}/buildings.json   → HEAD が 200
```
- 実機確認：配信側のJSONを一時的に変えたことが分かる状態（例：dev のみ先に content を更新）にし、アプリ表示へ反映されること。同梱に戻る挙動（URL を外す／Worker を止める）も確認する

## 6. 事前にユーザー確認が必要な点（Cursor は止まって報告する）

- Cloudflare アカウントと `wrangler login`（ブラウザ認証）はユーザーの操作が必要。未ログインなら手順だけ示して止まる
- workers.dev のサブドメイン名の確定（初回デプロイ時に決まる）
- 独自ドメインは使わない前提（workers.dev の URL で配布する）。変える場合はユーザー判断

## 7. Grok bot への報告形式

- 選んだ配信方式（Static Assets / import）と理由
- dev用 Worker の確定 URL
- §5 チェックリストの実施結果（成功／失敗を項目ごとに）
- eas.json（または EAS 環境変数）への設定内容
- 本番デプロイの手順が dev とどう違うか（違わなければ「同一手順」と明記）
- 詰まった点・判断を仰ぎたい点
