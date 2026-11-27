# worker（コンテンツ配信）

`content/buildings.json`・`people.json`・`quizzes.json` を GET / HEAD で返す Cloudflare Worker。

- KV・R2・Static Assets は使わない。`content/*.json` を import して配信する
- 秘密情報・ユーザーデータは扱わない
- Worker 名：dev = `kumadai-content-dev`、本番 = `kumadai-content`（作成済み）
- workers.dev を利用する（独自ドメインなし）
- プレビュー URL は使わない（`wrangler.toml` で `preview_urls = false`）

## ローカル確認

```bash
cd worker
npm install
npx wrangler dev --env dev
```

別ターミナルで §5 の curl（`http://127.0.0.1:8787` など表示された URL）を実行する。

## デプロイ（ユーザーが手元で実行）

Cursor にはトークンを渡さない。デプロイは次の環境変数で認証する（`wrangler login` は使わない）。

| 変数 | 値 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Workers をデプロイできる API トークン |
| `CLOUDFLARE_ACCOUNT_ID` | `8f23ba75dfc6b3447332e025ab1652b2` |

`account_id` は `wrangler.toml` に書かない。

```bash
cd worker
npm install
export CLOUDFLARE_API_TOKEN=...   # 手元のトークン
export CLOUDFLARE_ACCOUNT_ID=8f23ba75dfc6b3447332e025ab1652b2

# まず dev のみ
npx wrangler deploy --env dev
```

本番は main にマージしたあと、OK をもらってから:

```bash
npx wrangler deploy --env production
```

### デプロイ後の URL

| 環境 | URL |
|---|---|
| dev | `https://kumadai-content-dev.ku-museumambassador.workers.dev` |
| 本番 | `https://kumadai-content.ku-museumambassador.workers.dev` |

## Cache-Control

`wrangler.toml` の `CACHE_CONTROL` で環境ごとに渡す。

- dev: `no-store`
- 本番: `public, max-age=300`

## アプリ側（EAS）

`EXPO_PUBLIC_CONTENT_URL` は eas.json には書かない。EAS の環境変数としてユーザーが設定する。

- development / preview → `https://kumadai-content-dev.ku-museumambassador.workers.dev`
- production → `https://kumadai-content.ku-museumambassador.workers.dev`

値はオリジンのみ（末尾スラッシュなしでよい。アプリ側で吸収する）。
