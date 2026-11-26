import { BUILDING_CAMPUSES, type Building } from '../content/buildings';

/** 黒髪北 → 黒髪南 → 本荘 → 大江。同じキャンパスでは buildings.json の順。 */
export function buildingsInCampusOrder(buildings: readonly Building[]): Building[] {
  return buildings
    .map((building, index) => ({ building, index }))
    .sort((left, right) => {
      const campusDelta =
        BUILDING_CAMPUSES.indexOf(left.building.campus) -
        BUILDING_CAMPUSES.indexOf(right.building.campus);
      if (campusDelta !== 0) {
        return campusDelta;
      }
      return left.index - right.index;
    })
    .map((item) => item.building);
}
