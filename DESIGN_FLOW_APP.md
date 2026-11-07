# Design Flow and Reuse Blueprint for a Phaser-Based Web Lab

## Purpose and evidence boundary

This document extracts the **implementation patterns** used by this repository so they can be transferred to another interactive game, training simulation, or virtual laboratory. It deliberately describes system design rather than the lab's subject matter.

The source of truth for this report is the running code under `lab/`, its asset pipeline, and its deployment workflow. Product/architecture documents are used only to clarify intent. A few architectural elements are prepared but not yet the primary runtime path; those are explicitly labelled **planned/scaffolded** rather than presented as implemented.

## 1. Runtime model: React shell first, Phaser where it earns its place

The application is a Vite + TypeScript SPA with React 19 and Phaser 3. Its practical split is:

```text
Browser viewport
  └─ React application shell
      ├─ navigation, full-screen layout, accessibility, audio preference
      ├─ narrative pages, menus, cards, assessments, and procedure UI
      └─ Stage screen
          ├─ DOM interactive procedure workspaces (current primary pattern)
          └─ dynamically imported Phaser game (fallback/scaffolded path)
```

`src/app/App.tsx` composes three stable responsibilities: `NavigationProvider`, `OrientationGuard`, and `ScreenRouter`. Navigation is intentionally a single-path, in-memory stack rather than URL routing. Each screen is a React component selected by the `ScreenId` union in `src/app/ScreenRouter.tsx`.

### Actual Phaser status

Phaser is configured in `src/game/PhaserGame.ts` with the lifecycle:

```text
BootScene -> PreloadScene -> MainMenuScene -> LabScene -> ResultScene
```

It uses `Phaser.Scale.FIT` with centered canvas scaling, an orientation pause/mute gate, persisted audio mute state, and a typed event bridge. `LabScene` is deliberately one shared scene that receives a `stageId`; it is not a scene per lesson step.

However, the three authored interactive stages currently render as React/DOM workspaces (`TeknikAseptikPage`, `KulturMikroba`, and `PengelolaanLimbah`). `LabScene` remains a scaffold for future canvas-native simulations. This is a sound decision for static-frame interactions with real text, forms, and hotspots: DOM text remains selectable, translatable, keyboard-accessible, and easier to test. Do not claim that the existing authored stages are Phaser simulations when copying this system.

### Recommended transfer rule

Use React/DOM for screen chrome, instructional copy, menus, evaluation, and interactions that are essentially controlled hotspots or form-like tasks. Use Phaser only for the part that benefits from a continuously rendered world: moving entities, layered sprites, physics, particles, timing loops, dense drag interaction, or canvas effects. Keep the shared shell and interaction state outside a Phaser scene.

## 2. Layout system: a fixed design canvas without unsafe responsive cropping

The most important visual-system pattern is the `Stage` component (`src/presentation/components/Stage.tsx`). It models every authored screen as a 16:9 design canvas, but creates two concentric layers:

| Layer | Sizing mode | Intended content |
| --- | --- | --- |
| `background` | `cover` | decorative, full-bleed art that may crop |
| `children` / safe layer | `contain` | controls, text, cards, labels, and drop targets that must remain visible |

Both layers are centered with `aspect-ratio: 16 / 9`. The safe layer has `containerType: inline-size`, allowing descendants to use `cqw` rather than viewport units. This makes the design coordinate system proportional to the visible 16:9 stage, not to a potentially tall or narrow browser viewport.

### Coordinate token helpers

Each procedure family has a geometry module, for example `src/presentation/pages/stages/teknik-aseptik/geometry.ts`:

```ts
// A Figma coordinate from a 1920 px-wide frame.
S(px) = `${(px / 1920) * 100}cqw`

// The same scale with a readable lower bound.
T(px, floorPx) = `max(${floorPx}px, ${(px / 1920) * 100}cqw)`
```

`rectStyle(rect)` converts `{ x, y, width, height }` from the artwork coordinate system into an absolute DOM rectangle. The resulting convention is:

