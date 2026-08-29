import { palette } from '../../core/theme/palette';

// Rendered by OrientationGuard while portrait (ADR-0002). Strict block: the
// app content behind this is `inert` (removed from tab order + a11y tree),
// so this overlay is the only thing reachable - its own copy must therefore
// carry the reassurance ("progres kamu tersimpan") a user would otherwise
// get from seeing the app still there behind a lighter overlay.
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
        gap: 16,
        background: palette.paleBlue,
        color: palette.deepBlue,
        fontFamily: "'Plus Jakarta Sans Variable', system-ui, 'Segoe UI', Roboto, sans-serif",
        textAlign: 'center',
        padding: '0 32px',
        touchAction: 'none',
      }}
    >
      <svg width="72" height="72" viewBox="0 0 96 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="3" width="90" height="154" rx="18" fill={palette.offWhite} stroke={palette.deepBlue} strokeWidth="6" />
        <rect x="17" y="25" width="62" height="112" rx="8" fill={palette.skyBlue} />
        <rect x="35" y="10" width="26" height="5" rx="2.5" fill={palette.deepBlue} />
        <rect x="35" y="145" width="26" height="5" rx="2.5" fill={palette.deepBlue} />
        <path d="M60 45c14 3 22 15 20 28" stroke={palette.deepBlue} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M85 66l-6 10-11-4" stroke={palette.deepBlue} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, maxWidth: 420 }}>
        SteriLab hanya berjalan di mode lanskap
      </p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 500, maxWidth: 360, opacity: 0.85 }}>
        Putar perangkatmu. Progres kamu tetap tersimpan dan lab akan lanjut begitu layar kembali lanskap.
      </p>
    </div>
  );
}
