export type HybridSessionType =
  | 0 // Strength
  | 1 // Running

export type TrainingPeriod =
  | 0 // Unspecified
  | 1 // Morning
  | 2 // Afternoon
  | 3 // Evening

export interface HybridWeekSession {
  id: number
  dayOfWeek: number
  sessionType: HybridSessionType
  period: TrainingPeriod
  sequence: number
  strengthWorkoutDayId: number | null
  runningWorkoutId: number | null
  sessionName: string | null
  notes: string | null
}

export interface HybridWeekPlan {
  id: number
  name: string
  isActive: boolean
  createdAt: string
  sessions: HybridWeekSession[]
}

export interface HybridWeekSessionInput {
  dayOfWeek: number
  sessionType: HybridSessionType
  period: TrainingPeriod
  sequence: number
  strengthWorkoutDayId?: number | null
  runningWorkoutId?: number | null
  notes?: string | null
}

export interface HybridWeekPlanInput {
  name: string
  isActive: boolean
  sessions: HybridWeekSessionInput[]
}

export interface TodayHybridPlan {
  date: string
  dayOfWeek: number
  hasActivePlan: boolean
  planId: number | null
  planName: string | null
  isRestDay: boolean
  sessions: HybridWeekSession[]
}

export interface HybridWeekWorkoutOption {
  id: number
  name: string
}

export interface HybridWeekOptions {
  strengthWorkouts: HybridWeekWorkoutOption[]
  runningWorkouts: HybridWeekWorkoutOption[]
}