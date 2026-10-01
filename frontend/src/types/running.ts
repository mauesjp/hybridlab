export type RunningWorkoutBlockType =
  | 0 // Warmup
  | 1 // Run
  | 2 // Interval
  | 3 // Recovery
  | 4 // Cooldown

export interface RunningWorkoutBlock {
  id: number
  type: RunningWorkoutBlockType
  sequence: number
  distanceKm: number | null
  durationSeconds: number | null
  targetPaceSecondsPerKm: number | null
  repetitions: number
  notes: string | null
}

export interface RunningWorkout {
  id: number
  name: string
  scheduledDate: string
  notes: string | null
  createdAt: string
  blocks: RunningWorkoutBlock[]
}

export interface RunningWorkoutBlockInput {
  type: RunningWorkoutBlockType
  distanceKm?: number | null
  durationSeconds?: number | null
  targetPaceSecondsPerKm?: number | null
  repetitions: number
  notes?: string | null
}

export interface RunningWorkoutInput {
  name: string
  scheduledDate: string
  notes?: string | null
  blocks: RunningWorkoutBlockInput[]
}