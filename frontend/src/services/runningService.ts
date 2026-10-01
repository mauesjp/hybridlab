import { api } from './api'

import type {
  RunningActivity,
  RunningActivityInput,
  RunningWorkout,
  RunningWorkoutInput
} from '../types/running'

export const runningService = {
  getAll: () =>
    api<RunningWorkout[]>(
      '/RunningWorkouts'
    ),

  getById: (id: number) =>
    api<RunningWorkout>(
      `/RunningWorkouts/${id}`
    ),

  create: (
    input: RunningWorkoutInput
  ) =>
    api<RunningWorkout>(
      '/RunningWorkouts',
      'POST',
      input
    ),

  update: (
    id: number,
    input: RunningWorkoutInput
  ) =>
    api<RunningWorkout>(
      `/RunningWorkouts/${id}`,
      'PUT',
      input
    ),

  remove: (id: number) =>
    api<void>(
      `/RunningWorkouts/${id}`,
      'DELETE'
    ),

  getActivities: () =>
    api<RunningActivity[]>(
      '/RunningActivities'
    ),

  getActivityById: (
    id: number
  ) =>
    api<RunningActivity>(
      `/RunningActivities/${id}`
    ),

  createActivity: (
    input: RunningActivityInput
  ) =>
    api<RunningActivity>(
      '/RunningActivities',
      'POST',
      input
    ),

  updateActivity: (
    id: number,
    input: RunningActivityInput
  ) =>
    api<RunningActivity>(
      `/RunningActivities/${id}`,
      'PUT',
      input
    ),

  removeActivity: (
    id: number
  ) =>
    api<void>(
      `/RunningActivities/${id}`,
      'DELETE'
    )
}