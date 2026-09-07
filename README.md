# SteriLab

SteriLab is a landscape-only web laboratory for Grade X vocational students in the Agribusiness of Agricultural Product Processing program (APHP, Phase E). The Analyst investigates a suspected food-poisoning case, practices microbiology procedures, reviews simulated evidence, and makes an Evidence Decision.

The application is learning software, not a source of real laboratory operating values or food-safety advice. Any displayed CFU count, threshold, duration, or temperature is simulated data and requires approval from an APHP or microbiology expert before release.

## Table of Contents

| Section | Content | Link |
| --- | --- | --- |
| Product | Purpose, role, and learning scope | [About](#about) |
| Flow | Screen sequence and the five Stages | [Learning flow](#learning-flow) |
| Status | Current implementation boundaries | [Implementation status](#implementation-status) |
| Architecture | SPA, React, Phaser, and assets | [Architecture](#architecture) |
| Structure | Main directory map | [Repository structure](#repository-structure) |
| Running | Install, dev, build, and testing | [Local development](#local-development) |
| Release | Asset optimization and Vercel deploy | [Build and deployment](#build-and-deployment) |
| Reference | PRD, ADRs, and task list | [Documentation](#documentation) |

## About

The Analyst plays the role of a food microbiology analyst. Learning follows Problem Based Learning: the case provides context, the Stages provide procedural practice, and the Evidence Decision asks the Analyst to read the evidence before choosing an outcome.

Topics covered:

- aseptic technique and laboratory safety (K3);
- workspace preparation and PPE;
- preparing and sterilizing culture media;
- simple aseptic inoculation;
- the impact of contamination on culture results; and
- laboratory waste management.

Terminology used in the product:

| Term | Meaning |
| --- | --- |
| Screen | A navigable page, such as Case or Missions. |
| Stage | One of the five hands-on activities. Never call it a level or scene. |
| Analyst | The learner's role within the story. The narrative addresses them as "you." |
| Lead QC | The in-story mentor who gives the briefing. |
| Evidence Decision | The choice between "Product Safe" and "Product Unsafe," based on evidence. |
| Simulated Value | An illustrative value for the scenario, not a real laboratory standard. |

## Learning flow

```text
Splash and Cover
  -> Case
  -> Lead QC Briefing
  -> Guide
  -> Missions
  -> Stage 1 through 5
  -> Evidence Decision
  -> Evaluation
  -> Reflection
  -> Completion
```

The five planned Stages:

| Stage | Focus |
| --- | --- |
| PPE Preparation | Selecting and putting on the appropriate PPE. |
| Aseptic Work Area | Setting up the area, tools, and work sequence. |
| Culture Media Preparation | Sequencing media preparation through sterilization. |
| Aseptic Technique | Performing six linear procedures. |
| Waste Management | Sorting waste into the correct disposal method. |

The Aseptic Technique Stage covers six procedures: handwashing, putting on PPE, cleaning the workbench, lighting the Bunsen burner, flaming the inoculation loop, and collecting and inoculating the culture. Internal ordering — such as heating and then cooling the loop — is validated within the relevant procedure itself.

## Implementation status

This repository is still under development. Splash and Cover, Case, Missions, and the Aseptic Technique Stage are the most complete parts of the build. The current source tree includes six procedure components for that Stage.

Briefing, Guide, Evidence, Evaluation, Reflection, Completion, and the remaining four Stages still need to be completed per the task list. [`TASKS.md`](TASKS.md) is the implementation and verification log to consult when picking the next piece of work.

## Architecture

- The application is a single-path SPA at `/`. Navigation uses an in-memory stack in `lab/src/app/navigation.tsx`, not `react-router` and not a per-Screen URL.
- React, Vite, and TypeScript handle the application shell, navigation, narrative pages, controls, and DOM accessibility.
- Phaser 3 provides the 2D simulation layer for Stages that need it. Phaser does not manage application state.
- Learning rules, progress, validation, and scoring are kept separate from the renderer wherever a Stage's implementation requires it.
- Every canvas-based Stage must have an equivalent DOM control path for keyboard and touch input. Canvas must never be the only way to complete an activity.
- The application renders only in landscape orientation. In portrait mode, a rotate prompt blocks interaction until the device returns to landscape.
- Progress is designed to be local-first. Currently, a page refresh still returns to Splash because Screen position is not yet persisted.

The Aseptic Technique Stage uses a data configuration in `lab/src/data/stages/teknikAseptik.ts`. The procedure registry selects the workspace by procedure id, so data order is independent of component position.

## Repository structure

```text
.
|-- CONTEXT.md              # product terminology and content boundaries
|-- TASKS.md                # implementation checklist and verification notes
|-- docs/
|   |-- prd/                # product requirements, design, interaction, QA
|   `-- adr/                # architecture decision records
|-- scripts/
|   `-- optimize-assets.py  # non-destructive WebP generator
|-- lab/
|   |-- assets/             # source assets tracked by Git
|   |-- assets-optimized/   # build-generated WebP, ignored by Git
|   |-- src/                # React, Phaser, data, and presentation code
|   |-- tests/              # Playwright test suite
|   `-- package.json        # project Node.js commands
|-- requirements.txt        # Python dependencies for asset optimization
`-- vercel.json              # disables Vercel's automatic Git deployments
```

## Local development

Use Node.js 22 or a Vite 8-compatible LTS version. Python is only required when running asset optimization.

```bash
cd lab
npm ci
npm run dev
```

Commands available from the `lab/` directory:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Runs the Vite development server. |
| `npm run build` | Runs TypeScript checks and produces a production build. |
| `npm run lint` | Runs Oxlint. |
| `npm run test:e2e` | Runs the Playwright test suite. |
| `npm run preview` | Serves the local build for preview. |

The Playwright viewport targets cover five landscape sizes and one portrait size to verify the rotate prompt. Run the e2e suite after any change to navigation, orientation, Stage interaction, or touch targets.

## Build and deployment

### Asset optimization

The optimizer recursively scans `lab/assets/` and writes smaller WebP files to `lab/assets-optimized/`, preserving the same folder structure. Source assets are never overwritten. Animated GIFs are preserved, SVGs are not rasterized, and any output larger than its source is discarded.

```bash
python -m pip install -r requirements.txt
python scripts/optimize-assets.py
```

Vite uses the optimized WebP files when available. If an optimized file doesn't exist or isn't smaller than the source, the original asset import is used instead. Because `lab/assets-optimized/` is generated at build time, it is not tracked by Git.

### Production deployment

[`vercel.json`](vercel.json) disables Vercel's automatic Git-based deployments. Production deployments run only through the [GitHub Actions workflow](.github/workflows/deploy.yml), triggered by a push to `main` or via `workflow_dispatch`.

Workflow sequence:

```text
checkout -> set up Python -> install Pillow -> optimize assets
         -> set up Node.js -> npm ci -> npm run build -> Vercel CLI deploy
```

Add the following secrets in the GitHub repository under `Settings -> Secrets and variables -> Actions`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

A more detailed deployment guide is available at [`docs/deployment.md`](docs/deployment.md).

## Accessibility and content boundaries

- The design target is WCAG 2.2 AA, including visible focus states, labels, a live region for feedback, audio captions or transcripts, and support for `prefers-reduced-motion`.
- The minimum touch target size is 44 x 44 px, including interactive areas on canvas.
- Feedback explains what needs correcting without judgmental language.
- Do not write or display procedural parameters as operational fact before expert sign-off.
- The MVP does not collect personal learner data. Reflection content must never be sent as analytics.

## Documentation

| Document | Purpose |
| --- | --- |
| [CONTEXT.md](CONTEXT.md) | Product terminology glossary and rules for simulated values. |
| [TASKS.md](TASKS.md) | Work status, implementation notes, and outstanding QA. |
| [PRD overview](docs/prd/00-overview.md) | Product summary and content scope. |
| [Product requirements](docs/prd/02-product-requirements.md) | MVP scope, requirements, and acceptance criteria. |
| [Learning interactions](docs/prd/06-learning-interactions.md) | Stage mechanics, Evidence Decision, and Evaluation. |
| [Technical specification](docs/prd/07-technical-spec.md) | Boundaries for React, Phaser, domain logic, state, and testing. |
| [Architecture decisions](docs/adr/) | Decisions on platform, orientation, navigation, and the six Stage 4 procedures. |
| [Deployment guide](docs/deployment.md) | GitHub secrets and the Vercel deploy flow. |
