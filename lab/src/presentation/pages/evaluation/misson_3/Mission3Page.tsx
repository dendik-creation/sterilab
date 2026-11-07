import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import background from '../../../../../assets/images/02_scenes/04_04_evaluasi/backgrounds/evaluasi_bg.png';
import table from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_03_misi_3/pda_formulation_table_left_section.png';
import illustration from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_03_misi_3/formulation_pda_right_section.png';
import incorrectArt from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_03_misi_3/incorrect_dialog_modal.png';
import correctArt from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_03_misi_3/correct_dialog_modal.png';
import completeArt from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_03_misi_3/complete_mission_card.png';
import home from '../../../../../assets/images/01_reusable/buttons/home_btn.png';
import back from '../../../../../assets/images/01_reusable/buttons/back_btn.png';
import soundOn from '../../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import soundOff from '../../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import arrow from '../../../../../assets/images/01_reusable/icons/arrow_right.png';
import check from '../../../../../assets/images/01_reusable/icons/check_success.png';
import clickSound from '../../../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../../core/audio/audioSettings';
import { markEvaluationMissionCompleted } from '../../../../core/progress/evaluationProgress';
import { Stage } from '../../../components/Stage';
import { IconButton } from '../../../components/IconButton';
import { COLOR, S, T, textBase } from '../geometry';
import './mission3.css';

const choices = [
  { id: 'A', label: 'A — 250 mL — 9,75 gram', x: 498, y: 680 },
  { id: 'B', label: 'B — 250 mL — 12,25 gram', x: 834, y: 680 },
  { id: 'C', label: 'C — 500 mL — 15,00 gram', x: 498, y: 803 },
  { id: 'D', label: 'D — 500 mL — 19,50 gram', x: 834, y: 803 },
] as const;
type Choice = typeof choices[number]['id'];
type Feedback = 'correct' | 'incorrect' | null;
const rect = (x: number, y: number, width: number, height: number): CSSProperties => ({ position: 'absolute', left: S(x), top: S(y), width: S(width), height: S(height) });

