---
name: design-picturebook
description: 絵本風デザインのトークンと世界観ルール。UIコンポーネントや画面を作るときに読む。
---

# design-picturebook

## 世界観
- 水彩・絵本風イラストで統一する。写真中心のデザインにしない
- UI の正は `docs/ui-redesign.md`。UI/UX サンプル画面は無い
- 主役は地図のイラスト。枠は OS の標準（ヘッダー、タブ、シート）に任せ、独自の色・書体・動きはピン、スタンプ、見出しに使う

## 一緒に読む skill
画面を作る・直すときは、この skill のあとに次も読む。

- `expo-design-system`（トークンと部品の置き場。`references/native-slop.md` のチェックを画面ごとに行う）
- `expo-native-ui`（ヘッダー、SF Symbols、シート、タップ領域）
- `expo-animation`（動かすかどうかの判断と haptics。タブ切替や一覧にはアニメを付けない）
- `frontend-design`（文章と見た目の判断。実装手順は Web 向けなので、そこは使わない）

## ルール
- 色・余白・角丸・書体は `src/theme/` のトークンから使う。画面ごとに直値を書かない。第2のテーマは作らない
- 見出し（画面の大見出し、建物名、人物名）だけ Zen Maru Gothic Bold。本文はシステム書体。ダークモードは v1 では作らない
- 建物・風景の絵はイラスト素材（`assets/illustrations/`）を使い、汎用アイコンや写真で置き換えない。操作用のアイコンは SF Symbols、Android は Material
- 枠線付きの角丸カードを新しい共通スタイルにしない。区切りは余白。hairline は一覧の区切り線だけ
- 画面の大見出しはネイティブヘッダーに置く。自前の「戻る」「一覧へ」は置かない
- 同じ注意文を画面ごとに繰り返さない。位置の推定は破線ピンと「推定」チップ、端末内保存の説明はさんぽ帳の1か所
- マップ上の道路・市電の描き分けは illustrated-map skill のルールに従う
