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

export interface HybridTrainingWeek {
  id: number
  weekNumber: number
  name: string | null
  notes: string | null
  startDate: string
  endDate: string
  sessions: HybridWeekSession[]
}

export interface HybridTrainingPlan {
  id: number
  name: string
  startDate: string
  endDate: string
  totalWeeks: number
  isActive: boolean
  createdAt: string
  weeks: HybridTrainingWeek[]
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

export interface HybridTrainingWeekInput {
  weekNumber: number
  name?: string | null
  notes?: string | null
  sessions: HybridWeekSessionInput[]
}

export interface HybridTrainingPlanInput {
  name: string
  startDate: string
  isActive: boolean
  weeks: HybridTrainingWeekInput[]
}

export interface TodayHybridPlan {
  date: string
  dayOfWeek: number

  hasActivePlan: boolean

  planId: number | null
  planName: string | null

  planStartDate: string | null
  planEndDate: string | null

  weekId: number | null
  weekNumber: number | null
  totalWeeks: number

  isBeforePlan: boolean
  isAfterPlan: boolean
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