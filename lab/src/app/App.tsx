import { NavigationProvider } from './navigation';
import { ScreenRouter } from './ScreenRouter';
import { OrientationGuard } from '../presentation/components/OrientationGuard';

// Single-path SPA shell (docs/adr/0005-single-path-spa-navigation.md): no
// router, no URL ever changes from "/". OrientationGuard wraps every Screen
// so the portrait block is enforced app-wide, not per-Screen.
export function App() {
  return (
    <NavigationProvider>
      <OrientationGuard>
        <ScreenRouter />
      </OrientationGuard>
    </NavigationProvider>
  );
}
