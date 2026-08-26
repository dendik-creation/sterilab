import { useEffect, useState } from 'react';

// App-shell level orientation lock, not per-route (ADR-0002).
export function useOrientationLock(): boolean {
  const query = '(orientation: portrait)';
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setIsPortrait(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isPortrait;
}
