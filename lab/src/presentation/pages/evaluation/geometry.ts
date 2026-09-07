import type { CSSProperties } from 'react';

// Shared measuring tape for Screen "Evaluasi" (Figma "Sterilab-APHP" canvas
// "Scene 07: Evaluasi", frames "HALAMAN PENGERJAAN SOAL" node 314:2030 and
// "HALAMAN HASIL" node 319:2357, both 1920x1080). Same S()/T() convention as
// every Stage's own geometry.ts (e.g. pages/stages/pengelolaan-limbah/
// geometry.ts) so a Figma x/y/width converts the same way here.

export const S = (designPx: number) => `${(designPx / 1920) * 100}cqw`;

export const T = (designPx: number, floorPx: number) => `max(${floorPx}px, ${(designPx / 1920) * 100}cqw)`;

export const COLOR = {
  navy: '#04488B',
  pillBlue: '#3471C7',
  band: '#F1F8FE',
  divider: '#B2C7DB',
  dotIdleFill: '#ECEFF5',
  dotIdleRing: '#7A9CC4',
  dotIdleText: '#232D84',
  titleNavy: '#232D84',
  body: '#0A1E55',
  statNavy: '#0A1E55',
  successGreen: '#008C3B',
  ctaBlue: '#2295E6',
  // Option pill states: idle matches the Figma option box (bg #F1F6FE,
  // border #A7D9FC), correct/wrong are this Screen's own tokens - nothing in
  // the design shows them since the mock is static, so they're picked to
  // read clearly against the same light card without fighting `navy`.
  optionIdleBg: '#F1F6FE',
  optionIdleBorder: '#A7D9FC',
  optionLetter: '#032B79',
  correctBg: '#E7F7EC',
  correctBorder: '#008C3B',
  correctText: '#0B5C29',
  wrongBg: '#FDEBEA',
  wrongBorder: '#D9342B',
  wrongText: '#8A1F1F',
} as const;

// Top band height (Figma group 314:2045 spans y=38.605 to y=110.388 of 1080).
export const HEADER_HEIGHT = 'max(88px, 7.682cqw)';

export const CARD_RADIUS = 29;
export const HAIRLINE = 2;
export const CARD_SHADOW = '0 0.6cqw 1.6cqw rgba(4, 72, 139, 0.22)';

export const STAGGER_MS = 110;
export const BUBBLE_MS = 550;
export const ENTER_STEPS = 3;
export const EXIT_TOTAL_MS = ENTER_STEPS * STAGGER_MS + BUBBLE_MS;

export interface Animation {
  className: string;
  delay: number;
}

// Explicit rather than `inherit`: Stage.tsx's safe layer already sets this
// same stack, so inherit would resolve identically - but this Screen's copy
// is spelled out because every size on it was re-tuned by hand against this
// exact font (Plus Jakarta Sans Variable, lab/package.json), and a future
// edit to Stage's own stack shouldn't silently reflow it.
export const FONT_FAMILY = "'Plus Jakarta Sans Variable', system-ui, 'Segoe UI', Roboto, sans-serif";

export const textBase: CSSProperties = {
  margin: 0,
  lineHeight: 1,
  fontFamily: FONT_FAMILY,
};

export const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
