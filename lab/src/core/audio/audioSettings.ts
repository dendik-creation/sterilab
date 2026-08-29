// Global audio on/off state, shared between React and Phaser (both run in the
// same JS runtime) and persisted across sessions. Drives Phaser's Sound Manager
// mute flag (see PhaserGame.ts) so toggling here silences everything - SFX now,
// BGM once that asset lands.
const STORAGE_KEY = 'sterilab:audioEnabled';

// Sound defaults to off (03-information-architecture.md > Cover: "sound off
// default"; TASKS.md > Aturan Lintas Screen top bar) until the Analyst opts in.
function readStored(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

let enabled = readStored();
const listeners = new Set<(enabled: boolean) => void>();

export function isAudioEnabled(): boolean {
  return enabled;
}

export function setAudioEnabled(next: boolean): void {
  if (next === enabled) return;
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // Storage unavailable (private mode) - in-memory state still holds for this session.
  }
  listeners.forEach((listener) => listener(enabled));
}

export function toggleAudioEnabled(): boolean {
  setAudioEnabled(!enabled);
  return enabled;
}

export function onAudioEnabledChange(listener: (enabled: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
