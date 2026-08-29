// Shared reduced-motion check for Phaser tweens. CSS respects the media
// feature natively; Phaser tweens don't, so every bubble/pulse tween must
// check this explicitly (04-design-system.md > Imagery, icon, motion).
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
