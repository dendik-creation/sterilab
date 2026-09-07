import badgeResultUrl from '../../../../../assets/images/02_scenes/04_04_evaluasi/badge_result.png';
import { COLOR, CARD_RADIUS, CARD_SHADOW, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { MAX_SCORE, TOTAL_QUESTIONS } from '../questions';

// "HALAMAN HASIL" - Figma frame 319:2357. Card (319:2359, x=556 y=300
// w=809 h=345) and its contents keep the mock's literal coordinates since
// every value here is a short number, unlike the soal card next to it.
const CARD = { width: 809, height: 345 };
const TAB = { width: 230.042, height: 45.814 };
const BADGE = { top: 47, left: 50, width: 283, height: 256 };
const SCORE = { top: 26, left: 390 };
const MAX = { top: 110, left: 592 };
const STAT = { top: 220, left: 398, width: 354, height: 61 };

export function ResultCard({
  correctCount,
  animation,
}: {
  correctCount: number;
  animation: Animation;
}) {
  const score = correctCount * (MAX_SCORE / TOTAL_QUESTIONS);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: S(300),
        width: S(CARD.width),
        transform: 'translateX(-50%)',
        zIndex: 4,
      }}
    >
      {/* Centering transform and bubble animation split across two elements
          - see QuestionCard's identical split for why. */}
      <div
        className={animation.className}
        style={{
          position: 'relative',
          animationDelay: `${animation.delay}ms`,
          height: S(CARD.height),
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
          SKOR AKHIR
        </span>

        <img
          src={badgeResultUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: S(BADGE.top),
            left: S(BADGE.left),
            width: S(BADGE.width),
            height: S(BADGE.height),
            objectFit: 'contain',
          }}
        />

        <span
          style={{
            ...textBase,
            position: 'absolute',
            top: S(SCORE.top),
            left: S(SCORE.left),
            fontSize: T(150, 56),
            fontWeight: 800,
            color: COLOR.navy,
          }}
        >
          {score}
        </span>
        <span
          style={{
            ...textBase,
            position: 'absolute',
            top: S(MAX.top),
            left: S(MAX.left),
            fontSize: T(64, 24),
            fontWeight: 800,
            color: '#6092D1',
          }}
        >
          {`/ ${MAX_SCORE}`}
        </span>

        <span
          style={{
            ...textBase,
            position: 'absolute',
            top: S(STAT.top),
            left: S(STAT.left),
            width: S(STAT.width),
            height: S(STAT.height),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: S(15),
            background: COLOR.band,
            border: `max(1.5px, 0.104cqw) solid ${COLOR.optionIdleBorder}`,
            color: COLOR.navy,
            fontSize: T(24, 11),
            fontWeight: 800,
          }}
        >
          {`${correctCount} dari ${TOTAL_QUESTIONS} jawaban benar`}
        </span>
      </div>
    </div>
  );
}
