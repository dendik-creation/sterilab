import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { NavigationProvider, useNavigation } from '../../../../app/navigation';
import { ScreenRouter } from '../../../../app/ScreenRouter';
import { Mission3Page } from './Mission3Page';
import '../../../../index.css';

function MenuAudit() {
  const { goTo } = useNavigation();
  useEffect(() => { goTo('evaluation'); }, [goTo]);
  return <ScreenRouter />;
}

createRoot(document.getElementById('root')!).render(<NavigationProvider>{location.search ? <MenuAudit /> : <Mission3Page />}</NavigationProvider>);
