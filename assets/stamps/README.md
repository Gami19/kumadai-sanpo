# assets/stamps

建物印の原画 SVG を置く場所。

命名: `<建物id>-stamp.svg`（確定版の原画）。アプリ用は同名の `.opt.svg`（透過化・viewBox・SVGO 済み）。

アプリは `src/components/stamp/artwork/registry.ts` に登録された原画を使う。区画制覇・全制覇は自作の駅スタンプ型 SVG のまま。

原画を足す／差し替えるとき:

```bash
node scripts/prepare-stamp-artwork.mjs <建物id>
```

背景の塗り path を除き、viewBox を付け、最適化版と `src/components/stamp/artwork/<id>.ts` を書き出す。レジストリに1行追加する。
