import type { Rect } from '../../../../data/stages/kulturMikroba';
import { COLOR, S } from './geometry';

// A plain object baked into a plate's own art (the jar, the aquades bottle,
// the hotplate) - the only affordance is the highlight box Figma itself
// draws around it, reproduced here as a translucent bordered button rather
// than a hand-drawn pulse ring, plus the shared `sterilab-hotspot-pulse`
// class every other Stage uses for "this is clickable". Shared across this
// stage's procedures because every one of them marks its next click the same
// way (see the "5.1"/"5.2" frames' own `border-[#2d6dea]` boxes).
export function ClickHotspot({
  rect,
  accessibleName,
  onSelect,
}: {
  rect: Rect;
  accessibleName: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={accessibleName}
      className="sterilab-hotspot-pulse"
      style={{
        position: 'absolute',
        left: S(rect.x),
        top: S(rect.y),
        width: `max(44px, ${S(rect.width)})`,
        height: `max(44px, ${S(rect.height)})`,
        zIndex: 2,
        padding: 0,
        border: `max(2px, 0.156cqw) solid ${COLOR.hotspotBorder}`,
        borderRadius: S(18),
        background: 'rgba(255, 255, 255, 0.34)',
        cursor: 'pointer',
        transition: 'background 160ms ease-out',
      }}
      onPointerOver={(e) => (e.currentTarget.style.background = 'rgba(109, 215, 253, 0.4)')}
      onPointerOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.34)')}
    />
  );
}