1. Figma/artwork is authored at 1920 x 1080.
2. All visual geometry, hotspots, and object overlays use the same frame coordinates.
3. The safe stage converts those values with `S()`.
4. Text and thin borders use `T()` or `max()` floors so they remain usable on a 568 px-wide landscape phone.
5. A small-screen condition may remove dense decorative UI rather than shrinking it below usability (for example, progress dots).

This is preferable to arbitrary per-screen percentages. It preserves art-to-hotspot alignment and gives future implementers a single measuring rule.

### Alignment caveat

On non-16:9 viewports, a coordinate in the cover layer does not line up with the same coordinate in the contain layer. If an interaction needs to align exactly to artwork, place its crisp artwork and its hotspot in the **same safe layer**. The existing procedure screen uses a blurred cover copy only for letterbox bleed, while its interactive artwork is rendered in the safe layer.

### Responsive and orientation policy

The current product is landscape-only. `OrientationGuard` uses one media-query source (`core/orientation/orientationGate.ts`), makes the underlying app `inert` in portrait mode, and shows a blocking rotate prompt. A live Phaser game is separately paused and muted without being destroyed, preserving its state.

The small-screen breakpoint is 1024 px wide (`core/viewport/mobileGate.ts`). The `useIsMobile` React adapter lets a workspace alter its information density, not merely shrink it. All icon controls retain a minimum 44 x 44 CSS-pixel target.

## 3. Design tokens and visual consistency

### Implemented token sources

The cross-application palette is defined in `src/core/theme/palette.ts` and is available as both CSS-style hex strings and Phaser-ready numeric hex values:

| Token | Value | Typical role |
| --- | --- | --- |
| `deepBlue` | `#005ACD` | primary brand/base |
| `blue` | `#0093CB` | secondary action |
| `skyBlue` | `#6DD7FD` | highlight/background |
| `paleBlue` | `#BEF0FF` | light surface |
| `offWhite` | `#F5FFFF` | contrast surface |

The global font contract is **Plus Jakarta Sans Variable**, with system fallbacks. It is applied on the safe stage and used by Phaser text configuration. `src/index.css` establishes `box-sizing: border-box`, a full-viewport root, hidden document overflow, and the global animation classes.

### Local component tokens

Stage-specific geometry modules also contain a local `COLOR` object, radius, hairline, shadow, animation timing, and typographic base style. For example, procedure cards use one navy/blue/white family, a 24 design-pixel radius, a single card shadow, and a consistent label/card/tab language.

This creates good visual consistency inside each authored stage, but it is not yet a complete design-token system. Colors such as card blue, success green, and correction red are repeated in feature geometry modules rather than being globally semantic tokens. Likewise, most layout styling is component-local inline CSS rather than CSS custom properties or a shared component theme.

### Transfer recommendation

Retain the current coordinate tokens (`S`, `T`, `rectStyle`) because they are excellent for frame-based interactive labs. For a new project, centralize the visual tokens before creating feature pages:

```ts
export const theme = {
  color: { brand, surface, ink, success, warning, danger, focus },
  font: { ui: "'Plus Jakarta Sans Variable', system-ui, sans-serif" },
  radius: { card: 24, pill: 999 },
  motion: { hoverMs: 120, enterMs: 550, staggerMs: 110 },
  touch: { minTargetPx: 44 },
} as const;
```

Feature geometry should reference this shared theme and only introduce values that are truly part of that feature's artwork.

## 4. Reusable UI building blocks

The project favours small, purpose-built primitives over a general-purpose UI framework.

| Component / utility | Responsibility | Reuse rule |
| --- | --- | --- |
| `Stage` | centered cover + safe 16:9 frame | Wrap every art-directed screen. |
| `IconButton` | positioned image button, 44 px floor, hover scale, accessible label | Use for top-bar actions such as home, back, and audio. |
| `PulseButton` | image CTA, visual pulse affordance, mouse/touch/keyboard action | Use for primary image-based calls to action. |
| `OrientationGuard` + `RotatePrompt` | app-wide portrait gate and accessibility isolation | Mount once around the router. |
| `useIsMobile` | reactive viewport capability | Hide/reflow UI that would become too dense. |
| `srOnly` | visually hidden live-region-compatible copy | Announce state changes that are otherwise visual only. |
| `prefersReducedMotion` | JavaScript counterpart to CSS reduced motion | Check before Phaser tweens and delayed reveals. |
| `audioSettings`, `bgmPlayer` | global sound preference, mute synchronization, duck/fade behavior | Keep audio policy global rather than screen-local. |
| `levelProgress` | versioned sequential progression ledger | Reuse for linear level unlocking; replace with richer persistence when needed. |

