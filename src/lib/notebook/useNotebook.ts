import { useEffect, useSyncExternalStore } from 'react';

import {
  addFavoriteBuilding,
  addFavoritePerson,
  getNotebookSnapshot,
  hydrateNotebook,
  removeFavoriteBuilding,
  removeFavoritePerson,
  removeStamp,
  restoreFavoriteBuilding,
  restoreFavoritePerson,
  restoreStamp,
  stampBuilding,
  subscribeNotebook,
} from './storage';

export function useNotebook() {
  const current = useSyncExternalStore(subscribeNotebook, getNotebookSnapshot, getNotebookSnapshot);

  useEffect(() => {
    void hydrateNotebook();
  }, []);

  return {
    ready: current.ready,
    loadError: current.loadError,
    stamps: current.data.stamps,
    favoriteBuildings: current.data.favoriteBuildings,
    favoritePeople: current.data.favoritePeople,
    stampBuilding,
    removeStamp,
    restoreStamp,
    addFavoriteBuilding,
    removeFavoriteBuilding,
    restoreFavoriteBuilding,
    addFavoritePerson,
    removeFavoritePerson,
    restoreFavoritePerson,
  };
}
