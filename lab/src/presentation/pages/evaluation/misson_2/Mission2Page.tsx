import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import bg from '../../../../../assets/images/02_scenes/04_04_evaluasi/backgrounds/evaluasi_bg.png';
import step0 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/procedural_step_image/step_0.png';
import step1 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/procedural_step_image/step_1.png';
import step2 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/procedural_step_image/step_2.png';
import step3 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/procedural_step_image/step_3.png';
import step4 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/procedural_step_image/step_4.png';
import step5 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/procedural_step_image/step_5.png';
import step6 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/procedural_step_image/step_6.png';
import step7 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/procedural_step_image/step_7.png';
import complete from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_02_misi_2/complete_mission.png';
import click from '../../../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../../core/audio/audioSettings';
import { prefersReducedMotion } from '../../../../core/a11y/motion';
import { markEvaluationMissionCompleted } from '../../../../core/progress/evaluationProgress';
import { Stage } from '../../../components/Stage';
import { EvaluationHeader } from '../components/EvaluationHeader';
import { useMissionTransition } from '../components/useMissionTransition';
import { COLOR, S, T, textBase } from '../geometry';
import './mission2.css';

const images = [step0, step1, step2, step3, step4, step5, step6, step7];
const procedures = [
  { id: 'read', label: 'Membaca petunjuk penggunaan produk' },
  { id: 'weigh', label: 'Menghitung dan menimbang PDA sesuai kebutuhan' },
  { id: 'dissolve', label: 'Melarutkan PDA dengan akuades' },
  { id: 'heat', label: 'Memanaskan larutan hingga homogen' },
  { id: 'ph', label: 'Memeriksa atau menyesuaikan pH jika dipersyaratkan' },
  { id: 'sterilize', label: 'Melakukan sterilisasi sesuai metode dan parameter' },
  { id: 'pour', label: 'Menuangkan media secara aseptik sesuai SOP' },
];
const choiceOrder = [3, 5, 1, 0, 2, 6, 4];
const targetY = [287, 387, 490, 593, 693, 804, 914];
const rect = (x: number, y: number, width: number, height: number): CSSProperties => ({ position: 'absolute', left: S(x), top: S(y), width: S(width), height: S(height) });
type Drag = { id: string; startX: number; startY: number; dx: number; dy: number; over: boolean; moved: boolean };

