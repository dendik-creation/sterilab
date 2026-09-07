import type { ReactNode } from 'react';
import type { ProcedureId } from '../../../../../data/stages/kulturMikroba';
import type { ProcedureProps } from '../types';
import { Prosedur01PenimbanganNutrisi } from './Prosedur01PenimbanganNutrisi';
import { Prosedur02MelarutkanMedia } from './Prosedur02MelarutkanMedia';
import { Prosedur03MengaturPh } from './Prosedur03MengaturPh';
import { Prosedur04MenyiapkanSterilisasi } from './Prosedur04MenyiapkanSterilisasi';
import { Prosedur05MensterilisasiMedia } from './Prosedur05MensterilisasiMedia';
import { Prosedur06MenuangkanMedia } from './Prosedur06MenuangkanMedia';

// Which component runs which of Stage 2's procedures, keyed by the step's own
// id rather than its position - same registry shape as Stage 4's
// teknik-aseptik/steps/index.tsx. Adding a LANGKAH is a new file plus one line
// here; nothing in the shell has to learn about it.
type ProcedureRenderer = (props: ProcedureProps) => ReactNode;

export const PROCEDURES: Record<ProcedureId, ProcedureRenderer> = {
  'penimbangan-nutrisi': ({ step, runtime }) =>
    step.kind === 'weigh' ? <Prosedur01PenimbanganNutrisi step={step} runtime={runtime} /> : null,
  'melarutkan-media': ({ step, runtime }) =>
    step.kind === 'dissolve' ? <Prosedur02MelarutkanMedia step={step} runtime={runtime} /> : null,
  'mengatur-ph': ({ step, runtime }) =>
    step.kind === 'measure' ? <Prosedur03MengaturPh step={step} runtime={runtime} /> : null,
  'menyiapkan-sterilisasi': ({ step, runtime }) =>
    step.kind === 'assemble' ? <Prosedur04MenyiapkanSterilisasi step={step} runtime={runtime} /> : null,
  'mensterilisasi-media': ({ step, runtime }) =>
    step.kind === 'sterilize' ? <Prosedur05MensterilisasiMedia step={step} runtime={runtime} /> : null,
  'menuangkan-media': ({ step, runtime }) =>
    step.kind === 'assemble' ? <Prosedur06MenuangkanMedia step={step} runtime={runtime} /> : null,
};
