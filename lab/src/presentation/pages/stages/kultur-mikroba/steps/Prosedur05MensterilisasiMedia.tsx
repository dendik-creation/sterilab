import { useEffect, useLayoutEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { prefersReducedMotion } from '../../../../../core/a11y/motion';
import type { Rect, SterilizeFrame, SterilizeStep } from '../../../../../data/stages/kulturMikroba';
import { CARD_RADIUS, CARD_SHADOW, COLOR, HAIRLINE, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { ClickHotspot } from '../ClickHotspot';
import { FloatingTab } from '../FloatingTab';
import { useTimeouts } from '../hooks';
import type { ProcedureProps } from '../types';

// Prosedur 5 - "Mensterilisasi Media" (Figma frames "5.5 - A/B/C"). Load the
// Erlenmeyer into the autoklaf, dial suhu/waktu in to the expected range,
// start the run, then wait for sterilization to finish - the art cuts to the
// loaded plate on the first click, then holds there (only its floating
// panel's own readout and the "Mulai Proses" button's state change) until the
// run times out on its own and cuts to the done plate.
//
// Everything the procedure owns lives here: which phase this is, which plate
// that implies, what suhu/waktu are currently dialled to, and when the step
// is done. The shell knows none of it.

type Phase = 'idle' | 'loaded' | 'sterilizing' | 'done';

const HINT_CARD = { x: 1437, y: 221.17, width: 426 };
const HINT_PILL = { dx: 98 };
const HINT_BODY = { dy: 242 - 221.17, minHeight: 244 - (242 - 221.17) };

const PHASE_INDEX: Record<Phase, number> = { idle: 0, loaded: 1, sterilizing: 1, done: 2 };

// The panel's own "Suhu"/"Waktu" readout (Figma nodes 298:2594/298:2595
// labels, 302:156/302:157 values) - centred over the panel graphic like the
// rest of its own text, hence the translateX(-50%) rather than a left edge.
const PANEL_READOUT = {
  suhuLabel: { x: 1335.85, y: 783.04 },
  suhuValue: { x: 1335.85, y: 854 },
  waktuLabel: { x: 1693.14, y: 783.04 },
  waktuValue: { x: 1700, y: 854 },
};

// The done plate's own LCD readout (Figma nodes 302:158/302:159), smaller and
// white since it's printed on the autoklaf's own screen rather than a
// floating card.
const SCREEN_READOUT = {
  suhu: { x: 1400.4, y: 341 },
  waktu: { x: 1400, y: 376 },
};

export function Prosedur05MensterilisasiMedia({ step, runtime }: ProcedureProps<SterilizeStep>) {
  const { exiting, playClick, setFrame, setMessage, complete } = runtime;
  const [phase, setPhase] = useState<Phase>('idle');
  const [temperature, setTemperature] = useState(step.temperatureDefault);
  const [duration, setDuration] = useState(step.durationDefault);
  const after = useTimeouts();

  const frame: SterilizeFrame = step.frames[PHASE_INDEX[phase]];
  const isValid =
    temperature === step.temperatureTarget && duration >= step.durationTargetMin && duration <= step.durationTargetMax;

  // Layout, not passive: the art is the feedback for the click that just
  // landed, so it has to be swapped in the same commit as the phase change.
  useLayoutEffect(() => {
    setFrame({ src: frame.src, alt: frame.alt, rect: step.backgroundRect });
  }, [setFrame, frame, step.backgroundRect]);

  useEffect(() => {
    const message =
      phase === 'idle'
        ? step.loadAccessibleName
        : phase === 'loaded'
          ? isValid
            ? step.startAccessibleName
            : step.outOfRangeMessage
          : phase === 'sterilizing'
            ? step.sterilizingMessage
            : `${step.successTitle} ${step.successBody}`;
    setMessage(message);
  }, [setMessage, phase, isValid, step]);

  const handleLoad = () => {
    if (phase !== 'idle') return;
    playClick();
    setPhase('loaded');
  };

  const adjustTemperature = (delta: number) => {
    if (phase !== 'loaded') return;
    playClick();
    setTemperature((value) =>
      Math.min(step.temperatureMax, Math.max(step.temperatureMin, value + delta)),
    );
  };

  const adjustDuration = (delta: number) => {
    if (phase !== 'loaded') return;
    playClick();
    setDuration((value) => Math.min(step.durationMax, Math.max(step.durationMin, value + delta)));
  };

  const handleStart = () => {
    if (phase !== 'loaded' || !isValid) return;
    playClick();
    setPhase('sterilizing');
    if (prefersReducedMotion()) {
      setPhase('done');
      complete();
      return;
    }
    after(step.sterilizeMs, () => {
      setPhase('done');
      complete();
    });
  };

  return (
    <>
      {phase === 'idle' && frame.hotspot && !exiting ? (
        <ClickHotspot rect={frame.hotspot} accessibleName={step.loadAccessibleName} onSelect={handleLoad} />
      ) : null}

      {(phase === 'loaded' || phase === 'sterilizing') && !exiting ? (
        <img
          src={step.panelSrc}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: S(step.panelRect.x),
            top: S(step.panelRect.y),
            width: S(step.panelRect.width),
            height: S(step.panelRect.height),
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {phase === 'loaded' || phase === 'sterilizing' ? (
        <PanelReadout step={step} temperature={temperature} duration={duration} />
      ) : null}

      {phase === 'loaded' && !exiting ? (
        <>
          <ControlButton
            rect={step.temperatureMinusRect}
            accessibleName={`Kurangi suhu, saat ini ${temperature}${step.temperatureUnit}`}
            disabled={temperature <= step.temperatureMin}
            onSelect={() => adjustTemperature(-step.temperatureStep)}
          />
          <ControlButton
            rect={step.temperaturePlusRect}
            accessibleName={`Tambah suhu, saat ini ${temperature}${step.temperatureUnit}`}
            disabled={temperature >= step.temperatureMax}
            onSelect={() => adjustTemperature(step.temperatureStep)}
          />
          <ControlButton
            rect={step.durationMinusRect}
            accessibleName={`Kurangi waktu, saat ini ${duration}${step.durationUnit}`}
            disabled={duration <= step.durationMin}
            onSelect={() => adjustDuration(-step.durationStep)}
          />
          <ControlButton
            rect={step.durationPlusRect}
            accessibleName={`Tambah waktu, saat ini ${duration}${step.durationUnit}`}
            disabled={duration >= step.durationMax}
            onSelect={() => adjustDuration(step.durationStep)}
          />
        </>
      ) : null}

      {phase === 'loaded' && !exiting ? (
        <button
          type="button"
          onClick={handleStart}
          disabled={!isValid}
          aria-label={isValid ? step.startAccessibleName : `${step.startAccessibleName}. ${step.outOfRangeMessage}`}
          aria-disabled={!isValid}
          style={{
            position: 'absolute',
            left: S(step.startButtonRect.x),
            top: S(step.startButtonRect.y),
            width: S(step.startButtonRect.width),
            height: S(step.startButtonRect.height),
            zIndex: 3,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}
        >
          <img
            src={step.startButtonSrc}
            alt=""
            aria-hidden="true"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              filter: isValid ? 'none' : 'grayscale(1)',
              opacity: isValid ? 1 : 0.55,
              transition: 'filter 160ms ease-out, opacity 160ms ease-out',
              pointerEvents: 'none',
            }}
          />
        </button>
      ) : null}

      {phase === 'done' ? <ScreenReadout temperature={temperature} duration={duration} step={step} /> : null}

      <HintCard step={step} animation={runtime.cardAnimation} />
    </>
  );
}

// A plain tap target over the panel's own "-"/"+" art (Figma draws no
// highlight box for these, unlike the load/start hotspots, since the panel
// itself is a single flattened image) - no visible chrome of its own so it
// doesn't compete with the art, just a slightly larger min-44px hit area and
// a light press feedback.
function ControlButton({
  rect,
  accessibleName,
  disabled,
  onSelect,
}: {
  rect: Rect;
  accessibleName: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-label={accessibleName}
      style={{
        position: 'absolute',
        left: S(rect.x),
        top: S(rect.y),
        width: `max(44px, ${S(rect.width)})`,
        height: `max(44px, ${S(rect.height)})`,
        zIndex: 3,
        padding: 0,
        border: 'none',
        borderRadius: S(18),
        background: 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 120ms ease-out',
      }}
      onPointerOver={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
      }}
      onPointerOut={(e) => (e.currentTarget.style.background = 'transparent')}
    />
  );
}

// Navy text over the floating control panel (Figma group "298:2577") - the
// panel graphic itself carries no text, it's all a DOM overlay like Langkah
// 3's pH readout.
function PanelReadout({ step, temperature, duration }: { step: SterilizeStep; temperature: number; duration: number }) {
  const centred = (x: number, y: number): CSSProperties => ({
    ...textBase,
    position: 'absolute',
    left: S(x),
    top: S(y),
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    zIndex: 3,
  });

  return (
    <>
      <span aria-hidden="true" style={{ ...centred(PANEL_READOUT.suhuLabel.x, PANEL_READOUT.suhuLabel.y), fontSize: T(24, 11), fontWeight: 800, color: COLOR.titleNavy, letterSpacing: '0.06em' }}>
        Suhu
      </span>
      <span aria-hidden="true" style={{ ...centred(PANEL_READOUT.suhuValue.x, PANEL_READOUT.suhuValue.y), fontSize: T(24, 11), fontWeight: 500, color: COLOR.titleNavy }}>
        {temperature}{step.temperatureUnit}
      </span>
      <span aria-hidden="true" style={{ ...centred(PANEL_READOUT.waktuLabel.x, PANEL_READOUT.waktuLabel.y), fontSize: T(24, 11), fontWeight: 800, color: COLOR.titleNavy, letterSpacing: '0.06em' }}>
        Waktu
      </span>
      <span aria-hidden="true" style={{ ...centred(PANEL_READOUT.waktuValue.x, PANEL_READOUT.waktuValue.y), fontSize: T(24, 11), fontWeight: 500, color: COLOR.titleNavy }}>
        {duration}{step.durationUnit}
      </span>
    </>
  );
}

// White text over the closed autoklaf's own screen (Figma nodes
// 302:158/302:159) on the done plate - shows whatever suhu/waktu the Analyst
// actually dialled in before starting the run.
function ScreenReadout({ step, temperature, duration }: { step: SterilizeStep; temperature: number; duration: number }) {
  const centred = (x: number, y: number): CSSProperties => ({
    ...textBase,
    position: 'absolute',
    left: S(x),
    top: S(y),
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    zIndex: 3,
  });

  return (
    <>
      <span aria-hidden="true" style={{ ...centred(SCREEN_READOUT.suhu.x, SCREEN_READOUT.suhu.y), fontSize: T(20, 9), fontWeight: 500, color: '#FFFFFF' }}>
        {temperature}{step.temperatureUnit}
      </span>
      <span aria-hidden="true" style={{ ...centred(SCREEN_READOUT.waktu.x, SCREEN_READOUT.waktu.y), fontSize: T(20, 9), fontWeight: 500, color: '#FFFFFF' }}>
        {duration}{step.durationUnit}
      </span>
    </>
  );
}

// Same floating card shape as Prosedur 1-4's own (Figma group "LANGKAH 6"):
// a blue tab overlapping a bordered white card with the task description, an
// "Instruksi :" label and the click instruction below it.
function HintCard({ step, animation }: { step: SterilizeStep; animation: Animation }) {
  return (
    <div
      className={animation.className}
      style={{
        position: 'absolute',
        left: S(HINT_CARD.x),
        top: S(HINT_CARD.y),
        width: S(HINT_CARD.width),
        zIndex: 4,
        animationDelay: `${animation.delay}ms`,
      }}
    >
      <div
        style={{
          marginTop: S(HINT_BODY.dy),
          minHeight: S(HINT_BODY.minHeight),
          background: '#FFFFFF',
          border: `${T(HAIRLINE, 1)} solid ${COLOR.navy}`,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: S(14),
          padding: `${S(28)} ${S(24)}`,
        }}
      >
        <span
          style={{
            ...textBase,
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(18, 9),
            fontWeight: 500,
            color: COLOR.navy,
          }}
        >
          {step.hint}
        </span>

        <span style={{ width: '100%', height: 'max(1px, 0.078cqw)', background: COLOR.divider }} />

        <span
          style={{
            ...textBase,
            alignSelf: 'flex-start',
            fontSize: T(18, 9),
            fontWeight: 800,
            color: COLOR.navy,
          }}
        >
          {step.instructionLabel}
        </span>
        <span
          style={{
            ...textBase,
            marginTop: S(-8),
            textAlign: 'center',
            lineHeight: 1.35,
            fontSize: T(18, 9),
            fontWeight: 500,
            color: COLOR.navy,
          }}
        >
          {step.instruction}
        </span>
      </div>

      <FloatingTab label={step.eyebrow} dx={HINT_PILL.dx} />
    </div>
  );
}
