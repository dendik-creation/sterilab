import { COLOR, CARD_RADIUS, CARD_SHADOW, S, T, textBase } from '../geometry';
import type { Animation } from '../geometry';
import { TOTAL_QUESTIONS } from '../questions';

// Left tracking card - Figma "Sterilab-APHP" frame 314:2030, group "PROSEDUR"
// (314:2104, x=89 y=278 w=507 h=478.957). Same navy-tab / white-body chrome
// as every Stage's own ProcedureCard (pages/stages/*/ProcedureCard.tsx), but
// its own component since the body content (a 2x5 dot grid instead of one
// step's title/description, plus an answered-count stat) doesn't match any
// Stage's shape.
const CARD = { x: 89, y: 278, width: 507 };
const HEAD_HEIGHT = 348.957 - CARD.y; // white body starts at canvas y=348.957
const COUNTER_PILL = { top: 371 - CARD.y, left: 211.214 - CARD.x, width: 262.468, height: 44.936 };
const DOT_SIZE = 41.16;
const DOT_COLS = [156, 238, 321, 404, 487].map((x) => x - CARD.x);
const DOT_ROWS = [439, 502].map((y) => y - CARD.y);
const RULE = { top: 570 - CARD.y, left: 109.617 - CARD.x, width: 467.068 };
const STAT_BOX = { top: 602.5 - CARD.y, left: 118 - CARD.x, width: 450, height: 125 };

export function ProgressCard({
  current,
  answeredCount,
  showDots,
  animation,
}: {
  current: number;
  answeredCount: number;
  showDots: boolean;
  animation: Animation;
}) {
  return (
    <div
      className={animation.className}
      style={{
        position: 'absolute',
        left: S(CARD.x),
        top: S(CARD.y),
        width: S(CARD.width),
        zIndex: 4,
        animationDelay: `${animation.delay}ms`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          height: S(HEAD_HEIGHT),
          background: COLOR.navy,
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <span style={{ ...textBase, fontSize: T(36, 14), fontWeight: 800, color: '#FFFFFF', textAlign: 'center' }}>
          PROGRESS EVALUASI
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: S(HEAD_HEIGHT),
          minHeight: `calc(${S(STAT_BOX.top + STAT_BOX.height)} + ${S(20)})`,
          background: '#FFFFFF',
          borderRadius: S(CARD_RADIUS),
          boxShadow: CARD_SHADOW,
        }}
      >
        <span
          style={{
            ...textBase,
            position: 'absolute',
            top: S(COUNTER_PILL.top),
            left: S(COUNTER_PILL.left),
            width: S(COUNTER_PILL.width),
            height: S(COUNTER_PILL.height),
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
          {`Soal ${current} dari ${TOTAL_QUESTIONS}`}
        </span>

        {showDots ? (
          <div aria-hidden="true" data-testid="evaluation-dots">
            {DOT_ROWS.map((rowTop, rowIndex) => (
              <div key={rowTop} style={{ position: 'absolute', top: S(rowTop), left: 0, right: 0 }}>
                {DOT_COLS.map((colLeft, colIndex) => {
                  const n = rowIndex * DOT_COLS.length + colIndex + 1;
                  const active = n === current;
                  const done = n < current;
                  return (
                    <span
                      key={n}
                      style={{
                        ...textBase,
                        position: 'absolute',
                        left: S(colLeft),
                        width: S(DOT_SIZE),
                        height: S(DOT_SIZE),
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: active || done ? COLOR.navy : COLOR.dotIdleFill,
                        border: active || done ? 'none' : `max(1px, 0.078cqw) solid ${COLOR.dotIdleRing}`,
                        color: active || done ? '#FFFFFF' : COLOR.dotIdleText,
                        fontSize: T(18, 8),
                        fontWeight: 700,
                      }}
                    >
                      {n}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        ) : null}

        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: S(RULE.top),
            left: S(RULE.left),
            width: S(RULE.width),
            height: 'max(1px, 0.078cqw)',
            background: COLOR.divider,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: S(STAT_BOX.top),
            left: S(STAT_BOX.left),
            width: S(STAT_BOX.width),
            height: S(STAT_BOX.height),
            background: COLOR.band,
            borderRadius: S(CARD_RADIUS),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: S(24),
            gap: S(6),
          }}
        >
          <span style={{ ...textBase, fontSize: T(24, 10), fontWeight: 500, color: COLOR.statNavy }}>
            Jumlah soal terjawab
          </span>
          <span style={{ ...textBase, fontSize: T(32, 14), fontWeight: 800, color: COLOR.statNavy }}>
            {`${answeredCount} dari ${TOTAL_QUESTIONS}`}
          </span>
        </div>
      </div>
    </div>
  );
}
