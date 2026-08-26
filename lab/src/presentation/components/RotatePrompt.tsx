export function RotatePrompt() {
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: '#0a0e17',
        color: '#fff',
        zIndex: 1000,
        textAlign: 'center',
        padding: '1rem',
      }}
    >
      <span style={{ fontSize: '3rem' }} aria-hidden="true">
        ⟳
      </span>
      <p>Putar perangkat ke mode landscape untuk melanjutkan SteriLab.</p>
    </div>
  );
}
