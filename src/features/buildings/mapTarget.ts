import { campusIdForLabel, type CampusId } from '@/features/map/campuses';
import { campusesContaining } from '@/features/map/georef';
import type { Spot } from '@/features/map/parseSpotsCsv';
import type { Building } from '@/lib/content/buildings';

export type MapTarget = {
  campus: CampusId;
  spotId: string;
};

/** 本文のキャンパスを優先し、ピンが実際に入る地図へ返す。座標は spots 側だけを見る。 */
export function mapTargetForBuilding(building: Building, spot: Spot | undefined): MapTarget | null {
  if (spot?.lat == null || spot.lon == null) {
    return null;
  }
  const inside = campusesContaining({ lat: spot.lat, lon: spot.lon });
  if (inside.length === 0) {
    return null;
  }
  const preferred = campusIdForLabel(building.campus);
  const campus = preferred != null && inside.includes(preferred) ? preferred : inside[0];
  if (campus == null) {
    return null;
  }
  return { campus, spotId: building.id };
}
