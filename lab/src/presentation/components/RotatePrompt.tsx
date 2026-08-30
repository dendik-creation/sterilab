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
      <svg width="72" height="72" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <style>{`
          .phone-anim {
            transform-origin: 90px 90px;
            animation: rotate-phone 4s ease-in-out infinite;
          }
          @keyframes rotate-phone {
            0%, 20% { transform: rotate(0deg); }
            40%, 70% { transform: rotate(-90deg); }
            90%, 100% { transform: rotate(0deg); }
          }
        `}</style>

        <g className="phone-anim">
          <g transform="translate(32, 0)">
            <rect x="3" y="3" width="90" height="154" rx="18" fill={palette.offWhite} stroke={palette.deepBlue} strokeWidth="6" />
            <rect x="17" y="25" width="62" height="112" rx="8" fill={palette.skyBlue} />
            <rect x="35" y="10" width="26" height="5" rx="2.5" fill={palette.deepBlue} />
            <rect x="35" y="145" width="26" height="5" rx="2.5" fill={palette.deepBlue} />
          </g>
        </g>
      </svg>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, maxWidth: 420 }}>
        Putar perangkatmu
      </p>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 500, maxWidth: 360, opacity: 0.85 }}>
        SteriLab hanya berjalan di mode lanskap.
      </p>
    </div>
  );
}
