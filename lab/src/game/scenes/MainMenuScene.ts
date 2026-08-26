import Phaser from 'phaser';
import type { StageId } from '../../core/types';

export interface MainMenuData {
  stageId: StageId;
}

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create(data: MainMenuData): void {
    if (data?.stageId) {
      this.scene.start('Lab', data);
    }
  }
}
