export type Role = 'Student' | 'Coach'
export type Modality = 0 | 1
export type LinkStatus = 0 | 1 | 2 | 3

export interface CoachLink {
  id: number
  studentId: number
  studentName: string
  coachId: number
  coachName: string
  modality: Modality
  status: LinkStatus
  requestedAt: string
}
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
}
export interface SessionSummary {
  id: number
  strengthPlanId: number
  strengthWorkoutDayId: number
  dayName: string
  startedAt: string
  finishedAt: string | null
  isCompleted: boolean
}
export interface SessionDetails extends Omit<SessionSummary, 'dayName'> { exercises: WorkoutExercise[] }
export type ActiveSession = { hasActiveSession: false } | { hasActiveSession: true; sessionId: number; startedAt: string }
export interface PlanningAccess { modality: Modality; canManagePlanning: boolean }
export interface DashboardData {
  profile: { id: number; displayName: string; role: Role; coachCode: string | null; canCoachStrength: boolean; canCoachRunning: boolean }
  plans: PlanSummary[]
  links: CoachLink[]
  recentSessions: SessionSummary[]
  completedSessions: number
}