export function Mission2Page() {
  const { goBack, goTo } = useNavigation();
  const { exiting, transition } = useMissionTransition();
  const [step, setStep] = useState(0);
  const [completeShown, setCompleteShown] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [transitioning, setTransitioning] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const timer = useRef(0);
  const locked = useRef(false);

  useEffect(() => {
    audio.current = new Audio(click);
    return () => { window.clearTimeout(timer.current); audio.current?.pause(); };
  }, []);

  const play = () => {
    if (!isAudioEnabled() || !audio.current) return;
    audio.current.currentTime = 0;
    void audio.current.play().catch(() => {});
  };
  const place = (id: string, inside: boolean) => {
    play();
    if (locked.current || !inside) return;
    if (procedures[step]?.id !== id) { setInvalid(true); return; }
    setInvalid(false);
    locked.current = true;
    setTransitioning(true);
    const next = step + 1;
    setStep(next);
    timer.current = window.setTimeout(() => {
      locked.current = false;
      setTransitioning(false);
    }, prefersReducedMotion() ? 0 : 450);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.id !== event.currentTarget.dataset.id) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const bounds = targetRef.current?.getBoundingClientRect();
    const over = !!bounds && event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    const pullX = over && bounds ? (bounds.left + bounds.width / 2 - event.clientX) * .12 : 0;
    const pullY = over && bounds ? (bounds.top + bounds.height / 2 - event.clientY) * .12 : 0;
    setDrag({ ...drag, dx: dx + pullX, dy: dy + pullY, over, moved: drag.moved || Math.hypot(dx, dy) > 5 });
  };
  const end = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.id !== event.currentTarget.dataset.id) return;
    const bounds = targetRef.current?.getBoundingClientRect();
    const inside = !!bounds && event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (drag.moved) place(drag.id, inside);
    setDrag(null);
  };

  return <Stage background={<img src={bg} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}>
    <EvaluationHeader title="MISI 02 — SUSUN PROSEDUR PDA!" subtitle="Susun tahapan pembuatan media PDA sesuai urutan yang benar" audioOn={audioOn} exiting={exiting} onHome={() => { play(); transition(() => goTo('splash')); }} onBack={() => { play(); transition(goBack); }} onToggle={() => { if (exiting) return; const enabled = toggleAudioEnabled(); setAudioOn(enabled); if (enabled) play(); }} />
    {completeShown ? <main inert={exiting} className={exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'} data-testid="mission2-completion" aria-label="Misi 2 selesai" style={{ ...rect(214, 197, 1492, 783), borderRadius: S(50), background: '#fff' }}>
      <img src={complete} alt="Misi 2 selesai. Kamu berhasil menyusun prosedur pembuatan media PDA dengan benar." style={{ ...rect(37, 35, 1419, 606), objectFit: 'contain' }} />
      <p style={{ ...rect(37, 680, 450, 60), ...textBase, color: COLOR.navy, fontWeight: 800, fontSize: T(26, 10) }}>Urutan benar: 7/7</p>
      <button className="mission2-continue" style={{ ...rect(1090, 680, 284, 56), fontSize: T(26, 10) }} onClick={() => { play(); transition(goBack); }}>LANJUT MISI</button>
    </main> : <main inert={exiting} className={exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'} aria-label="Misi 2: Susun Prosedur PDA" data-testid="mission2-scene" data-step={step} style={{ position: 'absolute', inset: 0 }}>
      <aside className="mission2-panel sterilab-bubble-in" style={rect(62, 197, 348, 438)}>
        <h2>Pengantar</h2><p>Susun tahapan pembuatan media PDA berikut agar sesuai dengan prosedur yang benar.</p><p>Seret setiap kartu ke posisi urutan yang tepat.</p><hr /><h2>Tugas Siswa</h2><p>Susun tahapan pembuatan media PDA secara berurutan.</p>
      </aside>
      <div className="mission2-panel sterilab-bubble-in" style={rect(450, 197, 970, 831)} />
      <div className="mission2-image sterilab-bubble-in" style={rect(477, 218, 919, 353)}>
        {images.map((src, index) => <img key={src} src={src} alt={index === step ? `Ilustrasi prosedur tahap ${step}` : ''} aria-hidden={index !== step} data-testid={index === step ? 'mission2-image' : undefined} style={{ opacity: index === step ? 1 : 0 }} />)}
      </div>
      <div className="mission2-order sterilab-bubble-in" style={rect(1463, 197, 404, 831)}><h2>URUTAN PROSEDUR</h2></div>
      {procedures.map((procedure, index) => <div key={procedure.id} className="mission2-slot-row" style={rect(1484, targetY[index], 356, 82)}>
        <span className="mission2-number">{index + 1}</span>
        <div ref={index === step ? targetRef : undefined} data-testid={index === step ? 'mission2-target' : undefined} data-active={index === step && !!drag?.over} className={`mission2-slot ${index === step && drag?.over ? 'is-over' : ''} ${index < step ? 'is-complete' : ''}`}>
          {index < step ? procedure.label : null}
          {index === step && drag?.over ? <svg viewBox="0 0 290 82" preserveAspectRatio="none" aria-hidden="true"><rect x="2" y="2" width="286" height="78" rx="12" /></svg> : null}
        </div>
      </div>)}
      <div className="mission2-choices" data-testid="mission2-choices" style={rect(478, 605, 919, 306)}>
      {choiceOrder.map((index, position) => { const procedure = procedures[index]; return index < step ? null : <div key={procedure.id} className="mission2-choice-entrance sterilab-bubble-in" style={{ animationDelay: `${600 + position * 70}ms`, zIndex: drag?.id === procedure.id ? 4 : 2 }}><button type="button" data-id={procedure.id} data-testid={`mission2-card-${procedure.id}`} className={`mission2-card ${drag?.id === procedure.id && drag.moved ? 'is-dragging' : ''}`} style={{ transform: drag?.id === procedure.id ? `translate(${drag.dx}px, ${drag.dy}px)${drag.over ? ' scale(.97)' : ''}` : undefined }}
        onPointerDown={(event) => { if (locked.current || event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); setDrag({ id: procedure.id, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, over: false, moved: false }); }}
        onPointerMove={move} onPointerUp={end} onPointerCancel={() => setDrag(null)} onLostPointerCapture={() => setDrag(null)}
        onClick={(event) => { if (event.detail === 0 && !locked.current) place(procedure.id, true); }} disabled={transitioning}>
        <span aria-hidden="true" className="mission2-grip">⠿</span>{procedure.label}
      </button></div>; })}
      </div>
      <div className="mission2-count" role="status" data-testid="mission2-count" style={rect(483, 943, 316, 53)}>Urutan benar: <strong>{step}/7</strong></div>
      <button type="button" className="mission2-status" style={rect(1178, 943, 209, 52)} disabled={step !== 7 || transitioning || exiting} onClick={() => { play(); markEvaluationMissionCompleted(2); transition(() => setCompleteShown(true)); }}>{step === 7 ? 'Selesai' : 'Belum selesai'}</button>
      {invalid && <div role="alert" className="mission2-invalid" style={rect(52, 684, 368, 105)}><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" /><path d="M14 14l12 12m0-12L14 26" /></svg><div><strong>URUTAN BELUM TEPAT</strong><p>Periksa kembali tahapan alur pembuatan media PDA dari penimbangan hingga penuangan aseptik.</p></div></div>}
    </main>}
  </Stage>;
}