export function Mission3Page() {
  const { goBack, goTo } = useNavigation();
  const [selected, setSelected] = useState<Choice[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [complete, setComplete] = useState(false);
  const [audioOn, setAudioOn] = useState(isAudioEnabled);
  const audio = useRef<HTMLAudioElement | null>(null);
  const checkButton = useRef<HTMLButtonElement>(null);
  const feedbackButton = useRef<HTMLButtonElement>(null);

  useEffect(() => { audio.current = new Audio(clickSound); }, []);
  useEffect(() => { if (feedback) feedbackButton.current?.focus(); }, [feedback]);
  const play = () => {
    if (!isAudioEnabled() || !audio.current) return;
    audio.current.currentTime = 0;
    void audio.current.play().catch(() => {});
  };
  const toggle = (id: Choice) => {
    play();
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 2 ? [...current, id] : current);
  };
  const submit = () => {
    if (selected.length !== 2 || feedback) return;
    play();
    setFeedback(selected.includes('A') && selected.includes('D') ? 'correct' : 'incorrect');
  };
  const continueFeedback = () => {
    play();
    if (feedback === 'correct') {
      markEvaluationMissionCompleted(3);
      setComplete(true);
    } else {
      requestAnimationFrame(() => checkButton.current?.focus());
    }
    setFeedback(null);
  };

  return <Stage background={<img src={background} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}>
    <div inert={!!feedback} style={{ position: 'absolute', inset: 0 }}>
      <header style={{ position: 'absolute', inset: '0 0 auto', height: T(146, 60), background: COLOR.band, borderBottom: `${T(2, 1)} solid ${COLOR.navy}`, zIndex: 5 }}>
        <div className="mission3-header-text" style={{ position: 'absolute', left: `max(116px, ${S(260)})`, top: S(32), whiteSpace: 'nowrap' }}>
          <h1 style={{ ...textBase, fontSize: T(36, 15), lineHeight: 1.25, fontWeight: 800, color: COLOR.navy }}>MISI 03 — INVESTIGASI MUTU MEDIA!</h1>
          <p style={{ ...textBase, fontSize: T(24, 10), lineHeight: 1.25, fontWeight: 500, color: COLOR.navy }}>Analisis data formulasi dan temukan dua kelompok yang benar</p>
        </div>
      </header>
      <IconButton src={home} alt="Menu Utama" label="Menu Utama" top="3.574%" left="max(12px, 2.499%)" size="3.791%" zIndex={6} animationClassName="sterilab-bubble-in" animationDelayMs={0} onClick={() => { play(); goTo('splash'); }} />
      <IconButton src={back} alt="Kembali" label="Kembali" top="3.574%" left="max(64px, 7.609%)" size="3.791%" zIndex={6} animationClassName="sterilab-bubble-in" animationDelayMs={80} onClick={() => { play(); goBack(); }} />
      <IconButton src={audioOn ? soundOn : soundOff} alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'} label={audioOn ? 'Matikan suara' : 'Nyalakan suara'} pressed={audioOn} top="3.574%" left="min(93.931%, 100% - 52px)" size="3.791%" zIndex={6} animationClassName="sterilab-bubble-in" animationDelayMs={160} onClick={() => { const enabled = toggleAudioEnabled(); setAudioOn(enabled); if (enabled) play(); }} />
      {complete ? <main aria-label="Misi 3 selesai" data-testid="mission3-completion" className="mission3-completion" style={{ position: 'absolute', inset: 0 }}>
        <img src={completeArt} alt="Hebat! Misi 03 selesai. Kelompok A dan D memiliki formulasi yang benar. Perhitungan mengikuti petunjuk produk dan volume akhir." style={{ ...rect(190, 191, 1541, 831), objectFit: 'contain' }} />
        <img src={check} alt="" style={{ ...rect(1094, 861, 97, 97), objectFit: 'contain' }} />
        <button className="mission3-cta" style={rect(1233, 868, 416, 82)} onClick={() => { play(); goBack(); }}>LANJUT MISI <img src={arrow} alt="" /></button>
      </main> : <main aria-label="Misi 3: Investigasi Mutu Media" data-testid="mission3-main" className="mission3-main" style={{ position: 'absolute', inset: 0 }}>
        <div className="mission3-panel" style={rect(76, 197, 348, 831)} />
        <div className="mission3-panel" style={rect(464, 197, 1381, 831)} />
        <aside className="mission3-instructions" style={rect(98, 228, 305, 780)} tabIndex={0} aria-label="Pengantar dan tugas siswa">
          <h2>Pengantar</h2>
          <p>Seorang analis laboratorium akan membuat media PDA untuk pengujian mikrobiologi.</p>
          <p>Berdasarkan petunjuk produk, setiap 1.000 mL media membutuhkan 39 gram bubuk PDA.</p>
          <p>Analisis data berikut untuk menentukan formulasi yang tepat.</p>
          <hr />
          <h2>Tugas Siswa</h2>
          <p>Pilih DUA kelompok yang memiliki perhitungan formulasi media PDA dengan benar.</p>
          <ol><li>Perhatikan volume akhir media.</li><li>Bandingkan massa bubuk PDA.</li><li>Pilih dua formulasi yang sesuai.</li></ol>
        </aside>
        <img src={table} alt="Data formulasi PDA: A, 250 mL, 9,75 gram; B, 250 mL, 12,25 gram; C, 500 mL, 15,00 gram; D, 500 mL, 19,50 gram." style={{ ...rect(485, 225, 664, 398), objectFit: 'contain' }} />
        <img src={illustration} alt="Analis laboratorium mengamati empat formulasi PDA." style={{ ...rect(1170, 225, 647, 667), objectFit: 'contain' }} />
        <p className="mission3-choice-heading" style={rect(502, 633, 400, 30)}>Pilih dua kelompok:</p>
        {choices.map(choice => <button key={choice.id} type="button" className="mission3-choice" aria-pressed={selected.includes(choice.id)} data-testid={`mission3-choice-${choice.id}`} style={rect(choice.x, choice.y, 298, 99)} onClick={() => toggle(choice.id)}>{choice.label}</button>)}
        <div role="status" aria-live="polite" data-testid="mission3-count" className="mission3-count" style={rect(497, 943, 360, 53)}>Formulasi dipilih: <strong>{selected.length}/2</strong></div>
        <button ref={checkButton} className="mission3-cta" style={rect(1434, 941, 372, 56)} disabled={selected.length !== 2} onClick={submit}>PERIKSA JAWABAN <img src={arrow} alt="" /></button>
      </main>}
    </div>
    {feedback && <div className="mission3-overlay" onKeyDown={event => { if (event.key === 'Tab') { event.preventDefault(); feedbackButton.current?.focus(); } }}>
      <section role="dialog" aria-modal="true" aria-label={feedback === 'correct' ? 'Jawaban benar' : 'Jawaban belum tepat'} className="mission3-dialog" style={feedback === 'correct' ? rect(691, 209, 539, 662) : rect(672, 231, 576, 630)}>
        <img src={feedback === 'correct' ? correctArt : incorrectArt} alt={feedback === 'correct' ? 'Jawaban benar! Kelompok A dan D sesuai dengan acuan 39 gram PDA per 1.000 mL.' : 'Jawaban belum tepat. Periksa kembali perhitungan berdasarkan volume akhir dan acuan 39 gram PDA per 1.000 mL.'} className="mission3-dialog-art" />
        <button ref={feedbackButton} type="button" className="mission3-cta mission3-dialog-button" style={feedback === 'incorrect' ? { bottom: '5.5%' } : undefined} onClick={continueFeedback}>{feedback === 'correct' ? 'LANJUT' : 'COBA LAGI'} <img src={arrow} alt="" /></button>
      </section>
    </div>}
  </Stage>;
}
