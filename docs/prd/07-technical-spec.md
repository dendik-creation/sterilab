# Technical and Data Specification

## Stack

React + Vite + **TypeScript**, Phaser 3 for the canvas/simulation layer, HTML/CSS for application-level UI. **Local-first** (all progress works fully offline via localStorage; no server dependency for MVP) and **PWA-ready** (installable, offline shell caching) — see NFR in `02-product-requirements.md`. Explicitly a **2D web-based interactive simulation**: no Three.js/WebGL 3D/Babylon.js unless a future PRD change explicitly requires it. See `../adr/0001-phaser-react-vite-scoped-to-stages.md` and `../adr/0003-clean-architecture-typescript-data-driven-scenes.md`.

## Architectural direction: Clean Architecture + Scene-Based Game Architecture

Three concerns, strictly separated:

- **React** — application-level UI and navigation only: app shell, navigation, lesson info, instructions, progress indicators, assessment UI, result screens, settings, modals, forms, all non-canvas UI. Must not contain simulation or experiment logic.
- **Phaser** — interactive 2D simulation layer only: lab workspace, interactive lab objects, drag/drop, mouse/touch, object manipulation, animation, visual feedback, canvas rendering, audio/visual effects. Must not become app-wide state management or the business-rule layer.
- **Domain/Application** — owns experiment rules, validation, step progression, correct/incorrect logic, learning objectives, scoring, completion, progress calculation. Must not depend on React or Phaser.

## Project structure (target direction, not a scaffold)

Create folders progressively as Stages are implemented — do not pre-create every directory below before it's needed.

```text
src/
├── app/                # App.tsx, routes.tsx, providers/
├── core/                # config/, events/, types/
├── domain/
│   ├── experiments/     # entities/, value-objects/, rules/, repositories/
│   ├── learning/        # entities/, repositories/
│   └── progress/        # entities/, repositories/
├── application/         # experiments/, learning/, progress/ (use cases)
├── infrastructure/       # repositories/, storage/
├── game/                 # PhaserGame.ts, scenes/, objects/, components/, systems/, factories/, adapters/
├── presentation/         # components/, pages/, hooks/
├── data/                 # experiments/, lessons/ (JSON configs)
└── assets/               # images/, sprites/, backgrounds/, audio/, fonts/
```

`domain/experiments`, `domain/learning`, `domain/progress` correspond to Stage rules, learning-objective tracking, and overall progress state respectively — not new product terms; see `../../CONTEXT.md` for the product-facing Stage/Screen vocabulary these implement.

## Dependency rules

1. **Domain independence** — `domain/` must not import React, Phaser, DOM APIs, browser-specific APIs, or UI components. Framework-independent.
2. **Phaser independence from React UI** — Phaser scenes must not touch React components or the DOM (no `document.querySelector(...)` inside a scene) except at a documented infrastructure adapter boundary.
3. **React independence from Phaser internals** — React components must not directly manipulate Phaser game objects; communicate only through application-level commands/events/state.
4. **Application layer coordinates**: `Presentation → Application Use Case → Domain → Repository Interface → Infrastructure`.
5. **Phaser as adapter/presentation layer**: `Domain → Application → Phaser Adapter → Phaser Scene → Visual Simulation`. Phaser consumes application/domain results and visualizes them; it does not decide them.

## Scene lifecycle

```text
BootScene → PreloadScene → MainMenuScene → LabScene → ResultScene
```

- **BootScene**: Phaser init, global config, minimal bootstrapping.
- **PreloadScene**: load assets/fonts/audio/textures, show loading progress.
- **MainMenuScene**: Stage/experiment selection, start.
- **LabScene**: the primary simulation scene — lab workspace, interactive objects, `ExperimentRunner`, current step, interaction systems, visual feedback. One shared `LabScene` runs all 5 Stages; do not create a scene per Stage or per step (e.g. no `AptikStep1Scene`, `MediaKulturStep2Scene`).
- **ResultScene**: completion, score/result visualization, replay/continue.

