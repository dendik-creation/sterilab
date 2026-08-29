// Single source of truth for landscape/portrait detection (ADR-0002), shared
// by the app-shell overlay (useOrientationLock/RotatePrompt) and the Phaser
// pause gate (PhaserGame.ts) - both must react to the exact same query.
const QUERY = '(orientation: portrait)';

export function isPortrait(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

export function onOrientationChange(listener: (portrait: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(QUERY);
  const handler = (event: MediaQueryListEvent) => listener(event.matches);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
