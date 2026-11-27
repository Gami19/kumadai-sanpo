import type { CampusId } from '@/features/map/campuses';
import { theme } from '@/theme/tokens';

import { ArtworkStamp } from './ArtworkStamp';
import { artworkForCampus, artworkForFullMastery } from './artwork/registry';
import { DISTRICT_FACES, frameForCampus, FULL_FACE } from './catalog';
import { InkStamp } from './InkStamp';

type Props = {
  campusId?: CampusId;
  /** 省略すると全制覇。 */
  size?: number;
  pop?: boolean;
};

/** 区画制覇・全制覇。原画があればそれを使い、なければ自作の紫紺印へ戻る。 */
export function MasteryStamp({ campusId, size = 120, pop = false }: Props) {
  if (campusId == null) {
    const artwork = artworkForFullMastery();
    if (artwork != null) {
      return <ArtworkStamp artwork={artwork} size={size} pop={pop} />;
    }
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
  const artwork = artworkForCampus(campusId);
  if (artwork != null) {
    return <ArtworkStamp artwork={artwork} size={size} pop={pop} />;
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
