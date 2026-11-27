import type { CampusId } from '@/features/map/campuses';
import { theme } from '@/theme/tokens';

import { BUILDING_FACES, frameForCampus } from './catalog';
import { InkStamp } from './InkStamp';

type Props = {
  buildingId: string;
  campusId: CampusId;
  size?: number;
  pop?: boolean;
};

/** 建物印。全区画とも朱色で、枠の形だけが区画を分ける。 */
export function BuildingStamp({ buildingId, campusId, size = 44, pop = false }: Props) {
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
