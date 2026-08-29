import { useEffect, useState } from 'react';
import { isPortrait, onOrientationChange } from '../core/orientation/orientationGate';

// App-shell level orientation lock, not per-route (ADR-0002).
export function useOrientationLock(): boolean {
  const [portrait, setPortrait] = useState(isPortrait);

  useEffect(() => onOrientationChange(setPortrait), []);

  return portrait;
}
