import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, PointerEvent } from 'react';
import background from '../../../../../assets/images/02_scenes/04_04_evaluasi/backgrounds/evaluasi_bg.png';
import case1 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_04_misi_4/case_1.png';
import case2 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_04_misi_4/case_2.png';
import case3 from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_04_misi_4/case_3.png';
import completeArt from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_04_misi_4/complete_mission.png';
import arrow from '../../../../../assets/images/01_reusable/icons/arrow_right.png';
import click from '../../../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../../core/audio/audioSettings';
import { markEvaluationMissionCompleted } from '../../../../core/progress/evaluationProgress';
import { Stage } from '../../../components/Stage';
import { AiDisclosureBadge } from '../../../components/AiDisclosureBadge';
import { EvaluationHeader } from '../components/EvaluationHeader';
import { useMissionTransition } from '../components/useMissionTransition';
import { S } from '../geometry';
import './mission4.css';

const choices = [
  { id: 'error-case-1', target: 'case-1-error', category: 'error', text: 'Limbah mikrobiologi infeksius dibuang ke sampah umum.' },
  { id: 'error-case-2', target: 'case-2-error', category: 'error', text: 'Benda tajam tidak dibuang pada wadah khusus.' },
  { id: 'error-case-3', target: 'case-3-error', category: 'error', text: 'Limbah cair biologis dibuang langsung tanpa perlakuan awal.' },
  { id: 'risk-case-1', target: 'case-1-risk', category: 'risk', text: 'Dapat menyebabkan penyebaran mikroorganisme, mencemari lingkungan, dan membahayakan petugas.' },
  { id: 'risk-case-2', target: 'case-2-risk', category: 'risk', text: 'Dapat melukai petugas dan menyebabkan paparan bahan biologis yang berbahaya.' },
  { id: 'risk-case-3', target: 'case-3-risk', category: 'risk', text: 'Dapat mencemari lingkungan dan menyebarkan mikroorganisme ke area luar laboratorium.' },
  { id: 'solution-case-1', target: 'case-1-solution', category: 'solution', text: 'Cawan Petri bekas kultur harus dimasukkan ke wadah limbah infeksius/biohazard dan diproses sesuai SOP laboratorium.' },
  { id: 'solution-case-2', target: 'case-2-solution', category: 'solution', text: 'Benda tajam harus dibuang ke wadah khusus benda tajam atau sharps container yang aman.' },
  { id: 'solution-case-3', target: 'case-3-solution', category: 'solution', text: 'Limbah cair harus didekontaminasi atau disterilkan terlebih dahulu sesuai SOP sebelum dibuang.' },
] as const;
type Choice = typeof choices[number];
type Drag = { id: Choice['id']; x: number; y: number; dx: number; dy: number; left: number; top: number; width: number; height: number; fontSize: string; moved: boolean; over: string | null };
const labels = { error: 'Kesalahan', risk: 'Risiko', solution: 'Penanganan yang benar' };
const cases = [
  { image: case1, text: 'Cawan Petri berisi kultur dibuang ke tempat sampah umum.' },
  { image: case2, text: 'Benda tajam dimasukkan ke plastik biasa.' },
  { image: case3, text: 'Limbah cair mikroba langsung dibuang ke saluran air.' },
];
const rect = (x: number, y: number, width: number, height: number): CSSProperties => ({ position: 'absolute', left: S(x), top: S(y), width: S(width), height: S(height) });

function CategoryIcon({ category }: { category: Choice['category'] }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="mission4-icon">{category === 'risk' ? <><path fill="#f8bc30" stroke="#bb7700" d="M16 3 30 28H2Z" /><path stroke="#513700" strokeWidth="3" strokeLinecap="round" d="M16 11v8m0 4v1" /></> : <><circle cx="16" cy="16" r="15" fill={category === 'error' ? '#df4040' : '#28a653'} /><path fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d={category === 'error' ? 'M11 11l10 10m0-10L11 21' : 'M9 16l5 5 9-10'} /></>}</svg>;
}
function CardContent({ choice }: { choice: Choice }) {
  return <><CategoryIcon category={choice.category} /><span><strong>{labels[choice.category]}:</strong> {choice.text}</span></>;
}

