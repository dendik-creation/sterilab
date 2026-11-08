import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { StageId } from '../core/types';
import { stopVoiceOver } from '../core/audio/voiceOver';

// Every Screen the Analyst can reach, all rendered under the single "/" path
// (no react-router) - see docs/adr/0005-single-path-spa-navigation.md.
export type ScreenId =
  | 'splash'
  | 'about'
  | 'objectives'
  | 'case'
  | 'briefing'
  | 'guide'
  | 'missions'
  | 'stage'
  | 'evidence'
  | 'evaluation'
  | 'evaluation-mission-1'
  | 'evaluation-mission-2'
  | 'evaluation-mission-3'
  | 'evaluation-mission-4'
  | 'reflection'
  | 'completion';

export interface ScreenParams {
  stageId?: StageId;
  showCover?: boolean;
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

  useEffect(() => {
    window.addEventListener('popstate', stopVoiceOver);
    window.addEventListener('pagehide', stopVoiceOver);
    return () => {
      window.removeEventListener('popstate', stopVoiceOver);
      window.removeEventListener('pagehide', stopVoiceOver);
    };
  }, []);

  const goTo = useCallback((screen: ScreenId, params: ScreenParams = {}) => {
    stopVoiceOver();
    setStack((prev) => [...prev, { screen, params: screen === 'splash' ? { ...params, showCover: true } : params }]);
  }, []);

  const goBack = useCallback(() => {
    stopVoiceOver();
    setStack((prev) => {
      const next = prev.length > 1 ? prev.slice(0, -1) : [{ screen: 'splash' as const, params: {} }];
      const last = next[next.length - 1];
      return last.screen === 'splash' ? [...next.slice(0, -1), { ...last, params: { ...last.params, showCover: true } }] : next;
    });
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
