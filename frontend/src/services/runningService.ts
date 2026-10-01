import { api } from './api'

import type {
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
    )
}