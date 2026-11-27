# assets/stamps

建物印の原画 SVG を置く場所。

命名: `<建物id>-stamp-vermilion.svg`（朱色・本命）。比較用に `-stamp-brick.svg` も置ける。

アプリは `src/components/stamp/artwork/registry.ts` に登録された原画を使い、未登録の建物と区画制覇・全制覇は自作の駅スタンプ型 SVG のまま。原画を足すときは最適化版（`.opt.svg`）を作り、レジストリに1行追加する。
