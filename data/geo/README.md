# data/geo

地理データの置き場所。

- `spots.csv`：スポットの緯度経度の正。座標を創作しないこと。山崎記念館は推定位置（`position_status` が「推定」）。文書館は座標未確定で、ピンを置かない
- `designation` 列：文化財指定。区分の一覧は `categories.json`（重要文化財／登録有形文化財／なし）
- `campus_georef.json`：キャンパスごとの緯度経度からイラスト画素への係数。ピン位置はここから計算する
- 区画ポリゴン（GeoJSON）：今後ここに追加

## 確定済み下敷き（画像は追加済み。いずれも確定版）
- 黒髪北：kurokami-north-underlay.png
- 黒髪南：kurokami-south-underlay.png
- 本荘：honjo-campus-underlay-v7.png（v7）
- 大江：ooe-campus-underlay-v8.png（v8）

敷地境界ルールは `docs/仕様-決め打ち.md` の「マップの敷地境界ルール」と `.cursor/skills/illustrated-map/SKILL.md` を参照。
地理データの出典は OpenStreetMap（ODbL）です。
