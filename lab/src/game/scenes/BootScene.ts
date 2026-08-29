import Phaser from 'phaser';
import splashBgUrl from '../../../assets/images/02_scenes/01_splash/splash_bg.png';
import mainLogoUrl from '../../../assets/images/00_identity/main_logo.png';
import touchAnythingUrl from '../../../assets/images/02_scenes/01_splash/touch_anything.png';
import clickSfxUrl from '../../../assets/sounds/01_reusable/short/click.webm';
import { palette, paletteHex } from '../../core/theme/palette';
import { prefersReducedMotion } from '../../core/a11y/motion';

// Per-Stage Phaser loading gate - preloads this Stage's own game assets and
// waits for a tap (needed to unlock this Phaser.Game's own AudioContext)
// before handing off to Preload -> MainMenu -> Lab. The app's actual first-run
// splash/cover is React's SplashPage now (ADR-0001/0005); visuals here still
// follow the same Figma "Sterilab-APHP" frames (node 9:500 Loading / 9:501
// After Loading) so a Stage load looks consistent with it.
const ASSET_KEYS = {
  splashBg: 'splash-bg',
  mainLogo: 'main-logo',
  touchAnything: 'touch-anything',
  clickSfx: 'click-sfx',
} as const;

const TEXT_COLOR = palette.deepBlue;
const FONT_FAMILY = "'Plus Jakarta Sans Variable', system-ui, 'Segoe UI', Roboto, sans-serif";

// These local identity/splash assets are tiny and load near-instantly, which made
// the Loading frame's progress bar flash or skip entirely before it could ever be
// seen. Floor the bar's on-screen time to this many seconds - tune here.
const MIN_LOADING_DISPLAY_SECONDS = 1;

// "Bubble out" entrance: every rendered asset pops in from 0 scale with a slight
// overshoot instead of just appearing.
const BUBBLE_DURATION_MS = 550;
const BUBBLE_EASE = 'Back.easeOut';

interface BubbleTarget {
  target: Phaser.GameObjects.GameObject;
  scaleX: number;
  scaleY: number;
}

export class BootScene extends Phaser.Scene {
  private progressGroup!: Phaser.GameObjects.Container;
  private progressTrack!: Phaser.GameObjects.Graphics;
  private progressFill!: Phaser.GameObjects.Graphics;
  private progressBorder!: Phaser.GameObjects.Graphics;
  private progressLabel!: Phaser.GameObjects.Text;
  private barWidth = 0;
  private barHeight = 0;
  private borderWidth = 0;
  private assetsReady = false;
  private minDisplayElapsed = false;

  constructor() {
    super('Boot');
  }

  // Pops one or more game objects in from scale 0 with a bubble-style overshoot.
  private bubbleIn(entries: BubbleTarget | BubbleTarget[], delay = 0): void {
    const list = Array.isArray(entries) ? entries : [entries];

    if (prefersReducedMotion()) {
      for (const { target, scaleX, scaleY } of list) {
        const t = target as unknown as { setScale: (x: number, y: number) => void; setAlpha: (a: number) => void };
        t.setScale(scaleX, scaleY);
        t.setAlpha(1);
      }
      return;
    }

    for (const { target } of list) {
      const t = target as unknown as { setScale: (x: number, y: number) => void; setAlpha: (a: number) => void };
      t.setScale(0, 0);
      t.setAlpha(0);
    }

    this.tweens.add({
      targets: list.map((entry) => entry.target),
      alpha: 1,
      duration: BUBBLE_DURATION_MS,
      delay,
      ease: BUBBLE_EASE,
    });

    for (const { target, scaleX, scaleY } of list) {
      this.tweens.add({
        targets: target,
        scaleX,
        scaleY,
        duration: BUBBLE_DURATION_MS,
        delay,
        ease: BUBBLE_EASE,
      });
    }
  }

