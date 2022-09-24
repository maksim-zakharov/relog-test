import { useEffect, useState } from 'react';
import ymaps from 'ymaps';

export const useYMaps = <T,>() => {

  const [state, setState] = useState<T>();

  useEffect(() => {
    ymaps
      .load().then(maps  => setState(maps));

    // @ts-ignore
    // return () => state?.destroy();
  }, [ymaps]);

  return state;
}
