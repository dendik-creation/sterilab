import { palette } from '../../core/theme/palette';

// App-shell level orientation gate (ADR-0002, useOrientationLock) - not per-scene.
export function RotatePrompt() {
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        background: palette.paleBlue,
        color: palette.deepBlue,
        fontFamily: "'Plus Jakarta Sans Variable', system-ui, 'Segoe UI', Roboto, sans-serif",
        textAlign: 'center',
        padding: '0 32px',
        touchAction: 'none',
      }}
    >
      <svg width="72" height="72" viewBox="0 0 96 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="90" height="154" rx="18" fill={palette.offWhite} stroke={palette.deepBlue} strokeWidth="6" />
        <rect x="17" y="25" width="62" height="112" rx="8" fill={palette.skyBlue} />
        <rect x="35" y="10" width="26" height="5" rx="2.5" fill={palette.deepBlue} />
        <rect x="35" y="145" width="26" height="5" rx="2.5" fill={palette.deepBlue} />
      </svg>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 800, maxWidth: 420 }}>
        Putar perangkat ke mode lanskap
      </p>
    </div>
  );
}
