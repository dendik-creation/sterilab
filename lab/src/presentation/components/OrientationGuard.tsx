import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { isPortrait, onOrientationChange } from '../../core/orientation/orientationGate';
import { RotatePrompt } from './RotatePrompt';

// Strict app-wide portrait gate (ADR-0002). Two layers of blocking, not one:
// - RotatePrompt overlays everything (z-index) so pointer/touch can't reach the app.
// - `inert` on the content wrapper removes it from the accessibility tree AND
//   tab order, so a screen reader or a stray Tab press can't reach it either -
//   the previous version only had the visual overlay.
// PhaserGame.ts's own orientation gate still separately pauses/mutes any live
// Stage canvas - this component never unmounts the content (would destroy
// Phaser + lose progress), it only gates interaction with it.
export function OrientationGuard({ children }: { children: ReactNode }) {
  const [portrait, setPortrait] = useState(isPortrait);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => onOrientationChange(setPortrait), []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (portrait) {
      el.setAttribute('inert', '');
    } else {
      el.removeAttribute('inert');
    }
  }, [portrait]);

  return (
    <>
      <div ref={contentRef} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
      {portrait && <RotatePrompt />}
    </>
  );
}
