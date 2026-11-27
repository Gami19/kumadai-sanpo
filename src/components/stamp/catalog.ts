import type { CampusId } from '@/features/map/campuses';

import type { FrameKind } from './geometry';

export type StampFace = {
  kanji: string;
  /** 円周の上段。長い正式名称は、印に載る呼び方へ縮めている。 */
  arc: string;
  mark: string;
};

/**
 * 漢字は建物名の核。弧の文字は印に収まる呼び方で、正式名称の一部。
 * 枠は区画で決まる。ここには字と線画だけを置く。
 */
export const BUILDING_FACES: Record<string, StampFace> = {
  'goko-kinenkan': { kanji: '五', arc: '五高記念館', mark: 'goko' },
  'kagaku-jikkenjo': { kanji: '化', arc: '化学実験場', mark: 'kagaku' },
  akamon: { kanji: '門', arc: '赤門', mark: 'akamon' },
  honbu: { kanji: '本', arc: '本部', mark: 'honbu' },
  'kougaku-shiryokan': { kanji: '工', arc: '研究資料館', mark: 'shiryokan' },
  'yamazaki-kinenkan': { kanji: '山', arc: '山崎記念館', mark: 'yamazaki' },
  'ooe-campus': { kanji: '薬', arc: '薬学部', mark: 'ooe' },
  'yakuyo-shokubutsuen': { kanji: '園', arc: '植物園', mark: 'garden' },
};

export const DISTRICT_FACES: Record<CampusId, StampFace> = {
  'kurokami-north': { kanji: '北', arc: '黒髪北', mark: 'north' },
  'kurokami-south': { kanji: '南', arc: '黒髪南', mark: 'south' },
  honjo: { kanji: '荘', arc: '本荘', mark: 'honjo-river' },
  ooe: { kanji: '江', arc: '大江', mark: 'tram' },
};

export const FULL_FACE: StampFace = { kanji: '満', arc: '全制覇', mark: 'ginkgo' };

export const CAMPUS_LABEL = '熊本大学';

export function frameForCampus(campusId: CampusId): FrameKind {
  switch (campusId) {
    case 'kurokami-north':
      return 'circle';
    case 'kurokami-south':
      return 'quatrefoil';
    case 'honjo':
      return 'octagon';
    case 'ooe':
      return 'hexagon';
  }
}
