# app / src

Expo Router のルート（app/）と実装コード（src/）の置き場所。

画面（タブ）：
- `app/(tabs)/index.tsx` ホーム
- `app/(tabs)/map.tsx` 絵本マップ
- `app/(tabs)/building.tsx` 建物詳細（クイズ）の仮画面。仕様の5画面はこのタブが担当で、建物一覧にはしていない
- `app/building/[id].tsx` ピンから開く建物の本文
- `app/(tabs)/people.tsx` 人物
- `app/(tabs)/notebook.tsx` さんぽ帳

共通UIは `src/components/`、色と余白は `src/theme/`。機能単位の実装は `src/features/`、データ取得や端末内保存は `src/lib/` にこれから置く。
