import type { CampusId } from '@/features/map/campuses';

import { AKAMON_STAMP } from './akamon';
import { GOKO_KINENKAN_STAMP } from './goko-kinenkan';
import { HONBU_STAMP } from './honbu';
import { KAGAKU_JIKKENJO_STAMP } from './kagaku-jikkenjo';
import { KOUGAKU_SHIRYOKAN_STAMP } from './kougaku-shiryokan';
import { OOE_CAMPUS_STAMP } from './ooe-campus';
import { SEIHA_HONJO_STAMP } from './seiha-honjo';
import { SEIHA_KUROKAMI_KITA_STAMP } from './seiha-kurokami-kita';
import { SEIHA_KUROKAMI_MINAMI_STAMP } from './seiha-kurokami-minami';
import { SEIHA_OOE_STAMP } from './seiha-ooe';
import { YAKUYO_SHOKUBUTSUEN_STAMP } from './yakuyo-shokubutsuen';
import { YAMAZAKI_KINENKAN_STAMP } from './yamazaki-kinenkan';
import { ZENSEIHA_STAMP } from './zenseiha';
import type { StampArtwork } from './types';

/**
 * 原画がある建物だけ登録する。
 * 追加手順: assets/stamps/<建物id>-stamp.svg を置き、
 * `node scripts/prepare-stamp-artwork.mjs <id>` で .opt.svg とこのマップ用モジュールを作る。
 */
const ARTWORK_BY_BUILDING: Record<string, StampArtwork> = {
  akamon: AKAMON_STAMP,
  'goko-kinenkan': GOKO_KINENKAN_STAMP,
  honbu: HONBU_STAMP,
  'kagaku-jikkenjo': KAGAKU_JIKKENJO_STAMP,
  'kougaku-shiryokan': KOUGAKU_SHIRYOKAN_STAMP,
  'ooe-campus': OOE_CAMPUS_STAMP,
  'yakuyo-shokubutsuen': YAKUYO_SHOKUBUTSUEN_STAMP,
  'yamazaki-kinenkan': YAMAZAKI_KINENKAN_STAMP,
};

/**
 * 区画制覇の原画。ファイル名の kita/minami は campus id の north/south に対応。
 * 黒髪北 → seiha-kurokami-kita、黒髪南 → seiha-kurokami-minami。
 */
const ARTWORK_BY_CAMPUS: Record<CampusId, StampArtwork> = {
  'kurokami-north': SEIHA_KUROKAMI_KITA_STAMP,
  'kurokami-south': SEIHA_KUROKAMI_MINAMI_STAMP,
  honjo: SEIHA_HONJO_STAMP,
  ooe: SEIHA_OOE_STAMP,
};

/** 原画があればそれを、なければ null（自作 InkStamp へ戻る）。 */
export function artworkForBuilding(buildingId: string): StampArtwork | null {
  return ARTWORK_BY_BUILDING[buildingId] ?? null;
}

/** 区画制覇の原画。なければ null。 */
export function artworkForCampus(campusId: CampusId): StampArtwork | null {
  return ARTWORK_BY_CAMPUS[campusId] ?? null;
}

/** 全制覇の原画。なければ null。 */
export function artworkForFullMastery(): StampArtwork | null {
  return ZENSEIHA_STAMP;
}