export function Mission4Page() {
  const { goBack, goTo } = useNavigation();
  const { exiting, transition } = useMissionTransition();
  const [choiceOrder] = useState(() => {
    const shuffled = [...choices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  const [placed, setPlaced] = useState<Record<string, Choice['id']>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const [selected, setSelected] = useState<Choice['id'] | null>(null);
  const [toast, setToast] = useState(0);
  const [complete, setComplete] = useState(false);
  const [audioOn, setAudioOn] = useState(isAudioEnabled);
  const audio = useRef<HTMLAudioElement | null>(null);
  const timer = useRef(0);
  const completed = useRef(false);
  useEffect(() => { audio.current = new Audio(click); return () => { window.clearTimeout(timer.current); audio.current?.pause(); }; }, []);
  const play = () => { if (isAudioEnabled() && audio.current) { audio.current.currentTime = 0; void audio.current.play().catch(() => {}); } };
  const place = (id: Choice['id'], target: string | null) => {
    play();
    if (!target || completed.current) return;
    const choice = choices.find(item => item.id === id);
    if (!choice || choice.target !== target || placed[target] || Object.values(placed).includes(id)) {
      setToast(Date.now()); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(0), 3000); return;
    }
    const next = { ...placed, [target]: id };
    setPlaced(next); setSelected(null);
    if (choices.every(item => next[item.target] === item.id)) {
      completed.current = true;
      markEvaluationMissionCompleted(4);
      transition(() => setComplete(true));
    }
  };
  const targetAt = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-mission4-target]')?.dataset.mission4Target ?? null;
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.id !== event.currentTarget.dataset.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 5, over: targetAt(event.clientX, event.clientY) });
  };
  const end = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.id !== event.currentTarget.dataset.id) return;
    if (drag.moved) place(drag.id, targetAt(event.clientX, event.clientY));
    setDrag(null);
  };
  return <Stage background={<img src={background} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}>
    <EvaluationHeader title="MISI 04 — EVALUASI LIMBAH!" subtitle="Identifikasi kesalahan penanganan limbah laboratorium" audioOn={audioOn} exiting={exiting} onHome={() => { play(); transition(() => goTo('splash')); }} onBack={() => { play(); transition(goBack); }} onToggle={() => { if (exiting) return; const enabled = toggleAudioEnabled(); setAudioOn(enabled); if (enabled) play(); }} />
    {complete ? <main className={`mission4-complete ${exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}`} data-testid="mission4-completion" aria-label="Misi 4 selesai" style={rect(141, 190, 1638, 835)}><img src={completeArt} alt="Misi 4 selesai: evaluasi limbah laboratorium." /><button type="button" onClick={() => { play(); transition(() => goTo('about', { aboutMode: 'closing' })); }}>SELESAI <img src={arrow} alt="" /></button></main> : <main className={exiting ? 'sterilab-bubble-out' : undefined} inert={exiting} data-testid="mission4-main" aria-label="Misi 4: Evaluasi Limbah" style={{ position: 'absolute', inset: 0 }}>
      <section className="mission4-intro sterilab-bubble-in" style={rect(132, 176, 1195, 206)}><div><h2>Pengantar</h2><p>Amati ketiga kasus kesalahan pembuangan limbah laboratorium mikrobiologi berikut. Analisis risikonya dan tentukan prosedur penanganan yang tepat sesuai SOP keselamatan kerja.</p></div><div><h2>Tugas Siswa</h2><ol><li>Identifikasi bentuk kesalahan pada masing-masing kasus.</li><li>Analisis dampak risiko bahaya yang dapat ditimbulkan.</li><li>Tarik (drag &amp; drop) kartu Kesalahan, Risiko, dan Penanganan yang benar ke kolom kasus yang tepat.</li></ol></div></section>
      <div className="mission4-cases sterilab-bubble-in" style={rect(62, 400, 1335, 565)}>{cases.map((item, index) => <section className="mission4-case" key={item.text}><div className="mission4-case-art"><p>{item.text}</p><img src={item.image} alt="" /><strong>Kasus {index + 1}</strong></div><div className="mission4-slots">{(['error', 'risk', 'solution'] as const).map(category => { const target = `case-${index + 1}-${category}`; const choice = choices.find(c => c.id === placed[target]); return <button type="button" key={target} data-mission4-target={target} data-testid={target} data-over={drag?.over === target} className={`mission4-slot ${choice ? 'is-filled' : ''}`} aria-label={`Kasus ${index + 1}, ${labels[category]}${choice ? `: ${choice.text}` : ', kosong'}`} onClick={() => { if (selected) place(selected, target); }}>{choice ? <CardContent choice={choice} /> : <><span className="mission4-slot-label">{labels[category]}</span><span>Drop di sini</span></>}</button>; })}</div></section>)}</div>
      <aside className="mission4-analysis sterilab-bubble-in" style={rect(1415, 177, 443, 798)}><h2>ANALISIS SESUAI KASUS</h2><div className="mission4-list" tabIndex={0} aria-label="Pilihan analisis">{choiceOrder.filter(choice => !Object.values(placed).includes(choice.id)).map(choice => <button key={choice.id} type="button" data-id={choice.id} data-testid={choice.id} className={`mission4-choice ${selected === choice.id ? 'is-selected' : ''} ${drag?.id === choice.id && drag.moved ? 'is-dragging' : ''}`} onPointerDown={event => { if (event.button !== 0) return; const bounds = event.currentTarget.getBoundingClientRect(); const fontSize = getComputedStyle(event.currentTarget).fontSize; event.currentTarget.setPointerCapture(event.pointerId); setDrag({ id: choice.id, x: event.clientX, y: event.clientY, dx: 0, dy: 0, left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height, fontSize, moved: false, over: null }); }} onPointerMove={move} onPointerUp={end} onPointerCancel={() => setDrag(null)} onLostPointerCapture={() => setDrag(null)} onClick={event => { if (event.detail === 0 || !drag?.moved) setSelected(choice.id); }}><CardContent choice={choice} /></button>)}</div></aside>
      {drag?.moved && createPortal(<div className="mission4-choice mission4-drag-preview" aria-hidden="true" style={{ left: drag.left + drag.dx, top: drag.top + drag.dy, width: drag.width, height: drag.height, fontSize: drag.fontSize }}><CardContent choice={choices.find(choice => choice.id === drag.id)!} /></div>, document.body)}
      <p className="mission4-sr" role="status">{Object.keys(placed).length} dari 9 analisis benar. {selected ? 'Pilih kolom kasus untuk menempatkan kartu.' : ''}</p>
      {!!toast && <div key={toast} className="mission4-toast" role="alert">Jawaban belum tepat. Periksa kembali kesesuaian analisis dengan kasusnya.</div>}
    </main>}
    <AiDisclosureBadge key={complete ? 'complete' : 'task'} exiting={exiting} />
  </Stage>;
}
