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
- `ETag`：内容のハッシュ等でコード側で付ける
- `Cache-Control`：
  - dev用：`no-store`（確認のたびに最新を見るため）
  - 本番用：`public, max-age=300`（更新が最大5分で行き渡る。長くしすぎない）

### コンテンツの持ち方（決定：import 方式）
- **KV・R2・Static Assets は使わない。** `content/*.json` を Worker のコードから import して取り込み、ヘッダーもコード側で付ける
  - Static Assets を採らない理由（決定済み）：`content/README.md` まで外部から見えてしまう／`_headers` が1つしか置けず dev=no-store と prod=max-age=300 を分けられない／405 を返すには結局コードが要る
- Cache-Control の値は Worker ごとに変える。`wrangler.toml` の環境変数（例：`CACHE_CONTROL`）で dev／本番に渡し、コードはそれを使う
- 生成物・コピーを手で編集しない。配信内容は常にリポジトリの `content/` と一致させる（import 元は `content/` の実ファイル）

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

デプロイはユーザーが手元のトークンで行う。**Cursor にはトークンを渡さない。** Cursor の担当はコードとローカル検証まで。

1. Cloudflare 公式 skills（workers-best-practices / wrangler）を読み、`worker/` の現行 README と合わせて構成を決める
2. `worker/` に実装：`wrangler.toml`、Worker コード、`package.json` が要る場合は worker 配下に閉じる（ルートの package.json に混ぜない）
3. ローカル確認：`wrangler dev` で §5 の curl チェックを通す
4. `content/` を変更していないことを確認し、既存の検証（`npm run check:data` 相当・型チェック）が green のままであること
5. ここまでを報告し、dev デプロイはユーザーが行う（手順は §6）
6. dev の実機確認が済んだら、prod は **main にマージしたあと、ユーザーの OK をもらってから** ユーザーがデプロイする

## 4. アプリ側の残作業（Worker とセットで必要）

### 4-1. EXPO_PUBLIC_CONTENT_URL は EAS の環境変数で管理する（決定）
- eas.json の build env には書かない。理由：`EXPO_PUBLIC_CONTENT_URL` はビルド／アップデート時に埋め込まれる値で、eas.json 側に書くと `eas update` で配信したときに反映されない
- EAS の環境（development / preview / production）ごとに変数を入れる：
  - development / preview → dev用 Worker の URL
  - production → 本番用 Worker の URL
- **この設定はユーザーが手元の EXPO_TOKEN で行う。** Cursor は変数名と向ける先（どの環境にどの URL か）を報告するところまで
- URL 末尾のスラッシュ有無はアプリ側で吸収される（`buildings.ts` の実装参照）。値そのものは Worker のオリジンまで（パスなし）

### 4-2. fetch にタイムアウトを付ける（アプリ側のコード変更）
- 対象：`src/lib/content/buildings.ts`／`people.ts`／`quizzes.ts` の各ローダー（3か所とも同じ形に揃える）
- 現状はタイムアウトなしの `fetch` で、電波が悪いと画面が待ち続けてしまう。**5秒で打ち切って同梱JSONに切り替える**
- 実装の形：`AbortController` の signal を fetch に渡し、5秒で abort する。既存の try/catch は abort の reject も拾って同梱に戻る作りなので、その流れを壊さない
- parse（形式検証）の挙動は変えない。タイムアウト値（5000ms）は3ファイルで定数を揃えるか共通化する

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

## 6. デプロイの進め方（決定）

- デプロイはユーザーが手元のトークンで行う。Cursor にはトークンを渡さない
- 順序：まず dev だけデプロイして §5 と実機確認を通す。prod は main にマージしたあと、ユーザーの OK をもらってからデプロイする
- Cloudflare アカウントと `wrangler login`（ブラウザ認証）もユーザーの操作。Cursor は手順を示すところまで
- workers.dev のサブドメイン名は初回デプロイ時に確定する（dev の URL は確定済みの前提で進める）
- 独自ドメインは使わない（workers.dev の URL で配布する）

## 7. Grok bot への報告形式

- §5 チェックリストの実施結果（成功／失敗を項目ごとに）
- EAS 環境変数の設定内容（どの環境にどの URL を向けるか。設定作業そのものはユーザー）
- fetch タイムアウトの実装箇所（3ローダー）と、型チェック・既存検証の結果
- 詰まった点・判断を仰ぎたい点