`IconButton` and `PulseButton` do not use generic clickable `<div>` elements. They use real `<button>` elements, expose labels, and provide pointer plus keyboard behavior. This is the expected baseline for every reusable interactive primitive.

### Procedure shell pattern

The most reusable feature composition is the stage procedure shell:

```text
Stage page shell
  ├─ header and common icon buttons
  ├─ procedure/progress card
  ├─ selected procedure workspace
  ├─ success note / next action
  └─ aria-live status
```

The shell owns navigation, stage progress, sound feedback, transitions, the current step index, and completion messaging. The workspace owns only the step mechanic: its local state, hotspots, draggable objects, art-frame changes, and success trigger. A workspace is keyed by the procedure ID, so React unmounts its transient state when the step changes.

This distinction prevents a common failure mode: a giant page component that couples global chrome to every individual mechanic.

## 5. Data-driven interaction model

Stage data resides in `src/data/stages/`. A stage exports a discriminated union of step types and a `PROCEDURE_STEPS` array. Each entry contains content and render-contract data such as:

- stable `id`, ordinal number, title, description, success copy;
- initial and alternate artwork URLs plus meaningful alt text;
- geometry rectangles in the 1920 x 1080 artwork coordinate system;
- accessible names for targets and drop zones;
- mechanic-specific data: ordered actions, draggable items, accepted bins, frames, or correction copy.

A registry maps the stable step ID to its workspace renderer, for example `PROCEDURES: Record<ProcedureId, ProcedureRenderer>`. The renderer first narrows the step's discriminated `kind`; therefore the component for an equipment task receives an `EquipStep`, not an untyped bag of properties.

```text
data/config step (stable ID + kind)
  -> type-safe registry
  -> workspace component for that mechanic
  -> runtime callbacks: setFrame, setMessage, complete
  -> shell shows shared chrome, visual frame, live feedback, and success UI
```

This has two important properties:

1. Reordering the data array cannot silently attach the wrong UI, because lookup is by ID rather than position.
2. Adding content that uses an existing mechanic is mostly a data change. Adding a new mechanic is intentionally a component change.

For a Phaser port, retain this exact data contract. Replace the DOM workspace renderer with a Phaser mechanic adapter; leave step data, scoring rules, and completion events independent from display coordinates. Correctness should test semantic identifiers (for example, `item.bin === target.id`), never sprite positions.

## 6. Asset storage and reusable-asset taxonomy

The asset tree is deliberately semantic and tiered:

```text
lab/assets/
  images/
    00_identity/                 # logo, mascot, favicon
    01_reusable/
      buttons/                   # home, back, audio, exit
      icons/                     # checks, arrows, checkbox states
    02_scenes/
      01_splash/                 # screen-specific background and prompt
      02_home/
      03_case/
      04_levels/
      04_01_<stage>/step_N/      # step-specific backgrounds and cutouts
        backgrounds/
        items/                   # when independently draggable/sortable
  sounds/
    01_reusable/short/           # click and short UI feedback
    01_reusable/long/            # global BGM
    02_scenes/<screen>/          # screen-specific narration/music/effects
```

The numeric prefix carries ownership and reuse intent:

- `00_` is identity-wide and should be loaded/referenced consistently.
- `01_` is reusable UI/media inventory. New screens should consume it before creating duplicates.
- `02_` is scene-owned. It can be imported by that scene, but should not become an undocumented global dependency.

