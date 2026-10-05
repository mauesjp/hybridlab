import type { BodyWeightEntry, SessionSummary } from '../../types/dashboard'
import type { HybridTrainingWeek, TodayHybridPlan } from '../../types/hybridWeek'
import type { RunningActivity } from '../../types/running'

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function sessionDate(value: string) {
  const utc = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`
  return localDateKey(new Date(utc))
}

// A completed record satisfies only one planned occurrence of that workout/date.
// A workout-day ID belongs to one plan version; unrelated workouts never match.
export function dailyWorkoutCompletion(today: TodayHybridPlan, strength: SessionSummary[], completeHistory = true) {
  const matches = new Map<number, number>()
  const used = new Set<number>()
  if (!today.hasActivePlan || today.isBeforePlan || today.isAfterPlan) return { matches, limited: false }
  const date = today.date.slice(0, 10)
  const ordered = [...strength].sort((a, b) => a.startedAt.localeCompare(b.startedAt) || a.id - b.id)
  for (const slot of [...today.sessions].sort((a, b) => a.sequence - b.sequence || a.id - b.id)) {
    if (slot.sessionType !== 0 || slot.strengthWorkoutDayId === null) continue
    const match = ordered.find(entry => !used.has(entry.id) && entry.status === 1 && entry.finishedAt !== null &&
      entry.strengthWorkoutDayId === slot.strengthWorkoutDayId && sessionDate(entry.startedAt) === date)
    if (match) { used.add(match.id); matches.set(slot.id, match.id) }
  }
  const oldest = ordered[0]
  const limited = !completeHistory && strength.length >= 20 && oldest !== undefined && sessionDate(oldest.startedAt) >= date
  return { matches, limited }
}

export function weightSummary(entries: BodyWeightEntry[], today = localDateKey()) {
  const ordered = entries.filter(entry => entry.recordedAt.slice(0, 10) <= today)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  const start = dateOnly(today)
  start.setDate(start.getDate() - 6)
  const recent = ordered.filter(entry => entry.recordedAt.slice(0, 10) >= localDateKey(start))
  const current = ordered[0]?.weightKg ?? null
  const initial = ordered.at(-1)?.weightKg ?? null
  return {
    current,
    average: recent.length ? recent.reduce((sum, entry) => sum + entry.weightKg, 0) / recent.length : null,
    variation: current !== null && initial !== null ? current - initial : null,
  }
}

// Match completed strength sessions by day and workout; each record counts once.
// Running activities have no workout link, so they count by their recorded date.
export function weeklyProgress(week: HybridTrainingWeek, strength: SessionSummary[], running: RunningActivity[]) {
  const oldest = strength.at(-1)
  const limited = strength.length >= 20 && oldest !== undefined && sessionDate(oldest.startedAt) > week.startDate.slice(0, 10)
  const usedStrength = new Set<number>()
  const usedRunning = new Set<number>()
  const start = dateOnly(week.startDate)
  const slots = [...week.sessions].sort((a, b) => {
    const offset = (day: number) => (day - start.getDay() + 7) % 7
    return offset(a.dayOfWeek) - offset(b.dayOfWeek) || a.sequence - b.sequence
  }).map(slot => {
    const date = new Date(start)
    date.setDate(start.getDate() + (slot.dayOfWeek - start.getDay() + 7) % 7)
    const key = localDateKey(date)
    if (slot.sessionType === 0) {
      const match = strength.find(entry => !usedStrength.has(entry.id) && entry.status === 1 && entry.strengthWorkoutDayId === slot.strengthWorkoutDayId && sessionDate(entry.startedAt) === key)
      if (match) usedStrength.add(match.id)
      return Boolean(match)
    }
    const match = running.find(entry => !usedRunning.has(entry.id) && entry.activityDate.slice(0, 10) === key)
    if (match) usedRunning.add(match.id)
    return Boolean(match)
  })
  const completed = slots.filter(Boolean).length
  return { slots, completed, total: slots.length, percent: slots.length ? Math.round(completed / slots.length * 100) : 0, limited }
}
