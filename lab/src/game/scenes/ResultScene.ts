import Phaser from 'phaser';
import type { ExperimentState } from '../../core/types';
import { eventBus } from '../../core/events/eventBus';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(state: ExperimentState): void {
    eventBus.emit('experiment:completed', state);
  }
}
