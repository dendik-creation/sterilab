import { useRef } from 'react';
import about from '../../../assets/images/01_reusable/buttons/tentang_btn.png';
import { IconButton } from './IconButton';

export function AboutButton({ onClick, exiting, delayMs }: { onClick: () => void; exiting: boolean; delayMs: number }) {
  const clicked = useRef(false);
  return <IconButton src={about} alt="Tentang SteriLab" label="Tentang SteriLab" top="3.574%" left="min(89%, 100% - 104px)" size="3.791%" animationClassName={exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'} animationDelayMs={delayMs} onClick={() => { if (!clicked.current) { clicked.current = true; onClick(); } }} />;
}
