import { useEffect, useRef } from 'react';

// window.setTimeout that cancels itself when the component goes away. Same
// helper as kultur-mikroba/hooks.ts and teknik-aseptik/hooks.ts: every
// procedure schedules at least one delayed beat (the pause before the
// success note), and is unmounted the moment LANJUT advances the Screen.
export function useTimeouts(): (ms: number, run: () => void) => void {
  const idsRef = useRef<number[]>([]);

  useEffect(() => {
    const ids = idsRef.current;
    return () => ids.forEach(window.clearTimeout);
  }, []);

  return (ms, run) => {
    idsRef.current.push(window.setTimeout(run, ms));
  };
}
