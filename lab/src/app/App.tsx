import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useOrientationLock } from './useOrientationLock';
import { RotatePrompt } from '../presentation/components/RotatePrompt';

export function App() {
  const isPortrait = useOrientationLock();

  if (isPortrait) {
    return <RotatePrompt />;
  }

  return <RouterProvider router={router} />;
}
