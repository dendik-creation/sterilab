import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '../../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../../core/audio/audioSettings';
import { prefersReducedMotion } from '../../../core/a11y/motion';
import { Stage } from '../../components/Stage';
import { IconButton } from '../../components/IconButton';
import { AiDisclosureBadge } from '../../components/AiDisclosureBadge';
import background from '../../../../assets/images/02_scenes/06_tentang/background.png';
import logo from '../../../../assets/images/00_identity/main_logo.png';
import home from '../../../../assets/images/01_reusable/buttons/home_btn.png';
import back from '../../../../assets/images/01_reusable/buttons/back_btn.png';
import soundOn from '../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import soundOff from '../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import './about.css';

export function AboutPage() {
  const { goTo, goBack } = useNavigation();
  const [sound, setSound] = useState(isAudioEnabled());
  const [exiting, setExiting] = useState(false);
  const leaving = useRef(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const leaveTo = (navigate: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    if (prefersReducedMotion()) { navigate(); return; }
    setExiting(true);
    timer.current = window.setTimeout(navigate, 660);
  };
  const animation = exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in';
  return <Stage background={<img src={background} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}>
    <header className="about-header">
      <div className={animation} style={{ animationDelay: exiting ? '110ms' : '0ms' }}><h1>TENTANG STERILAB</h1><p>Lab Maya Teknik Kerja Aseptik, Pembuatan Media Kultur Mikroba, dan Pengelolaan Limbah</p></div>
    </header>
    <IconButton src={home} alt="Menu Utama" label="Menu Utama" top="3.574%" left="max(12px, 2.499%)" size="3.791%" zIndex={6} animationClassName={animation} animationDelayMs={exiting ? 110 : 0} onClick={() => leaveTo(() => goTo('splash', { showCover: true }))} />
    <IconButton src={back} alt="Kembali" label="Kembali" top="3.574%" left="max(64px, 7.609%)" size="3.791%" zIndex={6} animationClassName={animation} animationDelayMs={exiting ? 110 : 0} onClick={() => leaveTo(goBack)} />
    <IconButton src={sound ? soundOn : soundOff} alt={sound ? 'Matikan suara' : 'Nyalakan suara'} label={sound ? 'Matikan suara' : 'Nyalakan suara'} top="3.574%" left="min(93.931%, 100% - 52px)" size="3.791%" zIndex={6} animationClassName={animation} animationDelayMs={exiting ? 110 : 0} onClick={() => { if (!leaving.current) setSound(toggleAudioEnabled()); }} />
    <main className={`about-card ${animation}`} tabIndex={0} aria-label="Informasi tentang SteriLab">
      <img className="about-logo" src={logo} alt="SteriLab" />
      <p className="about-description">SteriLab adalah game edukasi interaktif untuk simulasi teknik aseptik, pembuatan media kultur, dan pengelolaan limbah laboratorium bagi siswa SMK secara aman dan kontekstual.</p>
      <section className="about-profile"><h2>PROFIL PENGEMBANG</h2><dl>
        <dt>Judul</dt><dd>SteriLab: Lab Maya Teknik Kerja Aseptik, Pembuatan Media Kultur Mikroba, dan Pengelolaan Limbah</dd>
        <dt>Pengembang</dt><dd>Creator (Risatul Munawaroh, S.TP., Gr)<br />Programmer (Dendi' Setiawan)<br />Desain Asset (Alvino Lana Denta)</dd>
        <dt>Program Keahlian</dt><dd>Agribisnis Pengolahan Hasil Pertanian (APHP)</dd>
        <dt>Instansi</dt><dd>SMK</dd>
      </dl></section>
      <section className="about-sources"><dl>
        <dt>SUMBER ASET</dt><dd>Ilustrasi, karakter, dan ikon dibuat dengan bantuan ChatGPT (OpenAI)</dd>
        <dt>MUSIK</dt><dd>Pixabay - pixabay.com (Free License)</dd>
        <dt>DAFTAR PUSTAKA</dt><dd>Materi mengacu pada pedoman keselamatan kerja, teknik aseptik, pembuatan media kultur, dan pengelolaan limbah laboratorium dari sumber yang relevan.</dd>
      </dl></section>
    </main>
    <AiDisclosureBadge exiting={exiting} />
  </Stage>;
}
