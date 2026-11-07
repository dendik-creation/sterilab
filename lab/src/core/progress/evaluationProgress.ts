const STORAGE_KEY = 'sterilab:evaluationProgress';
const VERSION = 1;

export const EVALUATION_MISSION_COUNT = 4;

export type EvaluationMissionStatus = 'completed' | 'available' | 'locked';

interface StoredProgress {
  version: number;
  completed: number;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(EVALUATION_MISSION_COUNT, Math.max(0, Math.floor(value)));
}

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
    let existing: Record<string, unknown> = {};
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) existing = parsed as Record<string, unknown>;
    } catch {
      // Replace malformed progress with the current valid state.
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, version: VERSION, completed } satisfies StoredProgress));
  } catch {
    // Keep the in-memory progress for this session when storage is unavailable.
  }
}

function emit(): void {
  listeners.forEach((listener) => listener(completed));
}

export function getCompletedEvaluationMissionCount(): number {
  return completed;
}

export function evaluationMissionStatusFor(completedCount: number, mission: number): EvaluationMissionStatus {
  if (!Number.isInteger(mission) || mission < 1 || mission > EVALUATION_MISSION_COUNT) return 'locked';
  const progress = clamp(completedCount);
  if (mission <= progress) return 'completed';
  return mission === progress + 1 ? 'available' : 'locked';
}

export function markEvaluationMissionCompleted(mission: number): void {
  completed = Math.max(completed, readStored());
  if (evaluationMissionStatusFor(completed, mission) === 'locked') return;
  const next = clamp(Math.max(completed, mission));
  if (next === completed) return;
  completed = next;
  persist();
  emit();
}

export function onEvaluationProgressChange(listener: (completed: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
