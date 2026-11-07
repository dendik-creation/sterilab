import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import evaluationBgUrl from '../../../../../assets/images/02_scenes/04_04_evaluasi/backgrounds/evaluasi_bg.png';
import problemsetUrl from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_01_misi_1/problemset-images-lab.png';
import homeBtnUrl from '../../../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import arrowRightUrl from '../../../../../assets/images/01_reusable/icons/arrow_right.png';
import clickSfxUrl from '../../../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../../core/audio/audioSettings';
import { prefersReducedMotion } from '../../../../core/a11y/motion';
import { Stage } from '../../../components/Stage';
import { IconButton } from '../../../components/IconButton';
import { BUBBLE_MS, COLOR, S, STAGGER_MS, T, textBase } from '../geometry';
import { findProblemAt, IMAGE_SIZE, PROBLEMS } from './mission1';
import type { Problem } from './mission1';
import './mission1.css';

const HOME_LEFT = 'max(12px, 2.499%)';
const BACK_LEFT = 'max(64px, 7.609%)';
const SOUND_LEFT = 'min(93.931%, 100% - 52px)';
const TOP_BAR_TOP = '3.574%';
const ICON_SIZE = '3.791%';
const ANIMATION_STEPS = 4;
const EXIT_TOTAL_MS = ANIMATION_STEPS * STAGGER_MS + BUBBLE_MS;

const enterDelay = (step: number) => step * STAGGER_MS;
const exitDelay = (step: number) => (ANIMATION_STEPS - step) * STAGGER_MS;

