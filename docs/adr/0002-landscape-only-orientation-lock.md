---
status: accepted
---

# Landscape-only, app-wide

The whole app — not just the 5 Phaser Stage canvases — runs landscape-only, with a rotate-device prompt shown on portrait. This supersedes the prior acceptance criterion ("Website usable di smartphone portrait dan tablet landscape") and the portrait breakpoint behavior previously specced for mobile (single column, tap-to-select stage stepper).

Rejected: landscape-only for Stages with portrait support elsewhere — rejected because switching orientation mid-journey (e.g. portrait dashboard to a Stage that forces landscape) is worse UX and doubles the breakpoint/QA matrix for no real gain, since Phaser's fixed-aspect canvas already forces landscape for a third of the journey.

Consequence: responsive breakpoints across the IA/design docs are redefined as landscape widths only; portrait phone use is explicitly out of scope and must show a rotate prompt rather than a degraded layout.
