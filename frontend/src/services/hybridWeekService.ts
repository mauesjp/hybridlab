import { api } from './api'

import type {
  HybridTrainingPlan,
  HybridTrainingPlanInput,
  HybridWeekOptions,
  TodayHybridPlan
} from '../types/hybridWeek'

export const hybridWeekService = {
  getAll: () =>
    api<HybridTrainingPlan[]>(
      '/HybridTrainingPlans'
    ),

  getActive: () =>
    api<HybridTrainingPlan>(
      '/HybridTrainingPlans/active'
    ),

  getById: (id: number) =>
    api<HybridTrainingPlan>(
      `/HybridTrainingPlans/${id}`
    ),

  getOptions: () =>
    api<HybridWeekOptions>(
      '/HybridTrainingPlans/options'
    ),

  getToday: (date: string) =>
    api<TodayHybridPlan>(
      `/HybridTrainingPlans/today?date=${encodeURIComponent(date)}`
    ),

  create: (
    input: HybridTrainingPlanInput
  ) =>
    api<HybridTrainingPlan>(
      '/HybridTrainingPlans',
      'POST',
      input
    ),

  update: (
    id: number,
    input: HybridTrainingPlanInput
  ) =>
    api<HybridTrainingPlan>(
      `/HybridTrainingPlans/${id}`,
      'PUT',
      input
    ),

  activate: (id: number) =>
    api<HybridTrainingPlan>(
      `/HybridTrainingPlans/${id}/activate`,
      'POST'
    ),

  remove: (id: number) =>
    api<void>(
      `/HybridTrainingPlans/${id}`,
      'DELETE'
    )
}