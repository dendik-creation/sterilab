import type { ReactNode } from 'react';
import type { ProcedureId } from '../../../../../data/stages/teknikAseptik';
import type { ProcedureProps } from '../types';
import { Prosedur01CuciTangan } from './Prosedur01CuciTangan';
import { Prosedur02MemakaiApd } from './Prosedur02MemakaiApd';
import { Prosedur03MembersihkanMeja } from './Prosedur03MembersihkanMeja';
import { Prosedur04MenyalakanBunsen } from './Prosedur04MenyalakanBunsen';

// Which component runs which of Stage 4's procedures.
//
// Keyed by the step's own id rather than by its position, so reordering the
// list in data/stages/teknikAseptik.ts cannot silently hand a procedure the
// wrong workspace. Each entry narrows the ProcedureStep union itself - that is
// what lets Prosedur02MemakaiApd be typed against EquipStep and read
// `step.items` without a cast, while the registry stays one flat table.
//
// Authoring LANGKAH 5: add the id to ProcedureId, the step object to
// PROCEDURE_STEPS, a Prosedur05*.tsx beside this file, and one line here.
type ProcedureRenderer = (props: ProcedureProps) => ReactNode;

export const PROCEDURES: Record<ProcedureId, ProcedureRenderer> = {
  'cuci-tangan': ({ step, runtime }) =>
    step.kind === 'sequence' ? <Prosedur01CuciTangan step={step} runtime={runtime} /> : null,
  'memakai-apd': ({ step, runtime }) =>
    step.kind === 'equip' ? <Prosedur02MemakaiApd step={step} runtime={runtime} /> : null,
  'bersihkan-meja': ({ step, runtime }) =>
    step.kind === 'clean' ? <Prosedur03MembersihkanMeja step={step} runtime={runtime} /> : null,
  'nyalakan-bunsen': ({ step, runtime }) =>
    step.kind === 'bunsen' ? <Prosedur04MenyalakanBunsen step={step} runtime={runtime} /> : null,
};
