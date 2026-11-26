# scripts

データ検証・変換スクリプトの置き場所。

- content/ の必須項目・id参照の整合チェック
- spots.csv の座標範囲チェック（熊本大学周辺の範囲内か）
- `npm run check:data`：`campus_georef.json` の変換を制御点・スポット画素と突き合わせ、座標のある地点だけがピンになることを確認する。続けて `buildings.json` の id が、座標のある `spots.csv` の id と一致するか（文書館など座標の無い行は建物にしない）を確認する。`people.json` があるときは、人物 id の一意性、建物の `relatedPersonIds` との相互参照、出典の有無を確認する。ファイルが無いときは、建物の人物 id が空であることだけを見る。さんぽ帳の保存形が、壊れた JSON や座標を残さないことも確認する。続けて `quizzes.json` を確認する（`buildingId` が建物にあること、選択肢が4つ、正解 index が0から3、出典の https URL があること、各建物の本番が3問であること）
- content/ から Cloudflare 配信形式への変換

データ変更時は検証を必ず回すこと（`AGENTS.md` 参照）。
