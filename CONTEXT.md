# SteriLab

SteriLab is an interactive virtual microbiology lab (web app) where a student plays a food-microbiology analyst investigating a suspected food-poisoning case, practicing aseptic technique, culture media prep, and lab waste handling before making an evidence-based safe/unsafe call.

## Language

**Screen**:
A distinct navigable page/route in the app (Cover, Case, Briefing, Guide, Missions, Stage 1-5, Evidence, Evaluation, Reflection, Completion).
_Avoid_: Scene — the source proposal numbers "Scene" inconsistently (skips/reuses numbers) and it also collides with `Phaser.Scene`, an engine-internal implementation construct that does not necessarily map 1:1 to a Screen. Neither belongs in product/content vocabulary.

**Stage**:
One of the five hands-on simulator activities the Analyst performs inside the lab: APD (PPE), Area Kerja Aseptik, Pembuatan Media Kultur, Teknik Kerja Aseptik, Pengelolaan Limbah. Rendered in the Phaser canvas; every Stage also ships a parallel DOM control layer so it's fully completable by keyboard/screen reader without touching the canvas.
_Avoid_: Level, Task, Scene, Simulator (as a noun for the activity itself — "simulator" describes the canvas rendering, not the activity unit). Also avoid **Experiment**/**Step** as product vocabulary — those are `07-technical-spec.md` implementation terms (`ExperimentRunner`, data-driven step configs) for how a Stage is built internally, not a rename of Stage.

**Analyst**:
The role the student plays: a food-microbiology lab analyst responsible for the investigation. Second person ("kamu") throughout narration.
_Avoid_: Player, User, Student (fine in QA/pedagogy docs, but "Analyst" is the in-fiction role name).

**Lead QC**:
The in-fiction supervisor character who briefs the Analyst on investigation goals, procedure, and the importance of aseptic technique before the Stages begin.

**Evidence Decision**:
The branching choice point after all five Stages: the Analyst reviews sample data (colony count/CFU, media condition, observation notes) for sample SM-025 and decides Produk Aman or Produk Tidak Aman, then justifies the call from a reason list. Feedback is branch-specific.
_Avoid_: Verdict, Result (too generic — this is specifically the evidence-review decision point, distinct from the end-of-app Evaluation quiz).

**Simulated Value**:
Any lab parameter shown to the Analyst (CFU counts, thresholds, timings, temperatures) that is fictional/illustrative for the scenario, not a real validated microbiology standard. Must carry a simulated-data disclaimer and expert sign-off before release.
_Avoid_: presenting these as real-world lab reference values anywhere in copy.
