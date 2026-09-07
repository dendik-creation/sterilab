import { COLOR, CARD_RADIUS, CARD_SHADOW, HEADER_HEIGHT, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import type { Question, QuestionOption } from '../questions';
import { TOTAL_QUESTIONS } from '../questions';

// Right "soal" card - Figma frame 314:2030's "Rectangle 2" (x=647 y=300
// w=905), stretched to an auto height instead of the mock's fixed 456px:
// the mock only ever shows a 2x2 A-D grid with a one-line question, but the
// real bank (questions.ts) carries 5 options (A-E) and one multi-line
// scenario (Soal 7's numbered list), so a fixed box would clip either.
//
// The card sits in a flex band that spans from the header down to the safe
// layer's bottom edge and centers it there, with its own maxHeight+overflow
// as a last-resort escape hatch: on the smallest supported viewport (568x320,
// playwright.config.ts) a long prompt wrapped at this card's width can still
// need more lines than 320px has room for, so the card scrolls internally
// rather than spilling out of the Stage.
const CARD_WIDTH = 905;
const TAB = { width: 230.042, height: 45.814 };

export function QuestionCard({
  question,
  index,
  selectedKey,
  answered,
  animation,
  onSelect,
  onNext,
}: {
  question: Question;
  index: number;
  selectedKey: QuestionOption['key'] | undefined;
  answered: boolean;
  animation: Animation;
  onSelect: (key: QuestionOption['key']) => void;
  onNext: () => void;
}) {
  const isCorrect = answered && selectedKey === question.correctKey;

  return (
    <div
      style={{
        position: 'absolute',
        left: S(647),
        top: HEADER_HEIGHT,
        bottom: 0,
        width: S(CARD_WIDTH),
        display: 'flex',
        alignItems: 'center',
        // Clearance above/below the centered card so the "SOAL N/M" tab -
        // which overlaps the card's own top edge by half its height - never
        // pokes up into the header band regardless of how tall the card ends
        // up being (bug: a card that nearly fills this whole band leaves
        // less than half a tab-height of slack above it).
        paddingTop: T(40, 24),
        paddingBottom: T(24, 14),
        zIndex: 4,
      }}
    >
      {/* Shell owns the border/radius/shadow and stays overflow:visible so
          the tab pill (half outside the shell's own top edge) never gets
          clipped by a scrolling ancestor; only the content beneath the tab
          scrolls, in its own flex child. */}
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
            width: S(TAB.width),
            height: S(TAB.height),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            background: COLOR.pillBlue,
            color: '#FFFFFF',
            fontSize: T(24, 10),
            fontWeight: 800,
          }}
        >
          {`SOAL ${index} / ${TOTAL_QUESTIONS}`}
        </span>

        <div
          style={{
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: T(16, 8),
            padding: `${T(40, 20)} ${T(32, 16)} ${T(28, 14)}`,
          }}
        >
          <p
            style={{
              ...textBase,
              fontSize: T(23, 13),
              lineHeight: 1.32,
              fontWeight: 800,
              color: COLOR.navy,
              whiteSpace: 'pre-line',
            }}
          >
            {question.prompt}
          </p>

          <span aria-hidden="true" style={{ height: 'max(1px, 0.078cqw)', background: COLOR.divider }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: T(14, 6) }}>
            {question.options.map((option) => (
              <OptionRow
                key={option.key}
                option={option}
                selected={selectedKey === option.key}
                answered={answered}
                isCorrectOption={option.key === question.correctKey}
                onSelect={() => onSelect(option.key)}
              />
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: T(16, 8) }}>
            <span
              role="status"
              style={{
                ...textBase,
                display: 'flex',
                alignItems: 'center',
                flex: '1 1 auto',
                minWidth: 0,
                minHeight: T(47, 20),
                padding: `${T(8, 4)} ${T(24, 12)}`,
                borderRadius: 999,
                background: answered ? (isCorrect ? COLOR.correctBg : COLOR.wrongBg) : COLOR.optionIdleBorder,
                color: answered ? (isCorrect ? COLOR.correctText : COLOR.wrongText) : COLOR.navy,
                fontSize: T(18, 9),
                fontWeight: 600,
              }}
            >
              {answered
                ? isCorrect
                  ? 'Benar! Jawabanmu tepat.'
                  : `Kurang tepat. Jawaban benar: ${question.correctKey}.`
                : 'Pilih salah satu jawaban yang benar!'}
            </span>

            <button
              type="button"
              onClick={onNext}
              disabled={!answered}
              style={{
                ...textBase,
                padding: `${T(14, 8)} ${T(28, 14)}`,
                borderRadius: 999,
                border: 'none',
                background: COLOR.ctaBlue,
                color: '#FFFFFF',
                fontSize: T(18, 9),
                fontWeight: 800,
                cursor: answered ? 'pointer' : 'default',
                opacity: answered ? 1 : 0,
                transition: 'opacity 220ms ease-out',
                pointerEvents: answered ? 'auto' : 'none',
                flex: 'none',
              }}
            >
              {index === TOTAL_QUESTIONS ? 'LIHAT HASIL →' : 'BERIKUTNYA →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  option,
  selected,
  answered,
  isCorrectOption,
  onSelect,
}: {
  option: QuestionOption;
  selected: boolean;
  answered: boolean;
  isCorrectOption: boolean;
  onSelect: () => void;
}) {
  // Wrong-answer red only paints the one option the Analyst actually picked;
  // the correct option turns green the moment any answer is locked in,
  // whether or not it was the one clicked (TASKS.md > Evaluasi state rules).
  const showWrong = answered && selected && !isCorrectOption;
  const showCorrect = answered && isCorrectOption;
  const bg = showWrong ? COLOR.wrongBg : showCorrect ? COLOR.correctBg : COLOR.optionIdleBg;
  const border = showWrong ? COLOR.wrongBorder : showCorrect ? COLOR.correctBorder : COLOR.optionIdleBorder;
  const textColor = showWrong ? COLOR.wrongText : showCorrect ? COLOR.correctText : COLOR.navy;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={answered}
      aria-pressed={selected}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: T(19, 10),
        width: '100%',
        padding: `${T(12, 5)} ${T(19, 10)}`,
        borderRadius: S(15),
        border: `max(1.5px, 0.104cqw) solid ${border}`,
        background: bg,
        cursor: answered ? 'default' : 'pointer',
        textAlign: 'left',
        transition: 'background 160ms ease-out, border-color 160ms ease-out',
      }}
    >
      <span
        style={{
          ...textBase,
          flex: 'none',
          width: T(54, 24),
          height: T(54, 24),
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFFFFF',
          border: `max(1.5px, 0.104cqw) solid ${border}`,
          color: COLOR.optionLetter,
          fontSize: T(28, 11),
          fontWeight: 800,
        }}
      >
        {option.key}
      </span>
      <span style={{ ...textBase, fontSize: T(18, 10), fontWeight: 500, lineHeight: 1.3, color: textColor }}>
        {option.text}
      </span>
    </button>
  );
}
