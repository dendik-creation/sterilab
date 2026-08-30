import { useEffect, useState } from 'react';
import { isMobileViewport, onMobileViewportChange } from '../../core/viewport/mobileGate';

// Global "is this a phone-sized landscape viewport" hook. Reach for this
// instead of hand-tuning one set of percentages/px that has to read fine on
// both a 568x320 phone and a 1440x900 desktop at once - Stage 4 uses it to
// change what is rendered, not just how big it is (the 12 step dots, and
// Langkah 2's drop sockets, are dropped below the breakpoint rather than
// shrunk past their touch target).
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  useEffect(() => onMobileViewportChange(setIsMobile), []);
  return isMobile;
}
