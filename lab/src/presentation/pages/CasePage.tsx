import { useEffect, useRef, useState } from 'react';
import caseBgUrl from '../../../assets/images/02_scenes/03_case/case_bg.png';
import bacaSelengkapnyaBtnUrl from '../../../assets/images/02_scenes/03_case/baca_selengkapnya_btn.png';
import newsInformationUrl from '../../../assets/images/02_scenes/03_case/news_information.png';
import lanjutBriefingBtnUrl from '../../../assets/images/02_scenes/03_case/lanjut_briefing_btn.png';
import homeBtnUrl from '../../../assets/images/01_reusable/buttons/home_btn.png';
import backBtnUrl from '../../../assets/images/01_reusable/buttons/back_btn.png';
import bgmOnBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import bgmOffBtnUrl from '../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import clickSfxUrl from '../../../assets/sounds/01_reusable/short/click.webm';
import { useNavigation } from '../../app/navigation';
import { isAudioEnabled, toggleAudioEnabled } from '../../core/audio/audioSettings';
import { Stage } from '../components/Stage';
import { PulseButton } from '../components/PulseButton';
import { IconButton } from '../components/IconButton';
import { useIsMobile } from '../hooks/useIsMobile';

// Case (Briefing Kasus) - Figma "Sterilab-APHP" node 20:1295 "Scene 02: Hook",
// frames 20:1296 ("sebelum klik baca selengkapnya") and 29:1297 ("setelah
// klik baca selengkapnya"). case_bg.png now bakes the whole "News Update"
// monitor content (title bar, headline, photo, body copy) - only the button
// (interactive) and the "after click" card + its CTA are separate art, sliced
// from Figma and placed here at that frame's own
// inset-[top_right_bottom_left] percentages against the 1920x1080 canvas.
export function CasePage() {
  const { goTo, goBack } = useNavigation();
  const isMobile = useIsMobile();
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
    goTo('briefing');
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
      <IconButton
        src={homeBtnUrl}
        alt="Menu Utama"
        label="Menu Utama"
        top="3.53%"
        left="2.5%"
        size="3.79%"
        onClick={() => {
          playClick();
          goTo('splash');
        }}
      />
      <IconButton
        src={backBtnUrl}
        alt="Kembali"
        label="Kembali"
        top="3.53%"
        left="9.5%"
        size="3.79%"
        onClick={() => {
          playClick();
          goBack();
        }}
      />
      <IconButton
        src={audioOn ? bgmOnBtnUrl : bgmOffBtnUrl}
        alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        label={audioOn ? 'Matikan suara' : 'Nyalakan suara'}
        top="3.53%"
        left="93.93%"
        size="3.79%"
        onClick={handleToggleSound}
      />

      {/* "Baca Selengkapnya" - the only interactive piece of the monitor card
          that case_bg.png leaves out, per Figma's own button slot. Two
          hand-tuned variants, not one shared percentage: this sits inside
          the monitor screen baked into case_bg.png, and a single position
          that reads correctly on a 1366px-wide desktop kept reading wrong
          (too close to the monitor's own inner border, or overlapping the
          paragraph above it) on a 568-667px-wide phone even though the
          layout is proportionally identical at both sizes - useIsMobile
          swaps in a position tuned specifically against phone screenshots
          instead of chasing one percentage that works everywhere. */}
      {isMobile ? (
        <PulseButton
          src={bacaSelengkapnyaBtnUrl}
          alt="Baca Selengkapnya"
          onClick={handleReadMore}
          style={{ top: '39.6%', left: '60.2%', width: '16.27%', aspectRatio: '256 / 35' }}
        />
      ) : (
        <PulseButton
          src={bacaSelengkapnyaBtnUrl}
          alt="Baca Selengkapnya"
          onClick={handleReadMore}
          style={{ top: '41.2%', left: '58.2%', width: '13.27%', aspectRatio: '256 / 35' }}
        />
      )}

      {/* Height-driven, not width-driven: this card is a tall (648x888)
          portrait image and the scarce dimension in landscape mode is
          vertical, not horizontal - sizing off width let it overflow the
          safe layer's bottom edge and get clipped on short viewports
          (568x320). 82% keeps it near its original desktop size (was ~629px
          tall at 1366x768 via the old width calc) while staying inside the
          safe layer at every supported height down to 320px.
          `top` is floored in px, not just %: the top-bar icons are floored
          to a 44px touch target (IconButton), which makes them
          proportionally bigger than their designed 3.79% on a small
          viewport - a plain 12.71% top for this card no longer clears them
          there (icon bottom edge reaches ~17% of safe height at 568x320
          once floored) and the card's top corner sits under the icons. */}
      {newsOpen && (
        <img
          src={newsInformationUrl}
          alt="Berita Terkini: Dugaan Keracunan Makanan di Kegiatan Sekolah - ringkasan kejadian dan narasi lengkap kasus"
          className="sterilab-slide-in-fade"
          style={{
            position: 'absolute',
            top: 'max(70px, 12.71%)',
            left: '3.22%',
            height: 'max(220px, 82%)',
            maxHeight: 'calc(100% - 90px)',
            width: 'auto',
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
          style={{ top: '84.88%', left: '38.49%', width: 'max(230px, 22.49%)', aspectRatio: '434 / 79' }}
        />
      )}
    </Stage>
  );
}
