import type { CSSProperties } from 'react';

// Shared square icon button for every DOM Screen's top bar (home / back /
// sound). WCAG 2.2 AA wants a 44x44 CSS px touch target; the Figma-derived
// size below is a raw percentage of the 1920x1080 safe layer, which on the
// smallest supported landscape viewport (568x320) would shrink to ~21px -
// so every dimension is floored with CSS max(), never used as a bare %.
export interface IconButtonProps {
  src: string;
  alt: string;
  label: string;
  onClick: () => void;
  top: string;
  left: string;
  size: string;
  // Optional entrance/exit animation (e.g. SplashPage's "sterilab-bubble-in"
  // / "sterilab-bubble-out") - safe to combine with the hover/press
  // transform below since this button positions with top/left, not
  // translate, so nothing on `transform` ever conflicts.
  animationClassName?: string;
  animationDelayMs?: number;
  // Only needed on a Screen that paints a band or card behind the top bar
  // (Stage 4's header): a positioned sibling with any z-index would otherwise
  // cover an icon left on `auto`, whatever the DOM order.
  zIndex?: number;
}

export function IconButton({
  src,
  alt,
  label,
  onClick,
  top,
  left,
  size,
  animationClassName,
  animationDelayMs,
  zIndex,
}: IconButtonProps) {
  const style: CSSProperties = {
    position: 'absolute',
    top,
    left,
    zIndex,
    width: `max(44px, ${size})`,
    aspectRatio: '1 / 1',
    border: 'none',
    padding: 0,
    background: 'transparent',
    cursor: 'pointer',
    transition: 'transform 120ms ease-out',
  };
  if (animationDelayMs !== undefined) style.animationDelay = `${animationDelayMs}ms`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={animationClassName}
      style={style}
      onPointerOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
      onPointerOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', display: 'block' }} />
    </button>
  );
}
