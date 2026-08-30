import type { CSSProperties } from 'react';
import type { Rect } from '../../../../data/stages/teknikAseptik';

// Shared measuring tape for Stage 4's procedure Screens. Every one of the 12
// procedures is drawn on the same Figma frame ("Sterilab-APHP" canvas 42:678,
// 1920x1080), so each one converts its own coordinates with the two helpers
// below rather than inventing percentages of its own.

// Design px on the 1920x1080 frame -> a length on the stage. Stage's safe
// layer is a container (`containerType: inline-size`), so 1cqw is 1% of its
// width; the layer is always 16:9, so the same conversion is valid vertically.
export const S = (designPx: number) => `${(designPx / 1920) * 100}cqw`;

// Same, with a floor. Text that scaled purely with the stage would render at
// ~6px on the smallest supported landscape viewport (568x320), so every type
// size gets a minimum. Boxes that hold floored text size themselves from their
// content or use minHeight, never a fixed height, so the floor widens/heightens
// the box instead of overflowing it.
export const T = (designPx: number, floorPx: number) => `max(${floorPx}px, ${(designPx / 1920) * 100}cqw)`;

export const COLOR = {
  navy: '#04488B',
  pillBlue: '#3471C7',
  band: '#F1F8FE',
  divider: '#B2C7DB',
  dotIdleFill: '#ECEFF5',
  dotIdleRing: '#7A9CC4',
  dotIdleText: '#232D84',
  body: '#1C1B1A',
  successGreen: '#008C3B',
  ctaBlue: '#357EC1',
  ctaBlueEdge: '#1F6FB5',
  ctaShadow: '#75CBF1',
  correction: '#A8321F',
} as const;

export const CARD_RADIUS = 24;
export const HAIRLINE = 2;
export const CARD_SHADOW = '0 0.6cqw 1.6cqw rgba(4, 72, 139, 0.22)';

// Both floating cards on the right share the same tab: a blue pill hung over
// the card's top edge at y=221.17, 230.042 x 44.936.
export const FLOATING_TAB = { y: 221.17, width: 230.042, height: 44.936 };

// Entrance ladder, then the exact reverse on the way out - same 110ms stagger
// and bubble in/out pairing as Splash, Case and Missions.
export const STAGGER_MS = 110;
export const BUBBLE_MS = 550;
export const ENTER_STEPS = 3; // top bar + header text, procedure card, floating card
export const EXIT_TOTAL_MS = ENTER_STEPS * STAGGER_MS + BUBBLE_MS;

export interface Animation {
  className: string;
  delay: number;
}

// Shared type reset for the DOM copy: line-height 1 keeps a text box the same
// height as its font size, which is what makes the Figma ink boxes line up
// without per-element nudging.
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
