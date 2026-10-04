import type { PlanDetails, SessionSummary } from '../../types/dashboard'
import type { HybridTrainingPlan } from '../../types/hybridWeek'
import { localDateKey, weeklyProgress } from './overviewMetrics'

const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

export function planDetails(plan: PlanDetails, calendar: HybridTrainingPlan | null, history: SessionSummary[], today = localDateKey()) {
  const days = [...plan.days].sort((a, b) => a.order - b.order)
  const ids = new Set(days.map(day => day.id))
  const weeks = calendar?.weeks.map(week => ({ ...week, sessions: week.sessions.filter(slot => slot.sessionType === 0 && slot.strengthWorkoutDayId !== null && ids.has(slot.strengthWorkoutDayId)) })).filter(week => week.sessions.length) ?? []
  const week = weeks.find(week => week.startDate.slice(0, 10) <= today && week.endDate.slice(0, 10) >= today)
  const progress = week ? weeklyProgress(week, history, []) : null
  const occurrences = weeks.flatMap(week => week.sessions.map(slot => {
    const date = new Date(`${week.startDate.slice(0, 10)}T12:00:00`)
    date.setDate(date.getDate() + (slot.dayOfWeek - date.getDay() + 7) % 7)
    return { dayId: slot.strengthWorkoutDayId, weekday: slot.dayOfWeek, date: localDateKey(date) }
  })).sort((a, b) => a.date.localeCompare(b.date))
  const nextDate = occurrences.find(slot => slot.date > today)?.date
  return {
    week,
    progress,
    days: days.map(day => {
      const slots = occurrences.filter(slot => slot.dayId === day.id)
      const labels = [...new Set(slots.map(slot => slot.weekday))].sort((a, b) => (a + 6) % 7 - (b + 6) % 7).map(day => weekdays[day])
      const dayWeek = week ? { ...week, sessions: week.sessions.filter(slot => slot.strengthWorkoutDayId === day.id) } : null
      const dayProgress = dayWeek?.sessions.length ? weeklyProgress(dayWeek, history, []) : null
      const completed = dayProgress && !dayProgress.limited && dayProgress.completed === dayProgress.total
      const status = completed ? 'Concluído na semana' : slots.some(slot => slot.date === today) ? 'Hoje' : slots.some(slot => slot.date === nextDate) ? 'Próximo' : null
      const lastSession = history.filter(session => session.strengthPlanId === plan.id && session.strengthWorkoutDayId === day.id && session.status !== 0).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
      return { day, label: labels.join(' / ') || `Dia ${day.order}`, status, lastSession }
    }),
  }
}
