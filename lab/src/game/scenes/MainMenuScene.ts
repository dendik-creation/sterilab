import Phaser from 'phaser';
import type { StageId } from '../../core/types';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create(): void {
    const stageId = this.registry.get('stageId') as StageId | undefined;
    if (stageId) {
      this.scene.start('Lab', { stageId });
    }
  }
}
