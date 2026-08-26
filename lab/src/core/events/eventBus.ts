import type { ExperimentState, StageId } from '../types';

// Typed React <-> Phaser bridge. Neither side ever touches the other's
// internals directly (ADR-0003 / 07-technical-spec.md "React <-> Phaser communication").

export interface Commands {
  'experiment:start': { stageId: StageId };
  'experiment:reset': { stageId: StageId };
  'experiment:pause': { stageId: StageId };
}

export interface Events {
  'step:completed': { stageId: StageId; stepIndex: number };
  'action:invalid': { stageId: StageId; stepIndex: number; reason: string };
  'experiment:completed': ExperimentState;
  'object:selected': { stageId: StageId; objectId: string };
}

type Listener<T> = (payload: T) => void;

class TypedBus<Map extends { [K in keyof Map]: unknown }> {
  private target = new EventTarget();

  emit<K extends keyof Map & string>(type: K, payload: Map[K]): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail: payload }));
  }

  on<K extends keyof Map & string>(type: K, listener: Listener<Map[K]>): () => void {
    const handler = (event: Event) => listener((event as CustomEvent<Map[K]>).detail);
    this.target.addEventListener(type, handler);
    return () => this.target.removeEventListener(type, handler);
  }
}

export const commandBus = new TypedBus<Commands>();
export const eventBus = new TypedBus<Events>();
