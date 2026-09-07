import type { ProcedureStep, Rect } from '../../../../data/stages/kulturMikroba';
import type { Animation } from './geometry';

// The contract between KulturMikroba (the shell: chrome, PROSEDUR card,
// success note, navigation) and one procedure (the interactive workspace).
// Same split as Stage 4's teknik-aseptik/types.ts - see there for the full
// rationale.

export interface ProcedureFrame {
  src: string;
  alt: string;
  rect: Rect;
}

export interface ProcedureRuntime {
  isMobile: boolean;
  exiting: boolean;
  cardAnimation: Animation;
  playClick: () => void;
  setFrame: (frame: ProcedureFrame) => void;
  setMessage: (message: string) => void;
  complete: () => void;
}

export interface ProcedureProps<S extends ProcedureStep = ProcedureStep> {
  step: S;
  runtime: ProcedureRuntime;
}
