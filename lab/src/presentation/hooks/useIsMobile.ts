import { useEffect, useState } from 'react';
import { isMobileViewport, onMobileViewportChange } from '../../core/viewport/mobileGate';

// Global "is this a phone-sized landscape viewport" hook. Reach for this
// instead of hand-tuning one set of percentages/px that has to read fine on
// both a 568x320 phone and a 1440x900 desktop at once - some art (case_bg's
// baked-in monitor slot for "Baca Selengkapnya") doesn't scale evenly
// enough for a single position to work everywhere.
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  useEffect(() => onMobileViewportChange(setIsMobile), []);
  return isMobile;
}
