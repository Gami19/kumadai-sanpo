# content

建物・人物・コースの正データ（JSON）を置く場所。

- `buildings.json`：座標のある地点の本文。`schemaVersion` は 1
- `people.json`：ゆかりの人物。`schemaVersion` は 1。肖像は置かない。読みや年が出典で確認できないときは「未確認」
- courses.json は未作成
- スキーマ・編集・検証手順は `.cursor/skills/content-data/SKILL.md` を参照
- 座標はここに持たず、`data/geo/spots.csv` を正とする。建物の `id` と `spotId` は、spots.csv の `id` 列と同じ
- 不明な項目は創作せず「未確認」とする。竣工年が庭園の開設年と違うときは `yearBuilt` を「未確認」にし、開設年は `yearNote` に書く
- アプリは同梱 JSON を読み、`EXPO_PUBLIC_CONTENT_URL` があるときだけ `{URL}/buildings.json` と `{URL}/people.json` で上書きする。失敗したら同梱に戻る。Worker はまだ置かない
