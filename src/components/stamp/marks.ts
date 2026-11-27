/**
 * 正面の線画。48×32 の箱に収め、印の下半分へ載せる。
 * 輪郭は資料とアプリ内の挿絵から取った簡略で、窓の数や装飾は正確な実測ではない。
 */
export type Mark = {
  paths: readonly string[];
  circles?: readonly { cx: number; cy: number; r: number }[];
};

const goko: Mark = {
  paths: [
    'M 3 28 V 15 H 45 V 28',
    'M 3 15 L 24 7 L 45 15',
    'M 11 7 V 4 H 14 V 7',
    'M 34 7 V 4 H 37 V 7',
    'M 20 28 V 22 A 4 4 0 0 1 28 22 V 28',
    'M 7 17 H 12 V 21 H 7 Z',
    'M 14 17 H 18 V 21 H 14 Z',
    'M 30 17 H 34 V 21 H 30 Z',
    'M 36 17 H 41 V 21 H 36 Z',
  ],
};

const kagaku: Mark = {
  paths: [
    'M 8 28 V 17 H 40 V 28',
    'M 8 17 L 24 8 L 40 17',
    'M 20 8 V 4 H 28 V 8',
    'M 22 4 V 2 H 26 V 4',
    'M 20 28 V 23 A 4 3.5 0 0 1 28 23 V 28',
    'M 11 19 H 17 V 23 H 11 Z',
    'M 31 19 H 37 V 23 H 31 Z',
  ],
};

/** 親柱と袖壁。扉は描かない（当初から門扉がない）。 */
const akamon: Mark = {
  paths: [
    'M 4 24 L 12 19',
    'M 12 12 H 18 V 26 H 12 V 12',
    'M 12 10 H 18 V 12',
    'M 30 10 H 36 V 12',
    'M 30 12 H 36 V 26 H 30 V 12',
    'M 36 19 L 44 24',
  ],
};

const honbu: Mark = {
  paths: [
    'M 2 28 V 13 H 46 V 28',
    'M 2 13 L 24 6 L 46 13',
    'M 8 6 V 3.5 H 11 V 6',
    'M 37 6 V 3.5 H 40 V 6',
    'M 2 18 H 46',
    'M 2 23 H 46',
    'M 21 28 V 24 A 3 3 0 0 1 27 24 V 28',
    'M 6 14 H 10 V 17 H 6 Z',
    'M 13 14 H 17 V 17 H 13 Z',
    'M 31 14 H 35 V 17 H 31 Z',
    'M 38 14 H 42 V 17 H 38 Z',
  ],
};

const shiryokan: Mark = {
  paths: [
    'M 8 28 V 16 H 40 V 28',
    'M 6 16 L 24 8 L 42 16',
    'M 34 11 V 5 H 37 V 11',
    'M 19 28 V 23 H 29 V 28',
    'M 18 23 L 24 19 L 30 23',
    'M 11 18 H 16 V 22 H 11 Z',
    'M 32 18 H 37 V 22 H 32 Z',
  ],
};

const yamazaki: Mark = {
  paths: [
    'M 6 28 V 16 H 42 V 28',
    'M 4 16 L 24 8 L 44 16',
    'M 20 28 V 23 A 4 4 0 0 1 28 23 V 28',
    'M 10 18 H 15 V 22 H 10 Z',
    'M 17 18 H 21 V 22 H 17 Z',
    'M 27 18 H 31 V 22 H 27 Z',
    'M 33 18 H 38 V 22 H 33 Z',
  ],
};

/** 薬学部の長い校舎。一棟の文化財ではないので、平たい連続窓だけにする。 */
const ooe: Mark = {
  paths: [
    'M 1 28 V 14 H 47 V 28',
    'M 1 12 H 47 V 14',
    'M 4 17 H 7 V 21 H 4 Z',
    'M 9 17 H 12 V 21 H 9 Z',
    'M 14 17 H 17 V 21 H 14 Z',
    'M 19 17 H 22 V 21 H 19 Z',
    'M 26 17 H 29 V 21 H 26 Z',
    'M 31 17 H 34 V 21 H 31 Z',
    'M 36 17 H 39 V 21 H 36 Z',
    'M 41 17 H 44 V 21 H 41 Z',
    'M 21 28 V 23 H 27 V 28',
  ],
};

/** 園の顔。挿絵にある温室と木。特定の未記載の棟は描かない。 */
const garden: Mark = {
  paths: [
    'M 2 28 V 18 H 26 V 28',
    'M 2 18 L 14 10 L 26 18',
    'M 14 10 V 18',
    'M 8 18 V 28',
    'M 20 18 V 28',
    'M 36 28 V 20',
  ],
  circles: [{ cx: 36, cy: 15, r: 6 }],
};

const north: Mark = {
  paths: [
    'M 8 26 V 15',
    'M 40 26 V 15',
    'M 16 26 V 14 H 21 V 26',
    'M 27 26 V 14 H 32 V 26',
  ],
  circles: [
    { cx: 8, cy: 10, r: 6.5 },
    { cx: 40, cy: 10, r: 6.5 },
  ],
};

const south: Mark = {
  paths: [
    'M 1 26 V 14 H 22 V 26',
    'M 1 14 L 11.5 4 L 22 14',
    'M 26 26 V 14 H 47 V 26',
    'M 26 14 L 36.5 4 L 47 14',
  ],
};

/** 本荘のそばを流れる川の線。橋の名は入れない。 */
const honjoRiver: Mark = {
  paths: [
    'M 2 12 C 10 6 16 18 24 12 C 32 6 38 18 46 12',
    'M 2 20 C 10 14 16 26 24 20 C 32 14 38 26 46 20',
  ],
};

const tram: Mark = {
  paths: [
    'M 4 21 V 11 H 44 V 21',
    'M 4 11 H 44',
    'M 8 13 H 14 V 17 H 8 Z',
    'M 18 13 H 26 V 17 H 18 Z',
    'M 30 13 H 38 V 17 H 30 Z',
    'M 20 11 V 5',
    'M 16 7 H 28',
  ],
  circles: [
    { cx: 13, cy: 23, r: 2.6 },
    { cx: 35, cy: 23, r: 2.6 },
  ],
};

const ginkgo: Mark = {
  paths: [
    'M 24 31 V 18',
    'M 24 18 C 8 20 2 8 14 3 C 18 8 22 12 24 14 C 26 12 30 8 34 3 C 46 8 40 20 24 18',
    'M 24 18 L 16 7',
    'M 24 18 L 24 4',
    'M 24 18 L 32 7',
  ],
};

export const MARKS: Record<string, Mark> = {
  goko,
  kagaku,
  akamon,
  honbu,
  shiryokan,
  yamazaki,
  ooe,
  garden,
  north,
  south,
  'honjo-river': honjoRiver,
  tram,
  ginkgo,
};
