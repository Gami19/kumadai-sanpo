# app / src

Expo Router のルート（app/）と実装コード（src/）の置き場所。

画面（タブ）：
- `app/(tabs)/index.tsx` ホーム
- `app/(tabs)/map.tsx` 絵本マップ
- `app/(tabs)/building.tsx` 建物のクイズ入口。8件をキャンパス順に並べ、各行からクイズを始める。本文は置かない
- `app/building/[id].tsx` ピンやクイズ入口から開く建物の本文
- `app/quiz/[id].tsx` 建物ごとの四択クイズ。成績は `src/lib/quiz/` の端末内保存
- `app/(tabs)/people.tsx` 人物
- `app/(tabs)/notebook.tsx` さんぽ帳

共通UIは `src/components/`、色と余白は `src/theme/`。機能単位の実装は `src/features/`、データ取得や端末内保存は `src/lib/` に置く。
