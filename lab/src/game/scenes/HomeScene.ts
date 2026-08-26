import Phaser from 'phaser';
import homeBgUrl from '../../../assets/images/02_scenes/home/home_bg.png';
import greetingUrl from '../../../assets/images/02_scenes/home/greeting.png';
import exploreBtnUrl from '../../../assets/images/02_scenes/home/explore_btn.png';
import mainLogoUrl from '../../../assets/images/00_identity/main_logo.png';
import bgmOnBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import exitBtnUrl from '../../../assets/images/01_reusable/buttons/exit_button.png';
import clickSfxUrl from '../../../assets/sounds/reusable/short/click.webm';
import { isAudioEnabled, toggleAudioEnabled } from '../../core/audio/audioSettings';

// Home scene per Figma "Sterilab-APHP" (node 2:3 "Home") - shown after the
// Analyst taps through the splash. "Mulai Menjelajah" hands control back to
// the host page (see ON_COMPLETE_REGISTRY_KEY in BootScene) to continue into
// the app; "Keluar" exits.
const ASSET_KEYS = {
  bg: 'home-bg',
  greeting: 'home-greeting',
  exploreBtn: 'home-explore-btn',
  logo: 'home-logo',
  bgmOnBtn: 'bgm-on-btn',
  bgmOffBtn: 'bgm-off-btn',
  exitBtn: 'exit-btn',
  clickSfx: 'click-sfx',
} as const;

const ON_COMPLETE_REGISTRY_KEY = 'onSplashComplete';

// Transition in ("bubble out"): every element pops from scale 0 up to its
// resting size. Transition out ("bubble in"): every element collapses back to
// scale 0 before the scene hands off. Per design-system convention (see
// docs/prd/04-design-system.md > Imagery, icon, motion): the background is
// never part of either transition, and elements bubble in/out staggered one
// after another, never all at once.
const BUBBLE_DURATION_MS = 550;
const BUBBLE_OUT_EASE = 'Back.easeOut';
const BUBBLE_IN_EASE = 'Back.easeIn';
const STAGGER_DELAY_MS = 120;

// Interactive-button micro-feedback (docs/prd/04-design-system.md > Button
// interaktif): hover scales up, click plays a quick bubble-in-then-out pulse.
const HOVER_SCALE_MULTIPLIER = 1.08;
const HOVER_DURATION_MS = 120;
const CLICK_PULSE_SCALE_MULTIPLIER = 0.92;
const CLICK_PULSE_DURATION_MS = 90;

