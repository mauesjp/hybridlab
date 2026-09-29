export type Role = 'Student'
export type WorkoutSessionStatus = 0 | 1 | 2

export interface PlanSummary {
  id: number
  studentId: number
  name: string
  isActive: boolean
  isPublished: boolean
  versionNumber: number
  previousVersionId?: number | null
  createdAt: string
  publishedAt: string | null
}
export interface ExerciseInput {
  name: string
  order: number
  targetSets: number
  minReps: number
  maxReps: number
  targetRir: number | null
  notes: string | null
}
export interface PlannedExercise extends ExerciseInput { id: number }
export interface DayInput { name: string; order: number }
export interface WorkoutDay extends DayInput { id: number; exercises: PlannedExercise[] }
export interface PlanDetails extends PlanSummary { days: WorkoutDay[] }
export interface SetInput { weight: number | null; reps: number; rir: number | null; rpe: number | null }
export interface WorkoutSet extends SetInput { id: number; setNumber: number; recordedAt: string }
export interface PreviousWorkoutSet {
  setNumber: number
  weight: number | null
  reps: number
  rir: number | null
  rpe: number | null
}
export interface PreviousExercisePerformance {
  workoutExerciseId: number
  exerciseName: string
  previousSessionStartedAt: string | null
  sets: PreviousWorkoutSet[]
}
export interface WorkoutExercise {
  id: number
  plannedExerciseId: number
  exerciseName: string
  order: number
  targetSets: number
  minReps: number
  maxReps: number
  targetRir: number | null
  notes: string | null
  sets: WorkoutSet[]
  isCompleted: boolean
  completedAt: string | null
}
export interface SessionSummary {
  id: number
  strengthPlanId: number
  strengthWorkoutDayId: number
  dayName: string
  startedAt: string
  finishedAt: string | null
  isCompleted: boolean
  status: WorkoutSessionStatus
}
export interface SessionDetails extends Omit<SessionSummary, 'dayName'> { exercises: WorkoutExercise[] }
export type ActiveSession = { hasActiveSession: false } | { hasActiveSession: true; sessionId: number; startedAt: string }
export interface DashboardData {
  profile: { id: number; displayName: string; role: Role }
  plans: PlanSummary[]
  recentSessions: SessionSummary[]
  completedSessions: number
  finishedSessions: number
  partialSessions: number
}

export interface BodyWeightEntry {
  id: number
  weightKg: number
  recordedAt: string
  createdAt: string
}

export interface BodyWeightInput {
  weightKg: number
  recordedAt: string
}

export interface BodyWeightGoal {
  goalWeightKg: number | null
}

export interface StrengthExercisePerformance {
  sessionId: number
  startedAt: string
  weight: number | null
  reps: number
}

export interface StrengthExerciseAnalytics {
  name: string
  maxWeight: number | null
  history: StrengthExercisePerformance[]
}

export interface StrengthAnalyticsData {
  workoutsLast30Days: number
  workoutsLast7Days: number
  setsLast30Days: number
  volumeLast30Days: number
  exercises: StrengthExerciseAnalytics[]
}
