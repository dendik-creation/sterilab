import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // Stage assets are lazy-loaded per Stage on open, not here
    // (07-technical-spec.md > Media / Performance targets).
  }

  create(): void {
    this.scene.start('MainMenu');
  }
}
