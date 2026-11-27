# assets/stamps

建物印・制覇印の原画 SVG を置く場所。

命名: `<id>-stamp.svg`（確定版の原画）。アプリ用は同名の `.opt.svg`（透過化・viewBox・SVGO 済み）。

| 種別 | ファイル | レジストリキー |
| --- | --- | --- |
| 建物 | `<建物id>-stamp.svg` | `artworkForBuilding(建物id)` |
| 区画制覇 | `seiha-kurokami-kita`（黒髪北）/`seiha-kurokami-minami`（黒髪南）/`seiha-honjo`/`seiha-ooe` | `artworkForCampus(campusId)` |
| 全制覇 | `zenseiha-stamp.svg` | `artworkForFullMastery()` |

アプリは `src/components/stamp/artwork/registry.ts` に登録された原画を使う。原画が無いときだけ自作の駅スタンプ型（InkStamp）へ戻る。

原画を足す／差し替えるとき:

```bash
node scripts/prepare-stamp-artwork.mjs <id>
```

白の塗り path だけ除き、インクの外接に viewBox を付け、SVGO する（path を1本にまとめない。穴が潰れる。色は変えない）。`src/components/stamp/artwork/<id>.ts` を書き出し、レジストリに1行追加する。
