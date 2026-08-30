import { useEffect, useRef } from 'react';

// window.setTimeout that cancels itself when the component goes away. Every
// procedure schedules at least one delayed beat (the pause between the last
// action and the success note), and a procedure is unmounted the moment LANJUT
// advances the Screen - so an uncancelled timer would fire into a dead tree.
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
