import categories from '../../../data/geo/categories.json';
import spotsCsv from '../../../data/geo/spots.csv';

import { placeSpots, type PlacedSpot } from './placeSpots';
import { parseSpotsCsv, type Spot } from './parseSpotsCsv';
import type { CampusId } from './campuses';

export type { PlacedSpot, Spot };

export const designationCategories = categories.categories;

export const spots: readonly Spot[] = parseSpotsCsv(spotsCsv);

export function designationLabel(id: string): string {
  return designationCategories.find((category) => category.id === id)?.label ?? id;
}

/** designationId が null のときは区分で絞らない。 */
export function mapSpots(campusId: CampusId, designationId: string | null): PlacedSpot[] {
  return placeSpots(spots, campusId, designationId);
}
