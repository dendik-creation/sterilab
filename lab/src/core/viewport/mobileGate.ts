// Single source of truth for "mobile" vs "tablet/desktop" viewport
// detection - mirrors core/orientation/orientationGate.ts's plain
// function + listener shape (no React import here; the framework-agnostic
// core layer doesn't get one - see presentation/hooks/useIsMobile.ts for
// the React wrapper every Screen actually uses).
//
// Breakpoint matches TASKS.md's own landscape device matrix: phone lands in
// 568-767px, tablet/desktop start at 1024px.
const MOBILE_BREAKPOINT_PX = 1024;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

export function onMobileViewportChange(listener: (isMobile: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(QUERY);
  const handler = (event: MediaQueryListEvent) => listener(event.matches);
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}
