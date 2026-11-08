import aiIconUrl from '../../../assets/images/01_reusable/icons/ai_icon.png';
import './ai-disclosure-badge.css';

export function AiDisclosureBadge({ layout = 'horizontal', position = 'right', exiting = false, className = '' }: {
  layout?: 'horizontal' | 'box';
  position?: 'left' | 'right';
  exiting?: boolean;
  className?: string;
}) {
  return (
    <div className={`ai-disclosure-position ai-disclosure-position--${position} ${className}`}>
    <div className={`ai-disclosure ai-disclosure--${layout} ${exiting ? 'sterilab-bubble-out' : 'sterilab-bubble-in'}`} style={{ animationDelay: exiting ? '0ms' : '550ms' }}>
      <img className="ai-disclosure__icon" src={aiIconUrl} alt="" />
      <p>Ilustrasi visual dalam media SteriLab dibuat dengan bantuan Artificial Intelligence (AI) dan digunakan sebagai pendukung pembelajaran.</p>
    </div>
    </div>
  );
}

export function AiDisclosureBox({ exiting = false, mission }: { exiting?: boolean; mission: 1 | 2 | 3 }) {
  return <AiDisclosureBadge layout="box" position="left" exiting={exiting} className={`ai-disclosure-position--mission-${mission}`} />;
}