export class HomeScene extends Phaser.Scene {
  // Every element that bubbles in/out, in stagger order - background excluded (never animated).
  private staggerElements: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('Home');
  }

  preload(): void {
    this.load.image(ASSET_KEYS.bg, homeBgUrl);
    this.load.image(ASSET_KEYS.greeting, greetingUrl);
    this.load.image(ASSET_KEYS.exploreBtn, exploreBtnUrl);
    this.load.image(ASSET_KEYS.logo, mainLogoUrl);
    this.load.image(ASSET_KEYS.bgmOnBtn, bgmOnBtnUrl);
    this.load.image(ASSET_KEYS.bgmOffBtn, bgmOffBtnUrl);
    this.load.image(ASSET_KEYS.exitBtn, exitBtnUrl);
    this.load.audio(ASSET_KEYS.clickSfx, clickSfxUrl);
  }

  create(): void {
    const { width, height } = this.scale;

    // Background is static - never part of the bubble in/out transition.
    this.add.image(width * 0.5, height * 0.5, ASSET_KEYS.bg).setDisplaySize(width, height);

    const logo = this.fitToWidth(this.add.image(width * 0.5, height * 0.444, ASSET_KEYS.logo), width * 0.571);
    const greeting = this.fitToWidth(this.add.image(width * 0.5, height * 0.66, ASSET_KEYS.greeting), width * 0.61);

    const exploreBtn = this.fitToWidth(
      this.add.image(width * 0.5, height * 0.812, ASSET_KEYS.exploreBtn).setInteractive({ useHandCursor: true }),
      width * 0.285,
    );
    this.addButtonInteractionFX(exploreBtn);
    exploreBtn.on(Phaser.Input.Events.POINTER_DOWN, this.handleExplore, this);

    const exitBtn = this.fitToWidth(
      this.add.image(width * 0.0776, height * 0.932, ASSET_KEYS.exitBtn).setInteractive({ useHandCursor: true }),
      width * 0.105,
    );
    this.addButtonInteractionFX(exitBtn);
    exitBtn.on(Phaser.Input.Events.POINTER_DOWN, this.handleExit, this);

    const soundKey = isAudioEnabled() ? ASSET_KEYS.bgmOnBtn : ASSET_KEYS.bgmOffBtn;
    const soundBtn = this.fitToWidth(
      this.add.image(width * 0.958, height * 0.071, soundKey).setInteractive({ useHandCursor: true }),
      width * 0.038,
    );
    this.addButtonInteractionFX(soundBtn);
    soundBtn.on(Phaser.Input.Events.POINTER_DOWN, () => this.handleToggleSound(soundBtn));

    this.staggerElements = [logo, greeting, exploreBtn, exitBtn, soundBtn];
    this.bubbleOutEntrance(this.staggerElements);
  }

  private fitToWidth(image: Phaser.GameObjects.Image, maxWidth: number): Phaser.GameObjects.Image {
    if (image.width > maxWidth) {
      const s = maxWidth / image.width;
      image.setScale(s);
    }
    return image;
  }

  // Hover-scale + click bubble-in/out pulse for any interactive button. Reads
  // the button's current scale as "resting" - must run before bubbleOutEntrance
  // zeroes it, so call this right after sizing the button in create().
  private addButtonInteractionFX(button: Phaser.GameObjects.Image): void {
    const restingScaleX = button.scaleX;
    const restingScaleY = button.scaleY;
    const hoverScaleX = restingScaleX * HOVER_SCALE_MULTIPLIER;
    const hoverScaleY = restingScaleY * HOVER_SCALE_MULTIPLIER;
    let isHovering = false;

    button.on(Phaser.Input.Events.POINTER_OVER, () => {
      isHovering = true;
      this.tweens.add({
        targets: button,
        scaleX: hoverScaleX,
        scaleY: hoverScaleY,
        duration: HOVER_DURATION_MS,
        ease: 'Sine.easeOut',
      });
    });

    button.on(Phaser.Input.Events.POINTER_OUT, () => {
      isHovering = false;
      this.tweens.add({
        targets: button,
        scaleX: restingScaleX,
        scaleY: restingScaleY,
        duration: HOVER_DURATION_MS,
        ease: 'Sine.easeOut',
      });
    });

    button.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.tweens.add({
        targets: button,
        scaleX: restingScaleX * CLICK_PULSE_SCALE_MULTIPLIER,
        scaleY: restingScaleY * CLICK_PULSE_SCALE_MULTIPLIER,
        duration: CLICK_PULSE_DURATION_MS,
        ease: BUBBLE_IN_EASE,
        onComplete: () => {
          this.tweens.add({
            targets: button,
            scaleX: isHovering ? hoverScaleX : restingScaleX,
            scaleY: isHovering ? hoverScaleY : restingScaleY,
            duration: CLICK_PULSE_DURATION_MS,
            ease: BUBBLE_OUT_EASE,
          });
        },
      });
    });
  }

  private bubbleOutEntrance(targets: Phaser.GameObjects.Image[]): void {
    const resting = targets.map((target) => ({ target, scaleX: target.scaleX, scaleY: target.scaleY }));

    for (const target of targets) {
      target.setScale(0).setAlpha(0);
    }

    resting.forEach(({ target, scaleX, scaleY }, i) => {
      const delay = i * STAGGER_DELAY_MS;
      this.tweens.add({ targets: target, alpha: 1, duration: BUBBLE_DURATION_MS, delay, ease: BUBBLE_OUT_EASE });
      this.tweens.add({ targets: target, scaleX, scaleY, duration: BUBBLE_DURATION_MS, delay, ease: BUBBLE_OUT_EASE });
    });
  }

  private bubbleInExit(onComplete: () => void): void {
    const targets = this.staggerElements;

    targets.forEach((target, i) => {
      const isLast = i === targets.length - 1;
      this.tweens.add({
        targets: target,
        scale: 0,
        alpha: 0,
        duration: BUBBLE_DURATION_MS,
        delay: i * STAGGER_DELAY_MS,
        ease: BUBBLE_IN_EASE,
        onComplete: isLast ? onComplete : undefined,
      });
    });
  }

  private handleToggleSound(button: Phaser.GameObjects.Image): void {
    const enabled = toggleAudioEnabled();
    button.setTexture(enabled ? ASSET_KEYS.bgmOnBtn : ASSET_KEYS.bgmOffBtn);
    if (enabled) this.sound.play(ASSET_KEYS.clickSfx);
  }

  private handleExit(): void {
    this.sound.play(ASSET_KEYS.clickSfx);
    window.close();
  }

  private handleExplore(): void {
    this.sound.play(ASSET_KEYS.clickSfx);
    this.bubbleInExit(() => {
      const onComplete = this.registry.get(ON_COMPLETE_REGISTRY_KEY) as (() => void) | undefined;
      onComplete?.();
    });
  }
}
