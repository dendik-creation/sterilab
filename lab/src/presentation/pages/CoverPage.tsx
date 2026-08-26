import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type Phaser from 'phaser';

// First paint of the app is the splash (Boot scene: real preloader + tap-to-continue),
// which now flows straight into the Home scene (node 2:3) inside the same Phaser
// game - lazy-loaded the same way Stage does it (07-technical-spec.md > Performance
// targets). "Mulai Menjelajah" on Home hands control back here to continue into the app.
export function CoverPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let game: Phaser.Game | undefined;
    let cancelled = false;

    import('../../game/PhaserGame').then(({ createSplashGame }) => {
      if (cancelled) return;
      game = createSplashGame(el, () => navigate('/case'));
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [navigate]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
