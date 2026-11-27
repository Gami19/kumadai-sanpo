# assets/stamps

建物印の原画 SVG を置く場所。

命名: `<建物id>-stamp.svg`（確定版の原画）。アプリ用は同名の `.opt.svg`（透過化・viewBox・SVGO 済み）。

アプリは `src/components/stamp/artwork/registry.ts` に登録された原画を使う。区画制覇・全制覇は自作の駅スタンプ型 SVG のまま。

原画を足す／差し替えるとき:

```bash
node scripts/prepare-stamp-artwork.mjs <建物id>
```

白の塗り path だけ除き、インクの外接に viewBox を付け、SVGO する（path を1本にまとめない。穴が潰れる）。`src/components/stamp/artwork/<id>.ts` を書き出し、レジストリに1行追加する。