Step state is commonly represented by multiple full-frame backgrounds plus separate transparent cut-outs for objects that must move independently. This is practical for Figma-derived, illustration-heavy training labs: frame swaps provide clear feedback, while only movable objects need separate layers.

At inspection time, the source tree contains 110 files totalling about 104.5 MB. Its generated optimization output contains 59 WebP variants plus one manifest, totalling about 2.16 MB. Treat those numbers as an indication of why the optimization pipeline matters, not as a future project's budget.

### Naming and source-quality rules to carry forward

- Keep ownership and reuse tier in the path; do not place all images in one flat directory.
- Put a step's state frames and movable layers beside the step that uses them.
- Give imported asset variables meaningful names (`autoclaveLoadedUrl`), never generic `image1`.
- Add alt text and accessible target names in data, alongside the asset reference.
- Reserve file suffixes such as `idle`, `loaded`, `done`, or ordered frame numbers for visual state; document the state transition in the step config.
- Enforce spelling consistently. The current source includes one `backgounds/` directory typo; a new project should use `backgrounds/` everywhere and validate it in CI.

## 7. Asset optimizer and delivery path

### Source-preserving WebP generation

`scripts/optimize-assets.py` is a Python/Pillow build tool. It never mutates source artwork. It mirrors the source path under `lab/assets-optimized/` and writes a `.webp` counterpart only when that result is smaller.

Its operational behavior is intentionally conservative:

1. It scans supported raster formats (`png`, `jpg`, `jpeg`, `webp`, `avif`, `gif`, `bmp`, `tiff`).
2. It calculates a source fingerprint from file size and nanosecond mtime, stored in `.asset-optimizer.json`.
3. Unchanged assets reuse the recorded result rather than being re-encoded.
4. It applies EXIF orientation, preserves alpha via RGBA where needed, otherwise uses RGB, and encodes WebP at quality `82` and method `6`.
5. It writes to a temporary file and atomically replaces the target only after a successful encode.
6. It removes a generated result if WebP is larger, skips animated GIFs, and avoids output-path collisions such as `icon.png` and `icon.jpg` mapping to the same `icon.webp`.
7. It records skipped/error status in the manifest and exits unsuccessfully if errors occur, making CI failure visible.

Generated assets are ignored by Git (`lab/assets-optimized/`). The GitHub Actions deployment workflow runs the optimizer before `npm run build`, so production artifacts contain generated variants without committing derived binaries.

### Vite resolution contract

`lab/vite.config.ts` provides two custom plugins:

- **optimized asset resolver**: when code imports a relative optimizable image under `lab/assets`, Vite transparently resolves the matching generated `.webp` if it exists; otherwise it preserves the original import.
- **application asset manifest**: at build/dev time, it scans all supported runtime media, selects the optimized image where available, exposes their URL imports as `virtual:application-assets`, and supplies a deduplicated list to the preloader.

This means existing TypeScript imports remain stable:

```ts
import backgroundUrl from '../../../assets/images/.../backgrounds/1.png';
```

The source extension communicates authoring provenance, while delivery automatically prefers WebP. No component needs an `if (webpExists)` branch, and no image has a broken-link risk if the optimizer has not run.

### Application preload behavior: current implementation versus ideal scaling

`core/assets/preload.ts` currently preloads **every** manifest image and audio file after the splash starts. It uses browser `Image` and `Audio` loads, reports completion count as truthful progress, treats errors as completed so startup cannot deadlock, deduplicates URLs, and shares a module-level promise so React Strict Mode remounts do not repeat the work.

This is implemented and coherent for a modest, controlled asset library. It does conflict with the documented desired direction of stage-level lazy loading: the generated manifest is global, so a large future library will still be requested on first entry. A new Phaser project should split the manifest by bundle or stage:

```text
identity + shell + first screen   -> preload at application start
stage/<id> backgrounds + sprites -> preload when that stage opens
optional audio / bonus media      -> fetch on demand
```

Keep the resolver and optimizer unchanged; change only the manifest's grouping and the preloader's call site. In Phaser, its loader can consume a stage manifest and report the same progress model.

## 8. State, audio, and renderer boundaries

