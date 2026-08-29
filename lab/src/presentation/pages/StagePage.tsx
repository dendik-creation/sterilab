import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { useNavigation } from '../../app/navigation';

// Stage workspace 2/3 canvas + instruction panel 1/3 DOM (03-information-architecture.md).
// Instruction panel must carry the parallel DOM control layer per Stage (FR-08) -
// added alongside each Stage's real content, not stubbed here.
export function StagePage() {
  const { params } = useNavigation();
  const stageId = params.stageId;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let game: Phaser.Game | undefined;
    let cancelled = false;

    // Phaser is lazy-loaded per Stage, not part of the initial bundle
    // (07-technical-spec.md > Performance targets).
    import('../../game/PhaserGame').then(({ createPhaserGame }) => {
      if (cancelled) return;
      game = createPhaserGame(el, { stageId });
    });

    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [stageId]);

  return (
    <main style={{ display: 'flex', height: '100%' }}>
      <div ref={containerRef} style={{ flex: 2 }} />
      <aside style={{ flex: 1 }}>
        <h2>Instruksi</h2>
      </aside>
    </main>
  );
}
