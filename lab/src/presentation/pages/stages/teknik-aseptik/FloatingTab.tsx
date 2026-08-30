import { COLOR, FLOATING_TAB, S, T, textBase } from './geometry';

// The blue tab hung over the top edge of a procedure's floating card. Shared
// because every procedure's card wears the same one; only the offset from the
// card's own left edge changes with the card's width.
export function FloatingTab({ label, dx }: { label: string; dx: number }) {
  return (
    <span
      style={{
        ...textBase,
        position: 'absolute',
        top: 0,
        left: S(dx),
        minWidth: S(FLOATING_TAB.width),
        minHeight: S(FLOATING_TAB.height),
        padding: `0 ${S(24)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        background: COLOR.pillBlue,
        color: '#FFFFFF',
        fontSize: T(25, 10),
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}
