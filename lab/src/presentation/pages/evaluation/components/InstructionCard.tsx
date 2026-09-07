import { COLOR, CARD_RADIUS, CARD_SHADOW, HEADER_HEIGHT, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { MAX_SCORE, POINTS_PER_QUESTION, TOTAL_QUESTIONS } from '../questions';

// Petunjuk (instructions) screen - shown before the countdown, on every
// "Mulai Evaluasi" entry. Not part of the Figma mock (which only ships the
// soal and hasil frames), so this borrows the same card chrome (navy tab,
// white body, CARD_RADIUS) as QuestionCard/ResultCard rather than inventing
// a new visual language for one screen.
const CARD_WIDTH = 820;
const TAB = { height: 45.814 };

const INSTRUCTIONS = [
  `Ada ${TOTAL_QUESTIONS} soal pilihan ganda, tampil dalam urutan acak setiap kali evaluasi dimulai.`,
  'Setiap soal hanya bisa dijawab sekali - jawaban tidak bisa diubah setelah dipilih.',
  `Setiap jawaban benar bernilai ${POINTS_PER_QUESTION} poin, skor akhir maksimal ${MAX_SCORE}.`,
  'Tombol BERIKUTNYA muncul setelah kamu menjawab, untuk lanjut ke soal berikutnya.',
];

export function InstructionCard({ animation, onStart }: { animation: Animation; onStart: () => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: HEADER_HEIGHT,
        bottom: 0,
        width: S(CARD_WIDTH),
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        paddingTop: T(40, 24),
        paddingBottom: T(24, 14),
        zIndex: 4,
      }}
    >
      {/* Shell stays overflow:visible so the tab (half outside its own top
          edge) is never clipped by a scrolling ancestor - see QuestionCard's
          identical split for why. */}
      <div
        className={animation.className}
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          animationDelay: `${animation.delay}ms`,
          background: '#FFFFFF',
          border: `max(1.5px, 0.104cqw) solid ${COLOR.navy}`,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
        }}
      >
        <span
          style={{
            ...textBase,
            position: 'absolute',
            top: S(-TAB.height / 2),
            left: '50%',
            transform: 'translateX(-50%)',
            height: S(TAB.height),
            padding: `0 ${T(28, 16)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: COLOR.pillBlue,
            color: '#FFFFFF',
            fontSize: T(20, 10),
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          PETUNJUK PENGERJAAN
        </span>

        <div
          style={{
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: T(16, 8),
            padding: `${T(32, 16)} ${T(30, 16)} ${T(20, 10)}`,
          }}
        >
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: T(10, 5), width: '100%' }}>
            {INSTRUCTIONS.map((text, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: T(12, 6) }}>
                <span
                  aria-hidden="true"
                  style={{
                    ...textBase,
                    flex: 'none',
                    width: T(24, 15),
                    height: T(24, 15),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: COLOR.band,
                    border: `max(1px, 0.052cqw) solid ${COLOR.optionIdleBorder}`,
                    color: COLOR.navy,
                    fontSize: T(13, 8),
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ ...textBase, fontSize: T(16, 10), lineHeight: 1.3, fontWeight: 500, color: COLOR.body, paddingTop: T(3, 1) }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onStart}
            style={{
              ...textBase,
              marginTop: T(4, 2),
              padding: `${T(12, 8)} ${T(36, 18)}`,
              borderRadius: 999,
              border: 'none',
              background: COLOR.ctaBlue,
              color: '#FFFFFF',
              fontSize: T(18, 11),
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            MULAI EVALUASI →
          </button>
        </div>
      </div>
    </div>
  );
}
