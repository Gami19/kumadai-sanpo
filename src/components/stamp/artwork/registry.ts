import { GOKO_KINENKAN_STAMP } from './goko-kinenkan';
import type { StampArtwork } from './types';

/**
 * 原画がある建物だけ登録する。
 * 追加手順: assets/stamps/<建物id>-stamp-vermilion.svg を置き、
 * SVGO で .opt.svg を作り、このマップに1行足す。
 */
const ARTWORK_BY_BUILDING: Record<string, StampArtwork> = {
  'goko-kinenkan': GOKO_KINENKAN_STAMP,
};

/** 原画があればそれを、なければ null（自作 InkStamp へ戻る）。 */
export function artworkForBuilding(buildingId: string): StampArtwork | null {
  return ARTWORK_BY_BUILDING[buildingId] ?? null;
}
