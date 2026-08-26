---
status: accepted
---

# Phaser + React/Vite, scoped to the 5 Stages only

The source proposal specifies SteriLab as a Lumi (H5P Course Presentation) SPA. We're building it instead with Phaser (canvas) for the 5 hands-on simulator Stages and React/Vite (DOM) for every other screen — narrative, dashboards, evidence review, evaluation, reflection, completion. This departs from both the proposal's stated platform and the prior PRD's generic "any approved React/Vue framework" language.

Rejected: H5P/Lumi (proposal's own spec) — too constrained for the physics/animation-style interactions the Stages need, and ties content authoring to the H5P editor rather than the codebase. Rejected: Phaser for the whole app — narrative, dashboards, and forms are naturally DOM content; putting them in canvas would only add accessibility work (see ADR-0002 is unrelated; accessibility bridging for canvas is covered by the mandatory parallel DOM control layer on every Stage — see `CONTEXT.md` → Stage) for no benefit.

Consequence: only the 5 Stage screens carry Phaser's canvas-accessibility burden; the rest of the app gets standard DOM accessibility for free.
