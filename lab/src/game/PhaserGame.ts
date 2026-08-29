import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { LabScene } from './scenes/LabScene';
import { ResultScene } from './scenes/ResultScene';
import type { StageId } from '../core/types';
import { isAudioEnabled, onAudioEnabledChange } from '../core/audio/audioSettings';
import { isPortrait, onOrientationChange } from '../core/orientation/orientationGate';

export interface PhaserGameData {
  stageId?: StageId;
}

// Design resolution matches the Figma frames (1920x1080). ENVELOP scales the
// canvas to fully cover its parent - cropping instead of letterboxing - so
// there's no empty space on real windows/monitors that aren't exactly 16:9
// (1920x1080, 1366x768, 1280x720 all render edge-to-edge).
const SCALE_CONFIG: Phaser.Types.Core.ScaleConfig = {
  mode: Phaser.Scale.ENVELOP,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: 1920,
  height: 1080,
};

// Global audio on/off (audioSettings.ts) drives Phaser's Sound Manager mute
// flag directly, so every scene's SFX/BGM respects it with no per-scene wiring.
function bindAudioMute(game: Phaser.Game): void {
  game.sound.mute = !isAudioEnabled();
  const unsubscribe = onAudioEnabledChange((enabled) => {
    game.sound.mute = !enabled;
  });
  game.events.once(Phaser.Core.Events.DESTROY, unsubscribe);
}

// A portrait dip must pause Phaser and mute audio without resetting progress
// (ADR-0002) - App.tsx only overlays RotatePrompt on top of the DOM, so the
// scene/input/audio pause must happen here instead of by unmounting the game.
function bindOrientationGate(game: Phaser.Game): void {
  let mutedByOrientation = false;

  const apply = (portrait: boolean) => {
    game.input.enabled = !portrait;

    for (const scene of game.scene.scenes) {
      const key = scene.sys.settings.key;
      if (portrait && game.scene.isActive(key)) game.scene.pause(key);
      if (!portrait && game.scene.isPaused(key)) game.scene.resume(key);
    }

    if (portrait && !game.sound.mute) {
      game.sound.mute = true;
      mutedByOrientation = true;
    } else if (!portrait && mutedByOrientation) {
      game.sound.mute = !isAudioEnabled();
      mutedByOrientation = false;
    }
  };

  apply(isPortrait());
  const unsubscribe = onOrientationChange(apply);
  game.events.once(Phaser.Core.Events.DESTROY, unsubscribe);
}

export function createPhaserGame(parent: HTMLElement, data?: PhaserGameData): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0a0e17',
    scale: SCALE_CONFIG,
    scene: [BootScene, PreloadScene, MainMenuScene, LabScene, ResultScene],
  });

  // Boot boots automatically (first entry in `scene`); stageId travels via the
  // registry instead of an explicit scene.start() so the real splash/preloader
  // (Boot -> Preload -> MainMenu) isn't pre-empted before it runs.
  game.registry.set('stageId', data?.stageId);
  bindAudioMute(game);
  bindOrientationGate(game);

  return game;
}

// Standalone splash for the app's first paint (CoverPage) - just Boot, no
// Stage chain behind it. onComplete fires once the Analyst taps through the
// "After Loading" prompt; the host page destroys this game and shows content.
export function createSplashGame(parent: HTMLElement, onComplete: () => void): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0a0e17',
    scale: SCALE_CONFIG,
    scene: [BootScene, HomeScene],
  });

  game.registry.set('onSplashComplete', onComplete);
  bindAudioMute(game);
  bindOrientationGate(game);

  return game;
}
