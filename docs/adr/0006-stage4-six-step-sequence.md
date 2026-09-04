---
status: accepted
supersedes: 0004-stage4-eleven-step-linear-sequence.md
---

# Stage 4 (Teknik Kerja Aseptik): 6 linear steps, folding the 11 authored ones

ADR-0004 broke Stage 4's SOP into 11 granular linear steps, rejecting a 3-category grouping. That choice is only half revised here: the sequence stays granular and linear, but it ships as **6 steps**, not 11.

Chosen: the six steps the design's own canvas now authors, in this order — Cuci tangan; Memakai APD; Membersihkan Meja Kerja; Menyalakan Bunsen; Sterilisasi Jarum Ose; Mengambil dan Menginokulasi Kultur.

## Why the count changed

Three counts were live at once, and none of them agreed:

- **12** — the Figma canvas `42:678` shipped frames LANGKAH 1..12, and the counter in the PROSEDUR card read "Langkah N / 12".
- **11** — ADR-0004 and the PRD (`05-content-and-storyboard.md` → Stage 4, `06-learning-interactions.md` → Stage 4, `07-technical-spec.md`).
- **6** — the product decision, taken after the 12 frames were reviewed.

The tie-break is not arbitrary. The same canvas now carries a revised frame per step — `42:679`, `58:2`, `61:541`, `61:542`, `61:543`, `259:21`, each named "LANGKAH n NEW" and each with its own authored title, copy and artwork in its PROSEDUR card. The design has already been drawn at six. Holding the code at 11 would mean authoring five steps that no frame exists for, and re-cutting six that do.

## How the 11 fold into the 6

| # | Step | From ADR-0004's 11 | Figma frame |
| --- | --- | --- | --- |
| 1 | Cuci tangan | 1 | `42:679` |
| 2 | Memakai APD | 2 | `58:2` |
| 3 | Membersihkan Meja Kerja | 3 (LAF + semprot alkohol) + 11 (bersihkan area kerja) | `61:541` |
| 4 | Menyalakan Bunsen | 4 | `61:542` |
| 5 | Sterilisasi Jarum Ose | 5 (sterilisasi) + 6 (dinginkan) | `61:543` |
| 6 | Mengambil dan Menginokulasi Kultur | 7 (ambil sampel) + 8 (inokulasi) + 9 (tutup + label) + 10 (inkubasi) | `259:21` |

Four of the six are one PRD step unchanged. The folding is concentrated in steps 3, 5 and 6, and each fold groups actions that share one workspace and one tool — not three broad phases of the SOP.

## What ADR-0004 decided that still holds

- **Granular linear steps, not 3 broad categories.** Six steps over one SOP is still step-by-step: each is a single validated action on a single workspace, which is the precision the aseptic-technique objective is about (`02-product-requirements.md` → Tujuan pembelajaran). Alternatif 1's "persiapan / pelaksanaan / penutupan" would still be rejected today.
- **Step count is a content cost, not an engineering one.** Steps are config entries in `src/data/stages/teknikAseptik.ts`, proven twice now: Langkah 2 and Langkah 3 were both added as data plus one registry line, with no change to the Screen shell. What is *not* free is a new **mechanic** — `sequence`, `equip` and `clean` each need their own workspace component — so the config is data-driven per step, not per mechanic.
- **The same step data feeds Evaluation.** Ordering and error-detection items are still generated from this list rather than authored separately.

## Consequences

- **`TOTAL_STEPS = 6`**, and the counter reads "Langkah N / 6". The marker row is authored at six by the design (41.16 dots on a 64.4165 pitch, centred on the card), not the twelve-step row thinned out.
- **Evaluation's ordering item becomes 6 items, not 11** (`06-learning-interactions.md` → Evaluasi, Screen 12 in `TASKS.md`). This is the real cost of this ADR: a 6-item ordering task is easier than an 11-item one. It is accepted because the alternative — asking the Analyst to order 11 steps the Stage never walked them through — tests recall of a document rather than of the procedure they performed.
- **Error-detection items get finer, not coarser, in one place.** Folds 3, 5 and 6 each contain an internal order (spray before wipe; heat before cool; inoculate before label before incubate) that a step can validate inside itself, so "langkah yang salah/hilang" can still be asked about those actions — just within a step rather than between steps.
- **The heat/cool validation moves inside step 5.** ADR-0004 made "dinginkan jarum ose" a step of its own precisely so that using a glowing loop could be refused as an out-of-order step. Folded, that check is now step 5's own internal rule, and `TASKS.md` → Screen 9 keeps it as an explicit requirement rather than letting it dissolve into the fold. This is the one place where six steps is measurably weaker than eleven, and it is the fold to revisit first if step 5 turns out not to carry it.
- **The PRD's 11 step descriptions are not deleted.** `05-content-and-storyboard.md` keeps them as the content inventory of what happens inside each of the six; they stop being the step *list*.
