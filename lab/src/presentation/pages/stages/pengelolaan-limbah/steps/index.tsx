import type { ReactNode } from 'react';
import type { ProcedureId } from '../../../../../data/stages/pengelolaanLimbah';
import type { ProcedureProps } from '../types';
import { Prosedur01MengidentifikasiLimbahBiologis } from './Prosedur01MengidentifikasiLimbahBiologis';
import { Prosedur02MendekontaminasiLimbahBiologis } from './Prosedur02MendekontaminasiLimbahBiologis';
import { Prosedur03MendesinfeksiAreaKerja } from './Prosedur03MendesinfeksiAreaKerja';
import { Prosedur04MemilahLimbahLaboratorium } from './Prosedur04MemilahLimbahLaboratorium';

// Which component runs which of Stage 3's procedures, keyed by the step's own
// id rather than its position - same registry shape as Stage 2's
// kultur-mikroba/steps/index.tsx and Stage 4's teknik-aseptik/steps/index.tsx.
// Adding a LANGKAH is a new file plus one line here; nothing in the shell has
// to learn about it.
type ProcedureRenderer = (props: ProcedureProps) => ReactNode;

export const PROCEDURES: Record<ProcedureId, ProcedureRenderer> = {
  'mengidentifikasi-limbah-biologis': ({ step, runtime }) =>
    step.kind === 'identify' ? <Prosedur01MengidentifikasiLimbahBiologis step={step} runtime={runtime} /> : null,
  'mendekontaminasi-limbah-biologis': ({ step, runtime }) =>
    step.kind === 'decontaminate' ? <Prosedur02MendekontaminasiLimbahBiologis step={step} runtime={runtime} /> : null,
  'mendesinfeksi-area-kerja': ({ step, runtime }) =>
    step.kind === 'sequence' ? <Prosedur03MendesinfeksiAreaKerja step={step} runtime={runtime} /> : null,
  'memilah-limbah-laboratorium': ({ step, runtime }) =>
    step.kind === 'sort' ? <Prosedur04MemilahLimbahLaboratorium step={step} runtime={runtime} /> : null,
};
