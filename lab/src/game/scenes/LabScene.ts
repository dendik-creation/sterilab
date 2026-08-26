import Phaser from 'phaser';
import type { StageId } from '../../core/types';
import { eventBus } from '../../core/events/eventBus';

export interface LabSceneData {
  stageId: StageId;
}

// One shared LabScene drives every Stage via ExperimentRunner + data-driven
// step configs (ADR-0003, ADR-0004) - never a scene per Stage or per step.
export class LabScene extends Phaser.Scene {
  private stageId!: StageId;

  constructor() {
    super('Lab');
  }

  create(data: LabSceneData): void {
    this.stageId = data.stageId;
    // ExperimentRunner wiring lands here as Stages are implemented.
  }

  shutdown(): void {
    void this.stageId;
  }

  completeStep(stepIndex: number): void {
    eventBus.emit('step:completed', { stageId: this.stageId, stepIndex });
  }
}
