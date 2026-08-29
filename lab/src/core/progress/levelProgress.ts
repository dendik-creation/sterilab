import type { StageStatus } from '../types';

// Sequential unlock state for the Missions dashboard (Figma "Sterilab-APHP"
// node 29:2435 "Scene 03: Navigasi (Menu Utama)"): menu N+1 only opens once
// menu N is finished, and a finished menu stays re-openable (TASKS.md >
// Screen 5). Same plain-function + listener shape as
// core/audio/audioSettings.ts - no React/Phaser import in the core layer.
const STORAGE_KEY = 'sterilab:levelProgress';
const VERSION = 1;

// The five menu cards the Figma frame actually ships: Teknik Kerja Aseptik,
// Pembuatan Media Kultur Mikroba, Pengelolaan Limbah Laboratorium, Evaluasi,
// Refleksi. Levels are addressed 1-based, matching the numbered badge baked
// into each card's art.
export const LEVEL_COUNT = 5;

// No 'in_progress' here: a menu is either not reachable yet, reachable, or
// done. Resume-mid-Stage state belongs to the Stage's own persistence, not to
// this unlock ledger.
export type LevelStatus = Exclude<StageStatus, 'in_progress'>;

interface StoredProgress {
  version: number;
  completed: number;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(LEVEL_COUNT, Math.max(0, Math.floor(value)));
}

// A payload from an older/unknown schema version is discarded rather than
// migrated - re-earning progress is cheaper than resuming from a shape we
// can no longer interpret, and this is the first version to ship.
function readStored(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    if (parsed?.version !== VERSION) return 0;
    return clamp(Number(parsed.completed));
  } catch {
    return 0;
  }
}

let completed = readStored();
const listeners = new Set<(completed: number) => void>();

function persist(): void {
  try {
    const payload: StoredProgress = { version: VERSION, completed };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable (private mode) - in-memory state still holds for
    // this session, mirroring audioSettings.ts.
  }
}

function emit(): void {
  listeners.forEach((listener) => listener(completed));
}

export function getCompletedLevelCount(): number {
  return completed;
}

export function isLevelUnlocked(level: number): boolean {
  return level <= completed + 1;
}

// Pure form, so a React render can derive every card's status from the count
// it already subscribed to instead of reading module state behind React's back
// (which would leave the re-render dependency invisible).
export function levelStatusFor(completedCount: number, level: number): LevelStatus {
  if (level <= completedCount) return 'completed';
  if (level === completedCount + 1) return 'available';
  return 'locked';
}

export function getLevelStatus(level: number): LevelStatus {
  return levelStatusFor(completed, level);
}

// Only the next unlocked menu can advance the ledger - finishing an already
// completed menu again is a no-op, and a locked one can never mark itself
// done (so the unlock chain can't be skipped by a stray call).
export function markLevelCompleted(level: number): void {
  if (!isLevelUnlocked(level)) return;
  const next = clamp(Math.max(completed, level));
  if (next === completed) return;
  completed = next;
  persist();
  emit();
}

export function resetLevelProgress(): void {
  if (completed === 0) return;
  completed = 0;
  persist();
  emit();
}

export function onLevelProgressChange(listener: (completed: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
