import { StyleSheet } from 'react-native';

/**
 * 熊大さんぽのデザイントークン。
 * 色・余白・角丸・書体の正は docs/ui-redesign.md。UI/UX サンプル画面は無い。
 * 第2のテーマは作らない。ダークモードは v1 では対応しない（app.json は light 固定）。
 *
 * 色の意味: 煉瓦 = 重要文化財、若葉 = 登録有形文化財、道 = 指定なし。
 * leaf / brickLight / path は紙の上で 4.5:1 未満なので、小さい文字には使わない。
 * 小さい文字は ink、inkMuted、brick、leafDark だけ。
 *
 * 余白は近さで使い分ける。行内 xs < 行の間 sm < グループ md < セクション lg。
 * 16 を全部に敷かない。
 *
 * card / line / moss / clay / mossWash は、画面ごとの作り直し前の既存画面が参照する名前。
 * 新しい部品では paper, ink, brick, leafDark, separator を使う。
 * 枠線付きの角丸カードは増やさない。separator は一覧の区切り線だけに使う。
 */
export const theme = {
  color: {
    paper: '#F6F3E7',
    ink: '#2E2A24',
    /** 紙の上で 6.5:1、白の上で 7.2:1。補足の文字。 */
    inkMuted: '#5C564C',
    /** 重要文化財。紙の上で 4.9:1、白の上で 5.4:1。 */
    brick: '#A25437',
    /** 煉瓦の明部。塗りだけ。文字には使わない（紙の上で 3.2:1）。 */
    brickLight: '#C07556',
    /** 若葉。塗りだけ。文字には使わない（紙の上で 2.3:1）。 */
    leaf: '#96AC62',
    /** 若葉の濃色。紙の上で 6.4:1。操作と登録有形文化財の文字。 */
    leafDark: '#46601E',
    /** 道・土。指定なしの色。文字には使わない。 */
    path: '#D3C0A3',
    /** 一覧の区切り。箱の枠にはしない。 */
    separator: '#E4DCCB',
    white: '#FFFFFF',
    press: 'rgba(46, 42, 36, 0.08)',
    /** シートの背後。地図は残す。 */
    scrim: 'rgba(46, 42, 36, 0.28)',
    leafWash: 'rgba(70, 96, 30, 0.18)',
    /** 煉瓦を薄く敷いた地。文字には使わない。 */
    brickWash: 'rgba(162, 84, 55, 0.16)',
    /**
     * 朱肉。建物印のインク。煉瓦（重要文化財の色）とは別。
     * 紙の上の小さい文字には使わない。印の線と、押せるボタンの地。
     */
    vermilion: '#C23A2E',
    /** 朱を薄く敷いた地。そろったさんぽ帳の表紙。文字には使わない。 */
    vermilionWash: 'rgba(194, 58, 46, 0.14)',
    /**
     * 紫紺。区画制覇のインクと、全制覇印の主色。
     * 大学の公式指定は DIC / CMYK で、この値は画面用の近似。公式の hex ではない。
     */
    shikon: '#3C1E5C',
    /**
     * うこん。全制覇印で紫紺と対に使うインク。
     * 画面用の近似で、公式の hex ではない。単体の小さい文字には使わない。
     */
    ukon: '#C48A12',

    card: '#FFFFFF',
    moss: '#46601E',
    mossWash: 'rgba(70, 96, 30, 0.18)',
    clay: '#A25437',
    line: '#E4DCCB',
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 24,
    xl: 40,
  },
  font: {
    title: 28,
    body: 17,
    caption: 13,
    /** Bold 1ウェイト。本文には使わない。ttf の PostScript 名。 */
    heading: 'ZenMaruGothic-Bold',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  /** 最小タップ。見た目がこれより小さいときは hitSlop で足す。 */
  hit: 44,
  opacity: {
    /** 小さいボタンを押しているあいだ。行やタイルの地は color.press。 */
    pressed: 0.7,
  },
  shadow: {
    /** 地図の上に浮く操作。濃い影で階層を作らない。 */
    float: '0 2px 8px rgba(46, 42, 36, 0.12)',
  },
  border: {
    hairline: StyleSheet.hairlineWidth,
    mark: 2,
  },
} as const;
