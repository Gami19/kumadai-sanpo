# app / src

Expo Router のルート（app/）と実装コード（src/）の置き場所。

画面（タブ。起動時は地図）：
- `app/(tabs)/map.tsx` 絵本マップ
- `app/(tabs)/quiz/` クイズの入口。8件をキャンパス順に並べ、各行からクイズを始める
- `app/quiz/[id].tsx` 建物ごとの四択クイズ。成績は `src/lib/quiz/` の端末内保存
- `app/building/[id].tsx` ピンやクイズ入口から開く建物の本文
- `app/(tabs)/people/` 人物一覧
- `app/people/[id].tsx` 人物の本文
- `app/(tabs)/notebook/` さんぽ帳（訪問スタンプ・お気に入り）。端末内保存の説明はここだけ
- `app/notice.tsx` 出典と注意のシート

共通UIは `src/components/`、色と余白は `src/theme/`。機能単位の実装は `src/features/`。コンテンツの取得は `src/lib/content/`。クイズの成績は `src/lib/quiz/`、さんぽ帳は `src/lib/notebook/`（AsyncStorage、キーは `notebook:`。座標は保存しない）。
