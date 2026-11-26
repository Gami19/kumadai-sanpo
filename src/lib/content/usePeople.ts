import { useEffect, useState } from 'react';

import { bundledPeople, contentPeopleUrl, loadPeople, type Person } from './people';

/** 最初は同梱データ。配信 URL があるときだけ、あとから差し替える。 */
export function usePeople(): readonly Person[] {
  const [people, setPeople] = useState<readonly Person[]>(bundledPeople);

  useEffect(() => {
    if (contentPeopleUrl() == null) {
      return undefined;
    }
    let cancelled = false;
    void loadPeople().then((loaded) => {
      if (!cancelled) {
        setPeople(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return people;
}
