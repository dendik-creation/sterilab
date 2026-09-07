import { COLOR, textBase } from '../geometry';

// Full-screen 3-2-1 overlay between "Mulai Evaluasi" and the first soal.
// `value` remounts the digit (key={value} in EvaluationPage) so the
// fade+rise-in animation replays for every count instead of only once.
export function Countdown({ value, animated }: { value: number; animated: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(4, 72, 139, 0.45)',
      }}
    >
      <span
        className={animated ? 'sterilab-countdown-in' : undefined}
        style={{
          ...textBase,
          fontSize: 'max(96px, 14cqw)',
          fontWeight: 800,
          color: '#FFFFFF',
          textShadow: `0 0.6cqw 1.6cqw ${COLOR.navy}`,
        }}
      >
        {value}
      </span>
    </div>
  );
}
