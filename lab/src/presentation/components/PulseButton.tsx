import type { CSSProperties, KeyboardEvent } from 'react';

// Wraps a sliced button image (Figma-provided PNG, e.g. baca_selengkapnya_btn
// / lanjut_briefing_btn) with a soft pulsing ring behind it, so the Analyst
// reads it as clickable even though it's just an <img> otherwise (04-design-system.md
// > hover feedback). Keyboard-operable (Enter/Space) in addition to click/tap.
interface PulseButtonProps {
  src: string;
  alt: string;
  onClick: () => void;
  style: CSSProperties;
  ringColor?: string;
}

export function PulseButton({ src, alt, onClick, style, ringColor = '#357EC1' }: PulseButtonProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div style={{ position: 'absolute', ...style }}>
      <span
        aria-hidden="true"
        className="sterilab-pulse-ring"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          background: ringColor,
        }}
      />
      <button
        type="button"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          height: '100%',
          border: 'none',
          padding: 0,
          background: 'transparent',
          cursor: 'pointer',
          transition: 'transform 120ms ease-out, filter 120ms ease-out',
        }}
        onPointerOver={(e) => (e.currentTarget.style.transform = 'scale(1.045)')}
        onPointerOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onPointerDown={(e) => (e.currentTarget.style.filter = 'brightness(0.92)')}
        onPointerUp={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', display: 'block' }} />
      </button>
    </div>
  );
}
