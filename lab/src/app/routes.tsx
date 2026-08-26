import { createBrowserRouter } from 'react-router-dom';
import { CoverPage } from '../presentation/pages/CoverPage';
import { CasePage } from '../presentation/pages/CasePage';
import { BriefingPage } from '../presentation/pages/BriefingPage';
import { GuidePage } from '../presentation/pages/GuidePage';
import { MissionsPage } from '../presentation/pages/MissionsPage';
import { StagePage } from '../presentation/pages/StagePage';
import { EvidencePage } from '../presentation/pages/EvidencePage';
import { EvaluationPage } from '../presentation/pages/EvaluationPage';
import { ReflectionPage } from '../presentation/pages/ReflectionPage';
import { CompletionPage } from '../presentation/pages/CompletionPage';

// Route list per 03-information-architecture.md sitemap / 07-technical-spec.md Routes.
export const router = createBrowserRouter([
  { path: '/', element: <CoverPage /> },
  { path: '/case', element: <CasePage /> },
  { path: '/briefing', element: <BriefingPage /> },
  { path: '/guide', element: <GuidePage /> },
  { path: '/missions', element: <MissionsPage /> },
  { path: '/missions/:stageId', element: <StagePage /> },
  { path: '/evidence', element: <EvidencePage /> },
  { path: '/evaluation', element: <EvaluationPage /> },
  { path: '/reflection', element: <ReflectionPage /> },
  { path: '/completion', element: <CompletionPage /> },
]);
