import type { SessionDetails, SessionSummary } from '../../types/dashboard'

export function sessionMetrics(session: SessionDetails | SessionSummary) {
 const timestamp = (value: string) => new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`).getTime()
 const elapsed = session.finishedAt ? timestamp(session.finishedAt) - timestamp(session.startedAt) : null
 const sets = 'exercises' in session ? session.exercises.flatMap(exercise => exercise.sets) : null
 const weighted = sets?.filter(set => set.weight !== null) ?? []
 return {
  duration: elapsed !== null && Number.isFinite(elapsed) && elapsed >= 0 ? Math.round(elapsed / 60000) : null,
  exercises: 'exercises' in session ? session.exercises.length : null,
  sets: sets?.length ?? null,
  volume: weighted.length ? weighted.reduce((total,set)=>total + set.weight! * set.reps,0) : null,
 }
}