## Data-driven Stage/step configuration

Stages are data/config consumed by `LabScene`, not hardcoded scenes:

```json
{
  "id": "media-kultur",
  "title": "Pembuatan Media Kultur",
  "steps": [
    { "id": "timbang-media", "type": "measurement" },
    { "id": "tambah-aquades", "type": "selection" },
    { "id": "sterilisasi-autoklaf", "type": "ordering" }
  ]
}
```

Reusable step types to design toward (implement only as needed, not all at once): Selection, Measurement, DragDrop, Connection, Drawing, Ordering, Assembly, Identification, Calculation, Observation. New Stage content should be addable as new data, without rewriting `LabScene`.

Stage 4 (Teknik Kerja Aseptik) is the concrete case for this pattern: a 6-step linear SOP (see `06-learning-interactions.md` → Stage 4, rationale in `../adr/0006-stage4-six-step-sequence.md`, which supersedes the 11-step ADR-0004) is 6 config entries, not 6 scenes or 6 hardcoded states. Adding a step is data; adding a step *mechanic* is not — each mechanic gets its own workspace component, keyed by the step's id:

```json
{
  "id": "teknik-kerja-aseptik",
  "title": "Teknik Kerja Aseptik",
  "steps": [
    { "id": "cuci-tangan", "type": "sequence" },
    { "id": "memakai-apd", "type": "equip" },
    { "id": "bersihkan-meja", "type": "clean" },
    { "id": "nyalakan-bunsen", "type": "selection" },
    { "id": "sterilisasi-jarum-ose", "type": "selection" },
    { "id": "inokulasi-kultur", "type": "dragdrop" }
  ]
}
```

Adding, reordering, or removing a step here is a data change only — no per-step code. That has held in practice: Langkah 2 and Langkah 3 were each added as one config entry plus one registry line, and the Screen shell did not change. What is *not* free is a new step **type**: `sequence`, `equip` and `clean` each own a workspace component, so the config is data-driven per step, not per mechanic. The three later entries above name types that do not exist yet.

The same `steps` array is also the source for Stage 4's Evaluation items (ordering, error-detection) per `06-learning-interactions.md` → Evaluasi, so step granularity is chosen for pedagogy (procedural precision) without an engineering cost tradeoff.

Note that Stage 4 as built is a DOM Screen rather than a `LabScene`; the data-driven property above is what carried over, not the Phaser hosting. See `TASKS.md` → Screen 9.

`ExperimentRunner` coordinates the current step (`MeasurementStep`, `SelectionStep`, `DragDropStep`, ...) but does not itself contain the rules — those live in `domain`/`application`.

```ts
interface ExperimentState {
  experimentId: string;
  currentStep: number;
  completed: boolean;
  score: number;
}
```

## React ↔ Phaser communication

Typed command/event bus, never direct instance coupling:

```text
React → Command → Application Layer → Phaser
Phaser → Event → Application Layer → React
```

Commands: Start Experiment, Reset Experiment, Pause Experiment. Events: Step Completed, Invalid Action, Experiment Completed, Object Selected. This is the concrete mechanism behind the Stage↔DOM-control-layer completion event described in `06-learning-interactions.md`.

## State management

- **Application state** (React/application layer): current page, selected lesson, user preferences.
- **Experiment state** (application/domain layer): current experiment, current step, completed steps, score, attempts, status.
- **Visual/game state** (Phaser only): sprite position, animation state, highlight state, particle effects, temporary visual state. Do not mirror every Phaser visual property into React state.

## Educational rule validation

Correctness never depends on visual coordinates or Phaser internals:

```ts
// preferred
validateConnection(componentA, componentB);

// avoid
if (spriteA.x === 120 && spriteB.x === 240) { /* ... */ }
```

```text
User Action → Validate Action → Correct? → yes: Progress → Next Step
                                          → no:  Feedback
```

## Routes

