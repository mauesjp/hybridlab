export type RunningWorkoutBlockType =
  | 0 // Warmup
  | 1 // Run
  | 2 // Interval
  | 3 // Recovery
  | 4 // Cooldown

export type RunningActivitySource =
  | 0 // Manual
  | 1 // Strava

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
  notes?: string | null
  blocks: RunningWorkoutBlockInput[]
}

export interface RunningActivity {
  id: number
  activityDate: string
  distanceKm: number
  durationSeconds: number
  averagePaceSecondsPerKm: number
  averageHeartRate: number | null
  rpe: number | null
  notes: string | null
  source: RunningActivitySource
  createdAt: string
}

export interface RunningActivityInput {
  activityDate: string
  distanceKm: number
  durationSeconds: number
  averageHeartRate?: number | null
  rpe?: number | null
  notes?: string | null
}