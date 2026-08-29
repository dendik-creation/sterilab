---
status: accepted
---

# Single-path SPA navigation, Splash+Cover as one React Screen

The whole app now runs at one path (`/`) with no client-side router. `react-router-dom` is removed; a small in-memory stack (`src/app/navigation.tsx` - `NavigationProvider`/`useNavigation`) tracks the current Screen and its params, and `ScreenRouter` swaps components in place of what used to be `<Outlet>`. Screen 1 (Splash + Cover) is one React component (`SplashPage.tsx`) instead of two chained Phaser scenes (`BootScene` -> `HomeScene`); Screen 2 is `CasePage.tsx`, wired into the same navigation stack.

Rejected: keeping `react-router-dom` and collapsing every route to `/` via query/hash params — still pays for a router's history-stack subscriptions and URL-parsing machinery for a single-path app that never needs deep-linking (every session starts at the splash, and mid-journey state is meant to be resumed from `localStorage`, not a URL — TASKS.md > Aturan Lintas Screen). Rejected: keeping Splash/Cover as Phaser scenes — this was already a deviation from ADR-0001 (Phaser scoped to the 5 Stage canvases only); moving them to DOM/React removes that deviation and drops Phaser out of the initial bundle entirely (`vite build` now emits Phaser as its own lazy chunk, pulled in only when a Stage is opened, not on first paint).

Consequence: no server-side rewrite rules are needed for any deep path (`/case`, `/missions/apd`, ...) since none of them are ever real URLs - every host that can serve one `index.html` works. Browser back/forward no longer participates in in-app navigation (`ADR-0002`'s "browser back must not delete state" requirement is moot; back/forward do nothing inside the app). Fullscreen, requested once on the Splash "touch anywhere" gesture, persists across every Screen transition since none of them ever unmount `<html>`/`<body>` the way a full page navigation would. The 5 Stage canvases are unaffected — they still use Phaser via `createPhaserGame`, lazy-loaded per Stage exactly as before.
