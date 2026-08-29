import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { useNavigation } from '../../app/navigation';
import type { StageId } from '../../core/types';
import { TeknikAseptikPage } from './stages/TeknikAseptikPage';

// One Screen for all five practice Stages, selected by `params.stageId`
// (docs/adr/0005-single-path-spa-navigation.md).
//
// `teknik-aseptik` is a DOM Screen rather than a Phaser one. Its Figma frames
// (canvas 42:678, LANGKAH 1..12) are a chrome-heavy procedure tracker - live
// counter, step title, instruction pills - sitting over a static illustration
// whose only interaction is "click the right object next". Rendering that copy
// as real DOM keeps it selectable, translatable and reachable by a screen
// reader; baking it into a canvas would give up all three to gain nothing.
// The remaining four Stages still boot Phaser below, and this deviation from
// TASKS.md > Screen 9's "Bangun workspace Phaser" is recorded there.
export function StagePage() {
  const { params } = useNavigation();
  const stageId = params.stageId;

  if (stageId === 'teknik-aseptik') return <TeknikAseptikPage />;

  return <PhaserStage stageId={stageId} />;
}

// Stage workspace 2/3 canvas + instruction panel 1/3 DOM (03-information-architecture.md).
// Instruction panel must carry the parallel DOM control layer per Stage (FR-08) -
// added alongside each Stage's real content, not stubbed here.
function PhaserStage({ stageId }: { stageId?: StageId }) {
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
