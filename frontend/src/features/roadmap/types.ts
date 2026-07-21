import type { AllTask } from '@/features/all-tasks';
import type { RoadmapBarPlacement, RoadmapDateSpan } from './lib/roadmap-utils';

export type RoadmapEpic = {
  epic: AllTask;
  children: AllTask[];
  span: RoadmapDateSpan | null;
  placement: RoadmapBarPlacement | null;
  progress: { done: number; total: number };
};
