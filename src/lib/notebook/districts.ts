import { campusIdForLabel, campuses, type CampusId } from '@/features/map/campuses';
import type { Building } from '@/lib/content/buildings';

export const CAMPUS_IDS: readonly CampusId[] = campuses.map((campus) => campus.id);

export function campusBuildings(buildings: readonly Building[], campusId: CampusId): Building[] {
  return buildings.filter((building) => campusIdForLabel(building.campus) === campusId);
}

export function isCampusComplete(
  buildings: readonly Building[],
  campusId: CampusId,
  stamped: ReadonlySet<string>,
): boolean {
  const group = campusBuildings(buildings, campusId);
  return group.length > 0 && group.every((building) => stamped.has(building.id));
}
