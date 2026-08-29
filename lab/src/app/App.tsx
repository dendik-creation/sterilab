import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useOrientationLock } from './useOrientationLock';
import { RotatePrompt } from '../presentation/components/RotatePrompt';

// RotatePrompt only overlays the page during a portrait dip - it must never
// unmount RouterProvider, or any Cover/Stage Phaser game underneath would be
// destroyed (losing progress) instead of paused (ADR-0002). The actual
// pause/mute of Phaser + input happens in PhaserGame.ts's orientation gate.
export function App() {
  const isPortrait = useOrientationLock();

  return (
    <>
      <RouterProvider router={router} />
      {isPortrait && <RotatePrompt />}
    </>
  );
}
