---
name: content-data
description: 建物・人物・コースのコンテンツデータのスキーマと編集・検証手順。content/ を触るときに読む。
---

# content-data（下書き）

## データの置き場所
- 人が編集する正データ：content/buildings.json、content/people.json、content/courses.json
- 地理データ：data/geo/spots.csv（緯度経度はこちらが正。content側に座標を重複して持たない）
- 地図の絞り込みは spots.csv の `designation` 列。値は「重要文化財／登録有形文化財／なし」（`data/geo/categories.json`）。`content/buildings.json` を作ったあとも、この区分とずらさない

## スキーマの原則
- 各建物：id、名称、キャンパス（黒髪北／黒髪南／本荘／大江）、竣工年、文化財指定（重要文化財／登録有形文化財／なし）、説明、見学情報、ゆかりの人物id、スポットid（spots.csvと対応）
- 各人物：id、名称、熊本大学との関わり、エピソード、関連する建物id
- 不明な項目は空欄で埋めず「未確認」と明示する。公開前に再確認が必要な項目（山崎記念館の公開時間、本部の内部見学可否など）は未確認フラグを残す

## 編集・検証手順
1. content/ を編集する
2. scripts/ の検証を回す：必須項目の有無、id参照の整合、座標が熊本大学周辺の範囲内か
3. Cloudflare配信形式への変換は scripts/ の変換処理で行い、生成物を直接編集しない

## 禁止事項
- 史実・年号・座標の創作
- 推定値（山崎記念館の位置など）を確定値として登録すること
