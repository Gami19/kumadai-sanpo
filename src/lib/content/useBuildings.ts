import { useEffect, useState } from 'react';

import { bundledBuildings, contentBuildingsUrl, loadBuildings, type Building } from './buildings';

/** 最初は同梱データ。配信 URL があるときだけ、あとから差し替える。 */
export function useBuildings(): readonly Building[] {
  const [buildings, setBuildings] = useState<readonly Building[]>(bundledBuildings);

  useEffect(() => {
    if (contentBuildingsUrl() == null) {
      return undefined;
    }
    let cancelled = false;
    void loadBuildings().then((loaded) => {
      if (!cancelled) {
        setBuildings(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return buildings;
}
