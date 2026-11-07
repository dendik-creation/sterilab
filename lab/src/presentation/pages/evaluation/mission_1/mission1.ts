import maskFoundUrl from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_01_misi_1/problem-found-not-wearing-mask.png';
import petriFoundUrl from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_01_misi_1/problem-found-petri-dish-left-open-for-a-long-time.png';
import spillFoundUrl from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_01_misi_1/problem-found-spill-on-the-table.png';
import testTubeFoundUrl from '../../../../../assets/images/02_scenes/04_04_evaluasi/04_04_01_misi_1/problem-found-the-test-tube-was-placed-carelessly..png';

export const IMAGE_SIZE = { width: 1186, height: 645 } as const;

export const PROBLEMS = [
  {
    id: 'mask',
    label: 'Analis tidak memakai masker',
    asset: maskFoundUrl,
    rect: { x: 449, y: 164, width: 260, height: 156 },
  },
  {
    id: 'petri-dish',
    label: 'Cawan Petri terbuka terlalu lama',
    asset: petriFoundUrl,
    rect: { x: 398, y: 428, width: 311, height: 110 },
  },
  {
    id: 'test-tube',
    label: 'Tabung reaksi diletakkan sembarangan',
    asset: testTubeFoundUrl,
    rect: { x: 617, y: 551, width: 242, height: 88 },
  },
  {
    id: 'spill',
    label: 'Tumpahan media dibiarkan di meja',
    asset: spillFoundUrl,
    rect: { x: 191, y: 551, width: 207, height: 88 },
  },
] as const;

export type Problem = (typeof PROBLEMS)[number];

export function findProblemAt(x: number, y: number): Problem | undefined {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return undefined;

  const imageX = x * IMAGE_SIZE.width;
  const imageY = y * IMAGE_SIZE.height;
  return PROBLEMS.find(({ rect }) =>
    imageX >= rect.x && imageX < rect.x + rect.width && imageY >= rect.y && imageY < rect.y + rect.height,
  );
}
