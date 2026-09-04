import type { ProcedureStep, Rect } from '../../../../data/stages/teknikAseptik';
import type { Animation } from './geometry';

// The contract between TeknikAseptikPage (the shell: chrome, PROSEDUR card,
// success note, navigation) and one procedure (the interactive workspace).
//
// Stage 4 ships six procedures on one Screen. Only the workspace differs between
// them - the chrome around it never does - so a procedure is a component that
// owns its own state and interaction and reports three things back up: which
// frame of art is showing, what a screen reader should hear, and whether it is
// finished. Adding procedure 3 is a new file plus one line in `steps/index.tsx`;
// nothing in the shell has to learn about it.

// The workspace art currently on screen. It travels up because the shell paints
// it in two places at once (the crisp copy in the safe layer and the blurred
// bleed behind it), and because only the procedure knows when it changes.
export interface ProcedureFrame {
  src: string;
  alt: string;
  rect: Rect;
}

export interface ProcedureRuntime {
  isMobile: boolean;
  // True while the Screen is playing its exit stagger: a procedure must stop
  // offering hotspots and drop targets that are about to animate away.
  exiting: boolean;
  // Entrance/exit beat for the procedure's own floating card on the right. It
  // is the third rung of the Screen's stagger ladder and the first of its
  // reverse, so the shell hands it down rather than each procedure re-deriving
  // the same two delays.
  cardAnimation: Animation;
  playClick: () => void;
  setFrame: (frame: ProcedureFrame) => void;
  // Text for the Screen's single aria-live region. Progress has to reach a
  // screen reader too, not only the art swapping underneath
  // (TASKS.md > Aturan Lintas Screen).
  setMessage: (message: string) => void;
  // The procedure is done; the shell raises the success note and the LANJUT
  // button. Called after the procedure's own art has settled, never before.
  complete: () => void;
}

export interface ProcedureProps<S extends ProcedureStep = ProcedureStep> {
  step: S;
  runtime: ProcedureRuntime;
}