/ = Cover; /case = Case; /briefing = Briefing Lead QC; /guide = Guide; /missions = Missions; /missions/:stageId = Stage (LabScene + instruction panel DOM); /evidence = Evidence; /evaluation = Evaluation; /reflection = Reflection; /completion = Completion.

## Orientation

Orientation lock checked at app-shell level (not per-route): a media-query listener shows the rotate-prompt overlay and pauses the active Phaser scene (if any) without resetting progress. See `../adr/0002-landscape-only-orientation-lock.md` and `03-information-architecture.md`.

## Responsive strategy

Desktop, tablet, and phone landscape (see `03-information-architecture.md` for breakpoints). Phaser uses a responsive scaling strategy (e.g. `Phaser.Scale.FIT` within a bounded container) rather than one hardcoded canvas size. React UI stays outside the Phaser canvas wherever practical (instruction panel, top bar, feedback panel remain DOM per Stage screen spec).

## Session state

State: schemaVersion, sessionId, timestamps, currentRoute, orientationLocked, overallProgress, Stage records (canvas- or DOM-control-completed), Evidence Decision, evaluation answers/score, reflections, completion badge. Stage status: locked, available, in_progress, completed.

## Activity schema

Activity: id, type, prompt, instruction, items, correctAnswer, feedback (correct/incorrect/partial), score, retryAllowed. Type: single choice, multiple choice, sorting, drag_drop, fill_blank, true_false, branching. Phaser-rendered `drag_drop` activities carry a `domFallback` field defining the parallel DOM-control representation; both paths emit the same completion event.

## Scoring and persistence

Activity score configurable. Retry credit configurable. Reflection excluded from correctness score. Final score has a number and a qualitative label. Save after route change, answer, Stage completion, Evidence Decision, evaluation, reflection. Versioned localStorage (local-first: fully functional offline, no server round-trip required); if unavailable, fall back to in-memory with a visible warning. Reset requires confirmation.

## PWA

App-shell and asset caching via service worker so the core journey (Cover through Completion) works after first load without network. Progress persistence already local-first (localStorage), so offline use does not lose state. PWA install prompt is optional UI, not a functional requirement gate.

## Media

Audio only after user interaction, optional, with caption/transcript. WebP/AVIF fallback for DOM images; compressed texture atlases for Phaser sprites. Lazy-load Stage assets on Stage open (not preloaded at Missions), and don't load full-resolution assets at Cover.

## Security and privacy

HTTPS, sanitize reflection input, avoid identity-linked analytics without approval, privacy notice if telemetry is added, label all values as simulation (see `../../CONTEXT.md` → Simulated Value).

## Optional analytics

session_started, stage_opened, activity_submitted, activity_retried, stage_completed_via (canvas | dom_fallback), evidence_decision_submitted, evaluation_completed, reflection_submitted, completion_viewed. Never send reflection content.

## Performance targets

Lighthouse mobile 80+ (landscape phone width), LCP under 3s on a representative school connection, Phaser bundle lazy-loaded per Stage (not in the initial bundle), no blocking autoplay, all routes recover after refresh including `orientationLocked` state and PWA offline shell.

## Testing strategy

Testable without Phaser or a browser: experiment/Stage validation, step progression, scoring, learning rules, completion conditions, progress persistence — these live in `domain`/`application` specifically so they're unit-testable in isolation. Phaser-specific tests focus on interaction, scene lifecycle, object behavior, input handling. The educational rules that matter most for correctness must not require launching Phaser to test.

## Architectural goals / non-goals

Optimize for: maintainability, reusable Stage/step components, educational correctness, data-driven Stages, clear React/Phaser separation, testability, progressive scalability, mobile/touch support, offline/local-first, PWA. Avoid premature abstraction — no ECS, plugin system, or generic framework layer unless an actual Stage requirement justifies it. Preserve existing working structure where it doesn't conflict with this doc; do not rewrite working code merely to match the target folder layout.