export function Mission1Page() {
  const { goBack, goTo } = useNavigation();
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [exiting, setExiting] = useState(false);
  const [found, setFound] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const exitTimerRef = useRef(0);
  const selectedProblem = PROBLEMS.find((problem) => problem.id === selectedId);
  const allFound = found.size === PROBLEMS.length;

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
    return () => window.clearTimeout(exitTimerRef.current);
  }, []);

  const playClick = () => {
    if (!isAudioEnabled() || !clickAudioRef.current) return;
    clickAudioRef.current.currentTime = 0;
    void clickAudioRef.current.play().catch(() => {});
  };

  const handleToggleSound = () => {
    if (exiting) return;
    const enabled = toggleAudioEnabled();
    setAudioOn(enabled);
    if (enabled) playClick();
  };

  const leaveTo = (navigate: () => void) => {
    if (exiting) return;
    playClick();
    if (prefersReducedMotion()) {
      navigate();
      return;
    }
    setExiting(true);
    exitTimerRef.current = window.setTimeout(navigate, EXIT_TOTAL_MS);
  };

  const animation = (step: number, fade = false) => ({
    className: exiting
      ? fade ? 'sterilab-fade-out' : 'sterilab-bubble-out'
      : fade ? 'sterilab-fade-in' : 'sterilab-bubble-in',
    delay: exiting ? exitDelay(step) : enterDelay(step),
  });

  const reveal = (problem: Problem) => {
    setFound((current) => {
      if (current.has(problem.id)) return current;
      return new Set(current).add(problem.id);
    });
    setSelectedId(problem.id);
  };

  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (exiting) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const problem = findProblemAt(
      (event.clientX - bounds.left) / bounds.width,
      (event.clientY - bounds.top) / bounds.height,
    );
    if (problem) reveal(problem);
  };

  return (
    <Stage
      background={
        <img
          src={evaluationBgUrl}
          alt=""
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      }
    >
      <header
        style={{
          position: 'absolute',
          inset: '0 0 auto',
          height: T(146, 60),
          background: COLOR.band,
          borderBottom: `${T(2, 1)} solid ${COLOR.navy}`,
          zIndex: 5,
        }}
      >
        <div style={{ position: 'absolute', left: `max(116px, ${S(260)})`, top: S(32), display: 'flex', flexDirection: 'column', gap: S(2), whiteSpace: 'nowrap' }}>
          <h1
            data-testid="mission1-title"
            className={animation(0, true).className}
            style={{ ...textBase, fontSize: T(36, 15), lineHeight: 1.25, fontWeight: 800, color: COLOR.navy, animationDelay: `${animation(0, true).delay}ms` }}
          >
            MISI 01 — TEMUKAN KESALAHAN!
          </h1>
          <p
            className={animation(1, true).className}
            style={{ ...textBase, fontSize: T(24, 10), lineHeight: 1.25, fontWeight: 500, color: COLOR.navy, animationDelay: `${animation(1, true).delay}ms` }}
          >
            Temukan tindakan yang berpotensi menyebabkan kontaminasi
          </p>
        </div>
      </header>

      <IconButton src={homeBtnUrl} alt="Menu Utama" label="Menu Utama" top={TOP_BAR_TOP} left={HOME_LEFT} size={ICON_SIZE} animationClassName={animation(0).className} animationDelayMs={animation(0).delay} zIndex={6} onClick={() => leaveTo(() => goTo('splash'))} />
      <IconButton src={backBtnUrl} alt="Kembali" label="Kembali" top={TOP_BAR_TOP} left={BACK_LEFT} size={ICON_SIZE} animationClassName={animation(0).className} animationDelayMs={animation(0).delay} zIndex={6} onClick={() => leaveTo(goBack)} />
      <IconButton
        src={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
        alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        pressed={audioOn}
        top={TOP_BAR_TOP}
        left={SOUND_LEFT}
        size={ICON_SIZE}
        animationClassName={animation(0).className}
        animationDelayMs={animation(0).delay}
        zIndex={6}
        onClick={handleToggleSound}
      />

      <main aria-label="Misi 1: Temukan Kesalahan" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <div
          aria-hidden="true"
          className={animation(1).className}
          style={{
            position: 'absolute',
            left: S(571),
            top: S(197),
            width: S(1236),
            height: S(782),
            border: `${T(2, 1)} solid ${COLOR.navy}`,
            borderRadius: S(50),
            background: '#FFFFFF',
            animationDelay: `${animation(1).delay}ms`,
          }}
        />

        <aside aria-label="Petunjuk dan tugas siswa" style={{ position: 'absolute', inset: 0 }}>
          <div
            aria-hidden="true"
            className={`mission1-instruction-card ${animation(1).className}`}
            style={{
              position: 'absolute',
              left: S(117),
              top: S(197),
              width: S(426),
              height: S(529),
              border: `${T(2, 1)} solid ${COLOR.navy}`,
              borderRadius: S(50),
              background: '#FFFFFF',
              animationDelay: `${animation(1).delay}ms`,
            }}
          />
          <h2 className={`mission1-pill ${animation(1, true).className}`} style={{ left: S(215), top: S(227), width: S(230), height: S(46), fontSize: T(24, 10), animationDelay: `${animation(1, true).delay}ms` }}>
            Pengantar
          </h2>
          <div
            className={`mission1-instruction-scroll ${animation(2, true).className}`}
            data-testid="mission1-instruction-scroll"
            role="region"
            aria-label="Rincian petunjuk dan tugas siswa"
            tabIndex={0}
            style={{ position: 'absolute', left: S(135), top: S(282), width: S(391), height: S(444), animationDelay: `${animation(2, true).delay}ms` }}
          >
            <p
              className="mission1-instruction-copy"
              data-testid="mission1-instruction-copy"
              style={{
                ...textBase,
                position: 'absolute',
                left: S(18),
                top: S(7),
                width: S(355),
                fontSize: T(20, 8),
                lineHeight: 1.1,
                fontWeight: 500,
                color: COLOR.navy,
                textAlign: 'center',
              }}
            >
              Amati ilustrasi laboratorium berikut. Temukan 4 tindakan yang berpotensi menyebabkan kontaminasi. Klik pada bagian yang salah, lalu jelaskan risikonya dan cara memperbaikinya.
            </p>
            <div className="mission1-instruction-divider" aria-hidden="true" style={{ position: 'absolute', left: 0, top: S(155), width: S(391), borderTop: `${T(1, 1)} solid ${COLOR.divider}` }} />
            <h2 className="mission1-pill mission1-task-heading" style={{ left: S(80), top: S(176), width: S(230), height: S(46), fontSize: T(24, 10) }}>
              Tugas Siswa
            </h2>
            <ol
              className="mission1-task-list"
              style={{
                ...textBase,
                position: 'absolute',
                left: S(9),
                top: S(228),
                width: S(369),
                margin: 0,
                paddingLeft: S(30),
                display: 'flex',
                flexDirection: 'column',
                gap: S(10),
                fontSize: T(20, 8),
                lineHeight: 1.05,
                fontWeight: 500,
                color: COLOR.navy,
              }}
            >
              <li>Temukan empat tindakan yang berpotensi menyebabkan kontaminasi.</li>
              <li>Jelaskan risiko dari setiap kesalahan.</li>
              <li>Berikan cara memperbaikinya.</li>
            </ol>
          </div>
        </aside>

        <div
          aria-hidden="true"
          className={animation(2).className}
          style={{
            position: 'absolute',
            left: S(596),
            top: S(220),
            width: S(1186),
            height: S(645),
            overflow: 'hidden',
            borderRadius: S(34),
            animationDelay: `${animation(2).delay}ms`,
          }}
        >
          <img
            data-testid="mission1-art"
            src={problemsetUrl}
            alt=""
            draggable={false}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        <div
          data-testid="mission1-image"
          role="group"
          aria-label="Ilustrasi laboratorium. Klik pada bagian yang menunjukkan kesalahan."
          className={animation(2).className}
          onClick={handleImageClick}
          style={{ position: 'absolute', left: S(596), top: S(220), width: S(1186), height: S(645), cursor: 'pointer', animationDelay: `${animation(2).delay}ms` }}
        >
          {PROBLEMS.map((problem) => {
            const isFound = found.has(problem.id);
            return (
              <button
                key={problem.id}
                type="button"
                className="mission1-hotspot"
                data-testid={`mission1-area-${problem.id}`}
                data-found={isFound}
                aria-label={`Temukan kesalahan: ${problem.label}`}
                aria-pressed={isFound}
                onClick={(event) => {
                  event.stopPropagation();
                  if (exiting) return;
                  reveal(problem);
                }}
                style={{
                  left: `${(problem.rect.x / IMAGE_SIZE.width) * 100}%`,
                  top: `${(problem.rect.y / IMAGE_SIZE.height) * 100}%`,
                  width: `${(problem.rect.width / IMAGE_SIZE.width) * 100}%`,
                  height: `${(problem.rect.height / IMAGE_SIZE.height) * 100}%`,
                }}
              />
            );
          })}
        </div>

        {selectedProblem ? (
          <img
            key={selectedProblem.id}
            data-testid="mission1-problem-found"
            data-problem-id={selectedProblem.id}
            src={selectedProblem.asset}
            alt={`Kesalahan ditemukan: ${selectedProblem.label}`}
            className={animation(3, true).className}
            draggable={false}
            style={{ position: 'absolute', left: S(1298), top: S(192), width: S(505), height: S(410), objectFit: 'contain', pointerEvents: 'none', zIndex: 4, animationDelay: `${animation(3, true).delay}ms` }}
          />
        ) : null}

        <div
          role="status"
          aria-live="polite"
          data-testid="mission1-count"
          className={animation(3, true).className}
          style={{
            position: 'absolute',
            left: S(596),
            top: S(893),
            width: S(420),
            height: S(53),
            display: 'flex',
            alignItems: 'center',
            gap: S(10),
            padding: `0 ${S(22)}`,
            borderRadius: 999,
            background: '#C3E5FE',
            color: '#062683',
            fontFamily: textBase.fontFamily,
            fontSize: T(25, 8),
            fontWeight: 800,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            animationDelay: `${animation(3, true).delay}ms`,
          }}
        >
          <span aria-hidden="true" className="mission1-target-icon"><span /></span>
          <span>Kesalahan ditemukan:</span>
          <span style={{ color: '#0023E9' }}>{found.size}/4</span>
        </div>

        {/* shortcut: return to Evaluation until Mission 1 has a result/progress flow. */}
        <button
          type="button"
          className={`mission1-finish-button ${animation(4).className}`}
          disabled={!allFound || exiting}
          aria-label="Selesai"
          onClick={() => leaveTo(goBack)}
          style={{
            position: 'absolute',
            left: S(1554),
            top: S(893),
            width: S(209),
            height: S(52),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: S(8),
            border: `${T(2, 1)} solid ${allFound ? COLOR.ctaBlue : '#7B7B7B'}`,
            borderRadius: 999,
            background: allFound ? COLOR.ctaBlue : '#A8A8A8',
            color: '#FFFFFF',
            fontFamily: textBase.fontFamily,
            fontSize: T(25, 8),
            fontWeight: 800,
            lineHeight: 1,
            cursor: allFound && !exiting ? 'pointer' : 'not-allowed',
            animationDelay: `${animation(4).delay}ms`,
          }}
        >
          SELESAI
          <img src={arrowRightUrl} alt="" aria-hidden="true" style={{ width: S(29), height: S(19), objectFit: 'contain' }} />
        </button>
      </main>
    </Stage>
  );
}
