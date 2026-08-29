import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import caseBgUrl from '../../../assets/images/02_scenes/03_case/case_bg.png';
import bacaSelengkapnyaBtnUrl from '../../../assets/images/02_scenes/03_case/baca_selengkapnya_btn.png';
import newsInformationUrl from '../../../assets/images/02_scenes/03_case/news_information.png';
import lanjutBriefingBtnUrl from '../../../assets/images/02_scenes/03_case/lanjut_briefing_btn.png';
import homeBtnUrl from '../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import clickSfxUrl from '../../../assets/sounds/01_reusable/short/click.webm';
import { isAudioEnabled, toggleAudioEnabled } from '../../core/audio/audioSettings';
import { Stage } from '../components/Stage';
import { PulseButton } from '../components/PulseButton';

// Case (Briefing Kasus) - Figma "Sterilab-APHP" node 20:1295 "Scene 02: Hook",
// frames 20:1296 ("sebelum klik baca selengkapnya") and 29:1297 ("setelah
// klik baca selengkapnya"). case_bg.png now bakes the whole "News Update"
// monitor content (title bar, headline, photo, body copy) - only the button
// (interactive) and the "after click" card + its CTA are separate art, sliced
// from Figma and placed here at that frame's own
// inset-[top_right_bottom_left] percentages against the 1920x1080 canvas.
const TOPBAR_ICON: CSSProperties = { position: 'absolute', width: '3.79%', height: '6.65%', top: '3.53%' };

export function CasePage() {
  const navigate = useNavigate();
  const [newsOpen, setNewsOpen] = useState(false);
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    clickAudioRef.current = new Audio(clickSfxUrl);
  }, []);

  const playClick = () => {
    if (!isAudioEnabled()) return;
    const audio = clickAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };

  const handleToggleSound = () => {
    const enabled = toggleAudioEnabled();
    setAudioOn(enabled);
    if (enabled) playClick();
  };

  const handleReadMore = () => {
    playClick();
    setNewsOpen(true);
  };

  const handleContinue = () => {
    playClick();
    navigate('/briefing');
  };

  return (
    <Stage
      background={
        <img
          src={caseBgUrl}
          alt="Ruang laboratorium tempat dua analis menerima sampel makanan, dengan monitor menampilkan berita dugaan keracunan makanan"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      }
    >
      {/* Top bar: home / back / sound - reused 01_reusable button art, DOM
          buttons with the same hover/press feedback token as HomeScene. */}
      <IconButton srcUrl={homeBtnUrl} alt="Menu Utama" label="Menu Utama" style={{ ...TOPBAR_ICON, left: '2.5%' }} onClick={() => { playClick(); navigate('/'); }} />
      <IconButton srcUrl={backBtnUrl} alt="Kembali" label="Kembali" style={{ ...TOPBAR_ICON, left: '7.61%' }} onClick={() => { playClick(); navigate(-1); }} />
      <IconButton
        srcUrl={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
        alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        style={{ ...TOPBAR_ICON, left: '93.93%' }}
        onClick={handleToggleSound}
      />

      {/* "Baca Selengkapnya" - the only interactive piece of the monitor card
          that case_bg.png leaves out, per Figma's own button slot. */}
      <PulseButton
        src={bacaSelengkapnyaBtnUrl}
        alt="Baca Selengkapnya"
        onClick={handleReadMore}
        style={{ top: '42.42%', left: '58.38%', width: '13.27%', aspectRatio: '256 / 35' }}
      />

      {newsOpen && (
        <img
          src={newsInformationUrl}
          alt="Berita Terkini: Dugaan Keracunan Makanan di Kegiatan Sekolah - ringkasan kejadian dan narasi lengkap kasus"
          className="sterilab-slide-in-fade"
          style={{
            position: 'absolute',
            top: '12.71%',
            left: '3.22%',
            width: '33.61%',
            aspectRatio: '648 / 888',
            filter: 'drop-shadow(0 12px 32px rgba(6, 54, 104, 0.25))',
          }}
        />
      )}

      {newsOpen && (
        <PulseButton
          src={lanjutBriefingBtnUrl}
          alt="Lanjut Briefing"
          onClick={handleContinue}
          style={{ top: '84.88%', left: '38.49%', width: '22.49%', aspectRatio: '434 / 79' }}
        />
      )}
    </Stage>
  );
}

function IconButton({
  srcUrl,
  alt,
  label,
  style,
  onClick,
}: {
  srcUrl: string;
  alt: string;
  label: string;
  style: CSSProperties;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        ...style,
        border: 'none',
        padding: 0,
        background: 'transparent',
        cursor: 'pointer',
        transition: 'transform 120ms ease-out',
      }}
      onPointerOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
      onPointerOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <img src={srcUrl} alt={alt} style={{ width: '100%', height: '100%', display: 'block' }} />
    </button>
  );
}
