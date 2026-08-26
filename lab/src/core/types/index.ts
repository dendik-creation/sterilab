export type StageId =
  | 'apd'
  | 'area-aseptik'
  | 'media-kultur'
  | 'teknik-aseptik'
  | 'pengelolaan-limbah';

export type StageStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface ExperimentState {
  experimentId: StageId;
  currentStep: number;
  completed: boolean;
  score: number;
}
