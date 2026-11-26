# worker

Cloudflare Worker（コンテンツ配信）の置き場所。

- 役割：建物・人物データとイラスト等のコンテンツを配信し、アプリ更新なしで差し替え可能にする
- ユーザーの個人データは受け取らない（端末内保存が原則）
- 実装時は Cloudflare公式skills（workers-best-practices / wrangler）を参照
