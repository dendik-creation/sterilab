import { useNavigation } from './navigation';
import { SplashPage } from '../presentation/pages/SplashPage';
import { CasePage } from '../presentation/pages/CasePage';
import { BriefingPage } from '../presentation/pages/BriefingPage';
import { GuidePage } from '../presentation/pages/GuidePage';
import { MissionsPage } from '../presentation/pages/MissionsPage';
import { StagePage } from '../presentation/pages/StagePage';
import { EvidencePage } from '../presentation/pages/EvidencePage';
import { EvaluationPage } from '../presentation/pages/EvaluationPage';
import { ReflectionPage } from '../presentation/pages/ReflectionPage';
import { CompletionPage } from '../presentation/pages/CompletionPage';

// Swaps the current Screen in place of react-router's <Outlet> - the whole
// app lives at "/" (docs/adr/0005-single-path-spa-navigation.md), so this is
// the only place that maps a ScreenId to a component.
export function ScreenRouter() {
  const { screen } = useNavigation();

  switch (screen) {
    case 'splash':
      return <SplashPage />;
    case 'case':
      return <CasePage />;
    case 'briefing':
      return <BriefingPage />;
    case 'guide':
      return <GuidePage />;
    case 'missions':
      return <MissionsPage />;
    case 'stage':
      return <StagePage />;
    case 'evidence':
      return <EvidencePage />;
    case 'evaluation':
      return <EvaluationPage />;
    case 'reflection':
      return <ReflectionPage />;
    case 'completion':
      return <CompletionPage />;
  }
}
