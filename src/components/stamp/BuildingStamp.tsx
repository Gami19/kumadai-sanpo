import type { CampusId } from '@/features/map/campuses';
import { theme } from '@/theme/tokens';

import { ArtworkStamp } from './ArtworkStamp';
import { artworkForBuilding } from './artwork/registry';
import { BUILDING_FACES, frameForCampus } from './catalog';
import { InkStamp } from './InkStamp';

type Props = {
  buildingId: string;
  campusId: CampusId;
  size?: number;
  pop?: boolean;
};

/** 建物印。原画があればそれを使い、なければ駅スタンプ型の自作へ戻る。 */
export function BuildingStamp({ buildingId, campusId, size = 44, pop = false }: Props) {
  const artwork = artworkForBuilding(buildingId);
  if (artwork != null) {
    return <ArtworkStamp artwork={artwork} size={size} pop={pop} />;
  }
  const face = BUILDING_FACES[buildingId];
  if (face == null) {
    return null;
  }
  return (
    <InkStamp
      frame={frameForCampus(campusId)}
      kanji={face.kanji}
      arc={face.arc}
      mark={face.mark}
      ink={theme.color.vermilion}
      size={size}
      pop={pop}
    />
  );
}
