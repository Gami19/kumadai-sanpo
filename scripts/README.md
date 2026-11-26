# scripts

データ検証・変換スクリプトの置き場所。

- content/ の必須項目・id参照の整合チェック
- spots.csv の座標範囲チェック（熊本大学周辺の範囲内か）
- `npm run check:data`：`campus_georef.json` の変換を制御点・スポット画素と突き合わせ、座標のある地点だけがピンになることを確認する。続けて `buildings.json` の id が、座標のある `spots.csv` の id と一致するか（文書館など座標の無い行は建物にしない）を確認する
- content/ から Cloudflare 配信形式への変換

データ変更時は検証を必ず回すこと（`AGENTS.md` 参照）。