### Lightweight persisted state

`core/progress/levelProgress.ts` persists a schema-versioned sequential completion count to `localStorage`. It clamps invalid values, ignores incompatible schema versions, continues in memory if storage fails, and exposes a subscribe/unsubscribe listener API. This is suitable for linear unlocks, but it is not a full saved-session model.

`core/audio/audioSettings.ts` follows the same framework-free module pattern for a persisted audio preference. `bgmPlayer.ts` owns one global looping HTML audio element, supports mute state, volume ramps, ducking under narration, and temporary pause/resume. Audio starts only after a user-gesture-safe attempt and retries on the next pointer/key interaction if autoplay is blocked.

For a new game, keep renderer-independent state modules for preferences and durable progress. Use a versioned object with explicit migration once progress must include partially completed steps, scores, inventory, or timestamps.

### React–Phaser boundary

`core/events/eventBus.ts` is a typed `EventTarget` bridge with separate command and event maps. It defines commands such as start/reset/pause and events such as step completion, invalid action, experiment completion, and object selection. The bridge exists today; richer Phaser mechanics have not yet consumed it.

The boundary to preserve is:

```text
React control -> typed command -> game/application adapter -> Phaser scene
Phaser action -> typed event -> application/presentation state -> React UI
```

Never let React code mutate Phaser objects directly, and never let a Phaser scene query arbitrary DOM elements for application state. Store semantic game state separately from visual state: `currentStep`, score, validated choices, and completion are portable; sprite coordinates, tween progress, highlights, and particles are renderer-local.

## 9. Motion, feedback, and accessibility as system rules

The global stylesheet contains named motion primitives: pulse ring, bubble in/out, rise/fall, fade, equalizer bars, and a border-trail highlight. Component-local motion is coordinated through shared stage values such as 550 ms bubble duration and 110 ms staggering. Interactions add 120 ms hover/press feedback.

The consistent feedback sequence is:

```text
user action -> immediate visual frame/object update -> concise instruction change
            -> aria-live announcement -> success settle -> continue CTA
```

Procedure workspaces use `useLayoutEffect` for visual art-frame changes when the new frame is immediate feedback; this prevents one browser paint from showing stale artwork after an accepted click. Delayed success cards respect `prefers-reduced-motion` by completing immediately when motion reduction is requested.

Accessibility patterns embedded in the implementation include:

- semantic buttons and labels rather than click-only artwork;
- 44 px minimum targets even when design-frame percentages are smaller;
- `aria-live="polite"` updates for step progress and correction feedback;
- meaningful alt text for state artwork and accessible names for hotspots/drop zones;
- `inert` content during the portrait block, preventing both pointer and keyboard access behind the overlay;
- a matching reduced-motion check for Phaser tweens, since CSS media queries do not control canvas animation.

Replicate these rules in any new component before adding visual polish. Canvas interactions need equivalent DOM controls or an equally complete accessible interaction model.

## 10. Verification and delivery practices

The project contains Playwright end-to-end tests across an explicit landscape device matrix (568x320 phone through desktop) plus a portrait-block case. `tests/settle.ts` waits for finite entrance animations before asserting geometry, while deliberately ignoring infinite pulse animations. This is an important testing pattern for art-directed interfaces: a bounding box during a scale-in animation is not the final layout.

The baseline engineering commands are:

```bash
cd lab
npm run lint
npm run build
npm run test:e2e
```

Asset optimization is executed from the repository root before production builds:

```bash
python -m pip install -r requirements.txt
python scripts/optimize-assets.py
```

The CI deployment flow is: checkout -> install Pillow -> optimize assets -> `npm ci` -> build -> Vercel deployment. Preserve the optimizer-before-build ordering in any copied pipeline.

## 11. Adoption recipe for a new Phaser web game or virtual lab

