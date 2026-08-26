---
status: accepted
---

# Clean Architecture (React/Phaser/domain split) + TypeScript + data-driven, scene-lifecycle Phaser

Stack gains TypeScript (was implicit JS in ADR-0001) and the codebase adopts Clean Architecture: a framework-independent `domain`/`application` layer owns experiment rules, validation, step progression, and scoring; React owns app-shell/navigation/non-canvas UI; Phaser owns only canvas rendering and interaction for the 5 Stages (per ADR-0001). Phaser scenes follow a fixed lifecycle (`BootScene` → `PreloadScene` → `MainMenuScene` → `LabScene` → `ResultScene`) with one shared `LabScene` driven by an `ExperimentRunner` over data-driven step configs (Selection, Measurement, DragDrop, Ordering, ...), not one scene per Stage or per step.

Rejected: one Phaser scene per Stage/step (`ResistorStep1Scene`-style) — rejected because it hardcodes content into code structure, so adding or reordering a Stage means writing a new scene instead of new data; a shared `LabScene` + step-type registry keeps Stage 1-5 (and any future Stage) additions data-only. Rejected: JS without a domain layer — rejected because correctness logic (e.g. "is this the right APD combination") would otherwise live inside Phaser scene code or React components, coupling educational rules to whichever renderer happens to host them and making them untestable without a browser.

Consequence: `domain`/`application` code must not import React, Phaser, or DOM APIs (enforced by the dependency rules below) — correctness checks like `validateConnection(componentA, componentB)` are pure functions, never `if (sprite.x === 120)`. React and Phaser talk only through a typed command/event bus, never direct references to each other's internals. This is a heavier structure than the project needs today (no src/ exists yet) — folders are created progressively as Stages are implemented, not scaffolded up front.
