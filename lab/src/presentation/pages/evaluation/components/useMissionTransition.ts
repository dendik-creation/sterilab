import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../../../core/a11y/motion';

export function useMissionTransition() {
  const [exiting, setExiting] = useState(false);
  const locked = useRef(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const transition = (next: () => void) => {
    if (locked.current) return;
    locked.current = true;
    if (prefersReducedMotion()) {
      next();
      locked.current = false;
      return;
    }
    setExiting(true);
    timer.current = window.setTimeout(() => {
      next();
      setExiting(false);
      locked.current = false;
    }, 550);
  };
  return { exiting, transition };
}
