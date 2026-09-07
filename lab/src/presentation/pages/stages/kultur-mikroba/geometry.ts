import type { CSSProperties } from 'react';
import type { Rect } from '../../../../data/stages/kulturMikroba';

// Shared measuring tape for Stage 2's procedure Screens, identical in shape to
// Stage 4's (teknik-aseptik/geometry.ts): every procedure is drawn on the same
// 1920x1080 Figma frame, so each one converts its own coordinates with S()/T()
// instead of inventing percentages of its own.

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
  // The card title on this stage's own frame is authored in this shade
  // (Figma node 280:100, #232D84) rather than COLOR.navy - kept distinct
  // instead of folded into navy so a future frame that matches Stage 4's own
  // card exactly does not have to un-shadow it again.
  titleNavy: '#232D84',
  body: '#1C1B1A',
  successGreen: '#008C3B',
  ctaBlue: '#357EC1',
  ctaBlueEdge: '#1F6FB5',
  ctaShadow: '#75CBF1',
  hotspotBorder: '#2D6DEA',
} as const;

export const CARD_RADIUS = 24;
export const HAIRLINE = 2;
export const CARD_SHADOW = '0 0.6cqw 1.6cqw rgba(4, 72, 139, 0.22)';

// The blue tab hung over the top of every floating card on this stage, same
// slot Stage 4 uses (FloatingTab y=221.17, 230.042 x 44.936).
export const FLOATING_TAB = { y: 221.17, width: 230.042, height: 44.936 };

export const STAGGER_MS = 110;
export const BUBBLE_MS = 550;
export const ENTER_STEPS = 3;
export const EXIT_TOTAL_MS = ENTER_STEPS * STAGGER_MS + BUBBLE_MS;

export interface Animation {
  className: string;
  delay: number;
}

export const textBase: CSSProperties = {
  margin: 0,
  lineHeight: 1,
  fontFamily: 'inherit',
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

export function rectStyle(rect: Rect): CSSProperties {
  return { left: S(rect.x), top: S(rect.y), width: S(rect.width), height: S(rect.height) };
}
