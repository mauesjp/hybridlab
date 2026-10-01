import { api } from './api'

import type {
  HybridWeekPlan,
  HybridWeekPlanInput,
  TodayHybridPlan,
  HybridWeekOptions,
} from '../types/hybridWeek'

export const hybridWeekService = {
  getAll: () =>
    api<HybridWeekPlan[]>(
      '/HybridWeekPlans'
    ),

  getActive: () =>
    api<HybridWeekPlan>(
      '/HybridWeekPlans/active'
    ),

  getById: (id: number) =>
    api<HybridWeekPlan>(
      `/HybridWeekPlans/${id}`
    ),

  getToday: (date: string) =>
    api<TodayHybridPlan>(
      `/HybridWeekPlans/today?date=${encodeURIComponent(date)}`
    ),

  create: (
    input: HybridWeekPlanInput
  ) =>
    api<HybridWeekPlan>(
      '/HybridWeekPlans',
      'POST',
      input
    ),

  update: (
    id: number,
    input: HybridWeekPlanInput
  ) =>
    api<HybridWeekPlan>(
      `/HybridWeekPlans/${id}`,
      'PUT',
      input
    ),

  activate: (id: number) =>
    api<HybridWeekPlan>(
      `/HybridWeekPlans/${id}/activate`,
      'POST'
    ),

  remove: (id: number) =>
    api<void>(
      `/HybridWeekPlans/${id}`,
      'DELETE'
    ),

  getOptions: () =>
  api<HybridWeekOptions>(
    '/HybridWeekPlans/options'
  ),  
}