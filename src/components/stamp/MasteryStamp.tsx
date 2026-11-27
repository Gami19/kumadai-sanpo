import type { CampusId } from '@/features/map/campuses';
import { theme } from '@/theme/tokens';

import { DISTRICT_FACES, frameForCampus, FULL_FACE } from './catalog';
import { InkStamp } from './InkStamp';

type Props = {
  campusId?: CampusId;
  /** 省略すると全制覇。 */
  size?: number;
  pop?: boolean;
};

/** 区画制覇は紫紺の一色。全制覇はうこんと紫紺。 */
export function MasteryStamp({ campusId, size = 120, pop = false }: Props) {
  if (campusId == null) {
    return (
      <InkStamp
        frame="circle"
        kanji={FULL_FACE.kanji}
        arc={FULL_FACE.arc}
        mark={FULL_FACE.mark}
        ink={theme.color.shikon}
        accent={theme.color.ukon}
        ornate
        size={size}
        pop={pop}
      />
    );
  }
  const face = DISTRICT_FACES[campusId];
  return (
    <InkStamp
      frame={frameForCampus(campusId)}
      kanji={face.kanji}
      arc={face.arc}
      mark={face.mark}
      ink={theme.color.shikon}
      ornate
      size={size}
      pop={pop}
    />
  );
}
