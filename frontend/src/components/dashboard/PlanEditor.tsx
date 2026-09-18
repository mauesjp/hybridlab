import { useState } from 'react'
import type { FormEvent } from 'react'
import { dashboardService as service } from '../../services/dashboardService'
import { useAction } from '../../hooks/useRemote'
import type { PlannedExercise, WorkoutDay } from '../../types/dashboard'
import { ConfirmButton, ErrorNotice, Field } from './UI'
import { numberValue, optionalNumber } from './format'

export function DayForm({ planId, day, nextOrder, onSaved, onCancel }: { planId: number; day?: WorkoutDay; nextOrder: number; onSaved: () => void; onCancel: () => void }) {
  const action = useAction()
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { name: String(form.get('name')).trim(), order: numberValue(form, 'order') }
    if (!input.name) return
    void action.run(() => day ? service.updateDay(day.id, input) : service.addDay(planId, input), onSaved)
  }
  return <form onSubmit={submit} className="my-4 rounded-xl border border-border p-4"><fieldset disabled={action.busy} className="space-y-4"><legend className="mb-4 font-medium">{day ? 'Editar dia' : 'Adicionar dia'}</legend><Field label="Nome do dia" name="name" required maxLength={100} defaultValue={day?.name} placeholder="Ex.: A · Superiores" /><Field label="Ordem no plano" name="order" type="number" min="1" step="1" required defaultValue={day?.order ?? nextOrder} /><ErrorNotice message={action.error} /><div className="flex gap-2"><button className="dash-primary">{action.busy ? 'Salvando…' : 'Salvar dia'}</button><button type="button" className="dash-secondary" onClick={onCancel}>Cancelar</button></div></fieldset></form>
}

export function ExerciseForm({ dayId, exercise, nextOrder, onSaved, onCancel }: { dayId: number; exercise?: PlannedExercise; nextOrder: number; onSaved: () => void; onCancel: () => void }) {
  const action = useAction()
  const [validation, setValidation] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { name: String(form.get('name')).trim(), order: numberValue(form, 'order'), targetSets: numberValue(form, 'sets'), minReps: numberValue(form, 'min'), maxReps: numberValue(form, 'max'), targetRir: optionalNumber(form, 'rir'), notes: String(form.get('notes')).trim() || null }
    if (!input.name) { setValidation('Informe o nome do exercício.'); return }
    if (input.minReps > input.maxReps) { setValidation('O mínimo de repetições não pode superar o máximo.'); return }
    setValidation('')
    void action.run(() => exercise ? service.updateExercise(exercise.id, input) : service.addExercise(dayId, input), onSaved)
  }
  return <form onSubmit={submit} className="my-4 rounded-xl border border-border p-4"><fieldset disabled={action.busy} className="space-y-4"><legend className="mb-4 font-medium">{exercise ? 'Editar exercício' : 'Adicionar exercício'}</legend>
    <Field label="Nome do exercício" name="name" required maxLength={100} defaultValue={exercise?.name} placeholder="Use o nome que você conhece" />
    <div className="grid grid-cols-2 gap-4"><Field label="Ordem" name="order" type="number" min="1" step="1" required defaultValue={exercise?.order ?? nextOrder} /><Field label="Séries" name="sets" type="number" min="1" max="20" step="1" required defaultValue={exercise?.targetSets ?? 3} /><Field label="Repetições mínimas" name="min" type="number" min="1" max="100" step="1" required defaultValue={exercise?.minReps ?? 6} /><Field label="Repetições máximas" name="max" type="number" min="1" max="100" step="1" required defaultValue={exercise?.maxReps ?? 10} /></div>
    <Field label="RIR alvo (opcional)" name="rir" type="number" min="0" max="10" step="1" defaultValue={exercise?.targetRir ?? ''} /><p className="text-xs text-muted">RIR: quantas repetições ainda poderiam ser feitas ao terminar a série.</p>
    <Field label="Observações (opcional)" name="notes" maxLength={500} defaultValue={exercise?.notes ?? ''} />
    <ErrorNotice message={validation || action.error} /><div className="flex gap-2"><button className="dash-primary">{action.busy ? 'Salvando…' : 'Salvar exercício'}</button><button type="button" className="dash-secondary" onClick={onCancel}>Cancelar</button></div>
  </fieldset></form>
}

export function DayCard({ day, planId, editable, canStart, onSaved, onStart, starting }: { day: WorkoutDay; planId: number; editable: boolean; canStart: boolean; onSaved: () => void; onStart: () => void; starting: boolean }) {
  const [editDay, setEditDay] = useState(false)
  const [editExercise, setEditExercise] = useState<number | 'new' | null>(null)
  const action = useAction()
  const nextOrder = Math.max(0, ...day.exercises.map(e => e.order)) + 1
  return <section className="dash-panel">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="dash-eyebrow">Dia {day.order.toString().padStart(2, '0')}</p><h3 className="text-xl font-semibold">{day.name}</h3></div>{canStart && <button className="dash-primary" disabled={starting || !day.exercises.length} onClick={onStart}>{starting ? 'Iniciando…' : 'Iniciar treino →'}</button>}</div>
    {editable && <div className="mt-4 flex flex-wrap gap-2"><button className="dash-secondary" onClick={() => setEditDay(!editDay)}>Editar dia</button><ConfirmButton label="Remover dia" message={`Remover “${day.name}” e todos os seus exercícios deste rascunho?`} disabled={action.busy} onConfirm={() => void action.run(() => service.deleteDay(day.id), onSaved)} /></div>}
    {editDay && editable && <DayForm day={day} planId={planId} nextOrder={day.order} onCancel={() => setEditDay(false)} onSaved={() => { setEditDay(false); onSaved() }} />}
    <ErrorNotice message={action.error} />
    <div className="mt-5 divide-y divide-border">{[...day.exercises].sort((a, b) => a.order - b.order).map(exercise => <div key={exercise.id} className="py-4"><div className="flex items-start gap-3"><span className="pt-1 text-xs text-muted">{exercise.order.toString().padStart(2, '0')}</span><div className="min-w-0 flex-1"><h4 className="font-medium break-words">{exercise.name}</h4><p className="mt-1 text-sm text-muted">{exercise.targetSets} séries · {exercise.minReps}–{exercise.maxReps} reps{exercise.targetRir !== null ? ` · RIR ${exercise.targetRir}` : ''}</p>{exercise.notes && <p className="mt-2 text-sm text-muted">{exercise.notes}</p>}</div></div>
      {editable && <div className="mt-3 flex flex-wrap gap-2"><button className="dash-secondary" onClick={() => setEditExercise(exercise.id)}>Editar exercício</button><ConfirmButton label="Remover exercício" message={`Remover “${exercise.name}” deste rascunho?`} disabled={action.busy} onConfirm={() => void action.run(() => service.deleteExercise(exercise.id), onSaved)} /></div>}
      {editable && editExercise === exercise.id && <ExerciseForm dayId={day.id} exercise={exercise} nextOrder={nextOrder} onCancel={() => setEditExercise(null)} onSaved={() => { setEditExercise(null); onSaved() }} />}
    </div>)}</div>
    {!day.exercises.length && <p className="my-5 text-sm text-muted">Nenhum exercício neste dia.</p>}
    {editable && (editExercise === 'new' ? <ExerciseForm dayId={day.id} nextOrder={nextOrder} onCancel={() => setEditExercise(null)} onSaved={() => { setEditExercise(null); onSaved() }} /> : <button className="dash-secondary mt-4" onClick={() => setEditExercise('new')}>+ Adicionar exercício</button>)}
  </section>
}

