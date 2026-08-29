import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { StageId } from '../core/types';

// Every Screen the Analyst can reach, all rendered under the single "/" path
// (no react-router) - see docs/adr/0005-single-path-spa-navigation.md.
export type ScreenId =
  | 'splash'
  | 'case'
  | 'briefing'
  | 'guide'
  | 'missions'
  | 'stage'
  | 'evidence'
  | 'evaluation'
  | 'reflection'
  | 'completion';

export interface ScreenParams {
  stageId?: StageId;
}

interface ScreenEntry {
  screen: ScreenId;
  params: ScreenParams;
}

interface NavigationContextValue {
  screen: ScreenId;
  params: ScreenParams;
  goTo: (screen: ScreenId, params?: ScreenParams) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const INITIAL_ENTRY: ScreenEntry = { screen: 'splash', params: {} };

// In-memory history stack - replaces react-router's browser history so the
// URL never changes and no popstate/router listener stays alive between
// Screens (perf-first: fewer subscriptions, nothing to leak).
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<ScreenEntry[]>([INITIAL_ENTRY]);

  const goTo = useCallback((screen: ScreenId, params: ScreenParams = {}) => {
    setStack((prev) => [...prev, { screen, params }]);
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const current = stack[stack.length - 1];

  return (
    <NavigationContext.Provider value={{ screen: current.screen, params: current.params, goTo, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
