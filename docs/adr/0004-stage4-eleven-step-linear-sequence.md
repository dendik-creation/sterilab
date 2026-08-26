---
status: accepted
---

# Stage 4 (Teknik Kerja Aseptik): 11-step linear sequence, not 3 broad categories

Two alternatives were considered for Stage 4's internal structure: Alternatif 1 grouped the SOP into 3 broad categories (persiapan, pelaksanaan, penutupan), each a coarse multi-action block; Alternatif 2 breaks the same SOP into 11 granular, individually-validated linear steps: cuci tangan → pakai APD → nyalakan LAF + semprot alkohol → nyalakan Bunsen → sterilisasi jarum ose → dinginkan jarum ose → ambil sampel → inokulasi ke media → tutup tabung + label → inkubasi → bersihkan area kerja.

Chosen: Alternatif 2 (11-step linear).

Rejected: Alternatif 1 (3 broad categories) — coarser grouping loses the step-by-step precision the aseptic-technique learning objective is actually about (see `../../CONTEXT.md` and `02-product-requirements.md` → Tujuan pembelajaran: "ketelitian dan integritas analis"); a 3-category grouping cannot itself be reused as an "urutkan prosedur" or "deteksi langkah salah" Evaluation item the way 11 discrete steps can (see `06-learning-interactions.md` → Evaluasi).

The earlier objection to fine-grained steps — that a Godot-based implementation would need one scene/node per step, so 11 steps meant 11x the engineering surface of 3 categories — no longer applies: the stack is Phaser + React/Vite with one shared, data-driven `LabScene` (ADR-0001, ADR-0003). Under that architecture a step is a config entry (`{ "id": ..., "type": ... }`), not a scene or a node, so step count is a content/data cost, not a code cost (see `07-technical-spec.md` → Data-driven Stage/step configuration for the concrete 11-entry config).

Consequence: Stage 4's 11 steps are authored as data on the shared `LabScene`/`ExperimentRunner`, matching every other Stage's data-driven step pattern. The same step data doubles as the source for Stage 4's Evaluation ordering/error-detection items, so the granularity decision pays for itself twice (Stage completion + Evaluation) instead of once.
