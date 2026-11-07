import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { NavigationProvider, useNavigation } from '../../../../app/navigation';
import { ScreenRouter } from '../../../../app/ScreenRouter';
import '../../../../index.css';

function Audit() {
  const { goTo } = useNavigation();
  useEffect(() => { goTo('evaluation'); }, [goTo]);
  return <ScreenRouter />;
}

createRoot(document.getElementById('root')!).render(<NavigationProvider><Audit /></NavigationProvider>);