  preload(): void {
    const { width, height } = this.scale;
    this.barWidth = width * 0.375;
    this.barHeight = height * 0.024;
    this.borderWidth = Math.max(2, Math.round(width * 0.0030));

    this.progressGroup = this.add.container(width / 2, height * 0.62 + this.barHeight / 2).setDepth(2);

    this.progressTrack = this.add.graphics();
    this.progressTrack.fillStyle(paletteHex.paleBlue, 1);
    this.progressTrack.fillRoundedRect(
      -this.barWidth / 2,
      -this.barHeight / 2,
      this.barWidth,
      this.barHeight,
      this.barHeight / 2,
    );

    this.progressFill = this.add.graphics();

    // Stroke-only outline, added after the fill so the white border always
    // reads on top of the bar - even once the fill reaches 100% width.
    this.progressBorder = this.add.graphics();
    this.progressBorder.lineStyle(this.borderWidth, paletteHex.offWhite, 1);
    this.progressBorder.strokeRoundedRect(
      -this.barWidth / 2,
      -this.barHeight / 2,
      this.barWidth,
      this.barHeight,
      this.barHeight / 2,
    );

    this.progressLabel = this.add
      .text(0, this.barHeight / 2 + height * 0.025, '0% Memuat Konten', {
        fontFamily: FONT_FAMILY,
        fontSize: `${Math.round(width * 0.0125)}px`,
        color: TEXT_COLOR,
      })
      .setOrigin(0.5, 0);

    this.progressGroup.add([this.progressTrack, this.progressFill, this.progressBorder, this.progressLabel]);
    this.bubbleIn({ target: this.progressGroup, scaleX: 1, scaleY: 1 }, 300);

    // Real preload - the scene will not advance until these are actually loaded.
    this.load.image(ASSET_KEYS.splashBg, splashBgUrl);
    this.load.image(ASSET_KEYS.mainLogo, mainLogoUrl);
    this.load.image(ASSET_KEYS.touchAnything, touchAnythingUrl);
    this.load.audio(ASSET_KEYS.clickSfx, clickSfxUrl);

    // Mock progress animation covering the floor above - decoupled from raw byte
    // progress (which would otherwise jump 0 -> 100 in under a frame here).
    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: MIN_LOADING_DISPLAY_SECONDS * 1000,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => this.setProgressDisplay(tween.getValue() ?? 0),
      onComplete: () => {
        this.minDisplayElapsed = true;
        this.tryProceed();
      },
    });
  }

  private setProgressDisplay(percent: number): void {
    const clamped = Phaser.Math.Clamp(percent, 0, 100);
    const fillWidth = Math.max(this.barHeight, this.barWidth * (clamped / 100));

    this.progressFill.clear();
    this.progressFill.fillStyle(paletteHex.deepBlue, 1);
    this.progressFill.fillRoundedRect(-this.barWidth / 2, -this.barHeight / 2, fillWidth, this.barHeight, this.barHeight / 2);
    this.progressLabel.setText(`${Math.round(clamped)}% Memuat Konten`);
  }

  create(): void {
    const { width, height } = this.scale;

    const bg = this.add.image(width / 2, height / 2, ASSET_KEYS.splashBg).setDepth(0);
    bg.setDisplaySize(width, height);

    const logo = this.add.image(width / 2, height * 0.32, ASSET_KEYS.mainLogo).setDepth(1);
    const maxLogoWidth = width * 0.6;
    const logoScale = logo.width > maxLogoWidth ? maxLogoWidth / logo.width : 1;
    this.bubbleIn({ target: logo, scaleX: logoScale, scaleY: logoScale }, 150);

    this.assetsReady = true;
    this.tryProceed();
  }

  private tryProceed(): void {
    if (!this.assetsReady || !this.minDisplayElapsed) return;

    const { width, height } = this.scale;
    this.setProgressDisplay(100);
    this.showAfterLoading(width, height);
  }

  // Figma "After Loading" state (9:501): drop the loading bar, reveal the
  // touch-anything prompt, and wait for the Analyst to advance.
  private showAfterLoading(width: number, height: number): void {
    this.progressGroup.destroy();

    const touchIcon = this.add.image(width / 2, height * 0.62, ASSET_KEYS.touchAnything).setDepth(2);
    const tapLabel = this.add
      .text(width / 2, height * 0.75, 'Ketuk di mana saja untuk melanjutkan', {
        fontFamily: FONT_FAMILY,
        fontSize: `${Math.round(width * 0.0141)}px`,
        color: TEXT_COLOR,
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.bubbleIn([
      { target: touchIcon, scaleX: 1, scaleY: 1 },
      { target: tapLabel, scaleX: 1, scaleY: 1 },
    ]);

    if (!prefersReducedMotion()) {
      this.tweens.add({
        targets: touchIcon,
        scale: { from: 1, to: 1.08 },
        duration: 900,
        delay: BUBBLE_DURATION_MS,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Tap/click only - the Figma prompt says "Ketuk" (tap). A stray keypress
    // (Tab, arrow keys, devtools regaining focus, etc) must not skip the splash.
    this.input.once(Phaser.Input.Events.POINTER_DOWN, this.goNext, this);
  }

  private goNext(): void {
    this.sound.play(ASSET_KEYS.clickSfx);
    this.requestFullscreen();
    this.scene.start('Preload');
  }

  // Must run synchronously inside the tap's pointerdown handler - browsers only
  // grant the Fullscreen API within a real user-gesture call stack. SplashPage
  // (React) already requests fullscreen once before any Stage is reachable;
  // this is a no-op then, and only does real work if the Analyst dropped out
  // of fullscreen (e.g. pressed Escape) since - the per-Stage tap gesture that
  // unlocks this Phaser game's own AudioContext doubles as recovery for that.
  private requestFullscreen(): void {
    if (this.scale.fullscreen.available && !this.scale.isFullscreen) {
      this.scale.startFullscreen();
    }
  }
}