1. **Establish the shell.** Create the React application shell, an app-wide orientation policy, a navigation/state provider, and a `Stage`-like safe 16:9 layout before building scenes.
2. **Create semantic tokens.** Define brand, semantic feedback colors, type, radius, touch, and motion tokens centrally. Add `S`, `T`, and `rectStyle` if art is supplied in a fixed frame.
3. **Create the asset contract.** Use `00_identity`, `01_reusable`, and `02_scenes` directories. Store source images as authored, scene frames beside their step, and movable cut-outs as separate layers.
4. **Install the optimizer.** Copy the source-preserving Pillow script, generated-output ignore rule, Vite resolver, and CI ordering. Run it locally and in CI.
5. **Define stage data before mechanics.** Use stable IDs, a discriminated step `kind`, accessible names, semantic target IDs, art frames, and geometry in stage data. Do not encode correctness in rendering code.
6. **Build a shared procedure/stage shell.** Put header, navigation, progress card, audio, live region, transitions, and completion flow there. Give each mechanic one focused workspace component registered by stable ID.
7. **Choose the renderer per mechanic.** Begin with DOM for card/hotspot/form-driven learning interactions. Add a shared Phaser scene only for mechanics that need canvas rendering, and connect it through typed commands/events.
8. **Load by ownership.** Preload identity and the first screen; lazy-load subsequent stage manifests. Do not blindly copy the current global preload behavior into a content-heavy game.
9. **Validate at final geometry.** Test landscape sizes, portrait blocking, keyboard/touch targets, reduced motion, and asset fallback. Wait for one-shot entrance motion before screenshot or bounding-box assertions.

## 12. Implementation assessment: retain, improve, avoid

### Retain without hesitation

- Two-layer `Stage` layout with safe `contain` content and decorative `cover` art.
- Frame-coordinate conversion through `cqw` and readable-size floors.
- Semantic three-tier asset folders and step-local state-frame storage.
- Source-preserving, cached WebP generation with fallback resolution.
- Stable step-ID registry plus discriminated TypeScript step data.
- Small accessible primitives, global orientation gating, motion preference checks, and typed renderer boundaries.

### Improve before scaling

- Consolidate duplicated feature `COLOR`, timing, radius, and shadow constants into shared semantic tokens.
- Extract the nearly identical stage shells into a generic `ProcedureStageShell` parameterized by stage data and a registry. Preserve feature-specific mechanics; do not force unrelated mechanics into one giant component.
- Split the global asset manifest into initial and per-stage manifests so initial loading remains proportional to the first experience.
- Expand progress persistence from a completion counter to a versioned, migration-aware session object if the new game supports resume or scoring.
- Add an automated asset naming/path check to catch collisions and directory typos before build.

### Avoid

- A Phaser scene per procedure step; it duplicates lifecycle code and turns simple content changes into structural code changes.
- Hard-coded visual coordinates as correctness logic.
- Placing actionable elements in the cover layer when they must align with safe-layer content.
- Re-encoding or overwriting design-source artwork during optimization.
- Image-only buttons without labels, keyboard support, target-size floors, or non-visual feedback.
- Treating documented target architecture as implemented runtime behavior without checking the code path first.

## Reference map

| Concern | Primary implementation files |
| --- | --- |
| Application shell and navigation | `lab/src/app/App.tsx`, `navigation.tsx`, `ScreenRouter.tsx` |
| Safe 16:9 stage layout | `lab/src/presentation/components/Stage.tsx` |
| UI primitives and orientation | `lab/src/presentation/components/` |
| Tokens and global motion | `lab/src/core/theme/palette.ts`, `lab/src/index.css` |
| Data-driven procedures | `lab/src/data/stages/`, `lab/src/presentation/pages/stages/*/steps/index.tsx` |
| Example DOM stage shell | `lab/src/presentation/pages/stages/TeknikAseptikPage.tsx` |
| Phaser bridge and scenes | `lab/src/game/`, `lab/src/core/events/eventBus.ts` |
| Asset preload and optimizer integration | `lab/src/core/assets/preload.ts`, `lab/vite.config.ts` |
| Generated asset optimizer | `scripts/optimize-assets.py` |
| CI order | `.github/workflows/deploy.yml` |
| Responsive E2E matrix | `lab/playwright.config.ts`, `lab/tests/settle.ts` |
