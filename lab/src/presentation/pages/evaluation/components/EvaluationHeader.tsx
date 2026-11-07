import home from '../../../../../assets/images/01_reusable/buttons/home_btn.png';
import back from '../../../../../assets/images/01_reusable/buttons/back_btn.png';
import soundOn from '../../../../../assets/images/01_reusable/buttons/bgm_on_btn.png';
import soundOff from '../../../../../assets/images/01_reusable/buttons/bgm_off_btn.png';
import { IconButton } from '../../../components/IconButton';
import { COLOR, S, T, textBase } from '../../stages/teknik-aseptik/geometry';

export function EvaluationHeader({ title, subtitle, titleTestId, audioOn, exiting, onHome, onBack, onToggle }: {
  title: string; subtitle: string; audioOn: boolean; exiting: boolean;
  titleTestId?: string;
  onHome: () => void; onBack: () => void; onToggle: () => void;
}) {
  const animation = exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in';
  return <>
    <header className={animation} style={{ position: 'absolute', inset: '0 0 auto', height: 'max(60px, 7.682cqw)', background: COLOR.band, borderBottom: `${T(2, 1)} solid ${COLOR.navy}`, display: 'flex', alignItems: 'center', zIndex: 5 }}>
      <div style={{ marginLeft: `max(116px, ${S(264)})`, display: 'flex', flexDirection: 'column', gap: S(10.3), whiteSpace: 'nowrap' }}>
        <h1 data-testid={titleTestId} style={{ ...textBase, fontSize: T(38, 15), fontWeight: 800, color: COLOR.navy }}>{title}</h1>
        <p style={{ ...textBase, fontSize: T(25, 10), fontWeight: 500, color: COLOR.navy }}>{subtitle}</p>
      </div>
    </header>
    <IconButton src={home} alt="Menu Utama" label="Menu Utama" top="3.574%" left="max(12px, 2.499%)" size="3.791%" zIndex={6} animationClassName={animation} onClick={onHome} />
    <IconButton src={back} alt="Kembali" label="Kembali" top="3.574%" left="max(64px, 7.609%)" size="3.791%" zIndex={6} animationClassName={animation} onClick={onBack} />
    <IconButton src={audioOn ? soundOn : soundOff} alt={audioOn ? 'Matikan suara' : 'Nyalakan suara'} label={audioOn ? 'Matikan suara' : 'Nyalakan suara'} pressed={audioOn} top="3.574%" left="min(93.931%, 100% - 52px)" size="3.791%" zIndex={6} animationClassName={animation} onClick={onToggle} />
  </>;
}
