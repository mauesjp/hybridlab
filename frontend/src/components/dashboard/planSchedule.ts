import type { PlanDetails } from '../../types/dashboard'
import type { HybridTrainingPlan } from '../../types/hybridWeek'

// Strength plans have no duration/frequency fields. Only use explicitly linked calendar days.
export function planSchedule(plan: PlanDetails, calendar: HybridTrainingPlan | null) {
  const dayIds = new Set(plan.days.map(day => day.id))
  const weeks = calendar?.weeks.map(week => ({
    ...week,
    days: new Set(week.sessions.filter(session => session.sessionType === 0 && session.strengthWorkoutDayId !== null && dayIds.has(session.strengthWorkoutDayId)).map(session => session.dayOfWeek)).size,
  })).filter(week => week.days > 0) ?? []
  if (!weeks.length) return null
  const min = Math.min(...weeks.map(week => week.days))
  const max = Math.max(...weeks.map(week => week.days))
  return {
    duration: `${weeks.length} ${weeks.length === 1 ? 'semana programada' : 'semanas programadas'}`,
    frequency: `${min === max ? min : `${min}–${max}`} ${max === 1 ? 'dia/semana' : 'dias/semana'}`,
    calendarName: calendar!.name,
  }
}
