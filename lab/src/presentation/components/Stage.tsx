import type { CSSProperties, ReactNode } from 'react';
import { palette } from '../../core/theme/palette';

// Shared landscape stage for every DOM (React) Screen (568-767 phone,
// 768-1023 tablet, >=1024 desktop; TASKS.md > Aturan Lintas Screen). Two
// concentric 16:9 boxes, both centered on the viewport:
//
// - `background` covers the viewport (like CSS `background-size: cover`) -
//   width/height are each floored at the viewport's own size and only grow
//   to preserve 16:9, so it never leaves empty bars down the sides. On a
//   non-16:9 window it overflows top/bottom or left/right and gets cropped -
//   fine for full-bleed art, but anything the Analyst must actually see
//   would risk being cropped off the visible viewport if placed here.
// - `children` (the "safe" layer) is sized the other way - CSS `contain`,
//   never larger than the viewport - so every button, card and label stays
//   fully on-screen at any window aspect. A design's
//   inset-[top_right_bottom_left] percentages can be copied straight into a
//   child's style: both boxes are 16:9 and share a center, so on a 16:9
//   viewport (568x320, 667x375, 1366x768) a percentage lands on exactly the
//   same point in either layer.
//
// The two boxes are only the *same size* at 16:9, though. On 1024x768 the
// cover box is 1365x768 while the safe box is 1024x576, so a child at 89% of
// the safe layer sits ~75px above the background feature it was drawn over in
// Figma. That drift is the deliberate trade: art placed in `background` may be
// cropped, content placed in `children` may not, and there is no single box
// that can promise both. Anything that has to stay glued to a background
// feature at every aspect belongs in the same layer as that feature.
//
// `containerType: inline-size` on the safe layer turns it into a CSS
// container query context so descendants can size text with `cqw` units (1cqw
// = 1% of the safe layer's own rendered width) instead of viewport units -
// matches the `width * factor` pixel-scaling convention already used in
// BootScene/HomeScene, just expressed in CSS instead of a Phaser tween.
const outerStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  overflow: 'hidden',
  background: palette.deepBlue,
};

const centeredBox: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
};

const coverStyle: CSSProperties = {
  ...centeredBox,
  width: 'max(100vw, 100vh * 16 / 9)',
  height: 'max(100vh, 100vw * 9 / 16)',
};

const safeStyle: CSSProperties = {
  ...centeredBox,
  width: 'min(100vw, 100vh * 16 / 9)',
  height: 'min(100vh, 100vw * 9 / 16)',
  containerType: 'inline-size',
  fontFamily: "'Plus Jakarta Sans Variable', system-ui, 'Segoe UI', Roboto, sans-serif",
};

export function Stage({ background, children }: { background: ReactNode; children: ReactNode }) {
  return (
    <div style={outerStyle}>
      <div style={coverStyle}>{background}</div>
      <div style={safeStyle}>{children}</div>
    </div>
  );
}
