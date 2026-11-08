import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../core/audio/audioSettings';
import { stopVoiceOver, useVoiceOver } from '../../core/audio/voiceOver';
import { prefersReducedMotion } from '../../core/a11y/motion';
import { Stage } from '../components/Stage';
import { IconButton } from '../components/IconButton';
import { AiDisclosureBadge } from '../components/AiDisclosureBadge';
import { AboutButton } from '../components/AboutButton';
import background from '../../../assets/images/02_scenes/05_tujuan_pembelajaran/background.png';
import objectivesInfo from '../../../assets/images/02_scenes/05_tujuan_pembelajaran/tujuan_pembelajaran_info.png';
import home from '../../../assets/images/01_reusable/buttons/home_btn.png';
import back from '../../../assets/images/01_reusable/buttons/back_btn.png';
import soundOn from '../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import soundOff from '../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import './objectives.css';

export function ObjectivesPage() {
  const { goTo } = useNavigation();
  const [sound, setSound] = useState(isAudioEnabled());
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef(0);
  const leaving = useRef(false);
  const voice = useVoiceOver('objectives');
  useEffect(() => () => window.clearTimeout(exitTimer.current), []);
  const leaveTo = (navigate: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    stopVoiceOver();
    if (prefersReducedMotion()) { navigate(); return; }
    setExiting(true);
    exitTimer.current = window.setTimeout(navigate, 990);
  };
  const goCover = () => leaveTo(() => goTo('splash', { showCover: true }));
  const animation = exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in';
  return <Stage background={<img src={background} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}>
    <main className="objectives">
      <h1 className="objectives-sr-only">Setelah mengikuti pembelajaran, kamu diharapkan mampu:</h1>
      <img className={`objectives-info ${animation}`} style={{ animationDelay: exiting ? '110ms' : '330ms' }} src={objectivesInfo} alt="Empat tujuan pembelajaran: menjelaskan prinsip dan prosedur teknik kerja aseptik; mengidentifikasi bahan, peralatan, dan tahapan pembuatan media kultur mikroba; menentukan prosedur pengelolaan limbah laboratorium sesuai keselamatan kerja dan perlindungan lingkungan; serta menerapkan prinsip tersebut melalui pemecahan masalah dalam simulasi laboratorium virtual." />
      <button type="button" className={`objectives-next ${animation}`} style={{ animationDelay: exiting ? '0ms' : '440ms' }} aria-label="Lanjut" onClick={() => leaveTo(() => goTo('case'))}>LANJUTKAN <span aria-hidden="true">→</span></button>
      {!exiting && (voice.status === 'ready' || voice.status === 'error') && <button type="button" className="objectives-retry" onClick={voice.toggle}>Putar narasi</button>}
      <AiDisclosureBadge position="left" className="objectives-disclosure" exiting={exiting} />
    </main>
    <IconButton src={home} alt="Menu Utama" label="Menu Utama" top="3.574%" left="max(12px, 2.499%)" size="3.791%" animationClassName={animation} animationDelayMs={exiting ? 440 : 0} onClick={goCover} />
    <IconButton src={back} alt="Kembali" label="Kembali" top="3.574%" left="max(64px, 7.609%)" size="3.791%" animationClassName={animation} animationDelayMs={exiting ? 330 : 110} onClick={goCover} />
    <AboutButton exiting={exiting} delayMs={220} onClick={() => leaveTo(() => goTo('about'))} />
    <IconButton src={sound ? soundOn : soundOff} alt={sound ? 'Matikan suara' : 'Nyalakan suara'} label={sound ? 'Matikan suara' : 'Nyalakan suara'} top="3.574%" left="min(93.931%, 100% - 52px)" size="3.791%" animationClassName={animation} animationDelayMs={220} onClick={() => { if (!leaving.current) setSound(toggleAudioEnabled()); }} />
  </Stage>;
}
