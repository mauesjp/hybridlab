import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { dashboardService as service } from '../../services/dashboardService'
import { useAction, useRemote } from '../../hooks/useRemote'
import type { WorkoutExercise } from '../../types/dashboard'
import {
  Badge,
  ConfirmButton,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  Panel
} from './UI'
import {
  dateTime,
  numberValue,
  optionalNumber
} from './format'

function ExerciseLog({
  exercise,
  finished,
  onSaved
}: {
  exercise: WorkoutExercise
  finished: boolean
  onSaved: () => void
}) {
  const action = useAction()
  const [editingSetId, setEditingSetId] = useState<number | null>(null)

  function submitEdit(event: FormEvent<HTMLFormElement>, setId: number) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    const input = {
      weight: optionalNumber(form, 'weight'),
      reps: numberValue(form, 'reps'),
      rir: optionalNumber(form, 'rir'),
      rpe: optionalNumber(form, 'rpe')
    }

    void action.run(
      () => service.updateSet(setId, input),
      () => {
        setEditingSetId(null)
        onSaved()
      }
    )
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    const input = {
      weight: optionalNumber(form, 'weight'),
      reps: numberValue(form, 'reps'),
      rir: optionalNumber(form, 'rir'),
      rpe: optionalNumber(form, 'rpe')
    }

    void action.run(
      () => service.addSet(exercise.id, input),
      onSaved
    )
  }

  return (
    <Panel>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="dash-eyebrow">
            Exercício {exercise.order.toString().padStart(2, '0')}
          </p>

          <h2 className="text-xl font-semibold">
            {exercise.exerciseName}
          </h2>
        </div>

        <Badge>
          {exercise.sets.length} / {exercise.targetSets} séries
        </Badge>
      </div>

      <p className="mt-3 text-sm text-muted">
        Prescrição: {exercise.targetSets} × {exercise.minReps}–
        {exercise.maxReps} repetições
        {exercise.targetRir !== null
          ? ` · RIR ${exercise.targetRir}`
          : ''}
      </p>

      {exercise.notes && (
        <p className="mt-2 text-sm text-muted">
          {exercise.notes}
        </p>
      )}

      {exercise.sets.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Séries registradas de {exercise.exerciseName}
            </caption>

            <thead className="text-muted">
              <tr>
                {[
                  'Série',
                  'Carga',
                  'Reps',
                  'RIR',
                  'RPE'
                ].map(header => (
                  <th
                    key={header}
                    className="p-2 font-normal"
                  >
                    {header}
                  </th>
                ))}

                {!finished && (
                  <th className="p-2 font-normal">
                    Ações
                  </th>
                )}
              </tr>
            </thead>

<tbody>
  {exercise.sets.map(set => (
    editingSetId === set.id ? (
      <tr
        key={set.id}
        className="border-t border-border"
      >
        <td className="p-2">
          {set.setNumber}
        </td>

        <td
          colSpan={5}
          className="p-2"
        >
          <form
            onSubmit={event =>
              submitEdit(event, set.id)
            }
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field
                label="Carga (kg)"
                name="weight"
                type="number"
                min="0"
                max="10000"
                step="0.01"
                defaultValue={set.weight ?? ''}
                placeholder="Opcional"
              />

              <Field
                label="Repetições"
                name="reps"
                type="number"
                min="1"
                max="100"
                step="1"
                required
                defaultValue={set.reps}
              />

              <Field
                label="RIR"
                name="rir"
                type="number"
                min="0"
                max="10"
                step="1"
                defaultValue={set.rir ?? ''}
                placeholder="Opcional"
              />

              <Field
                label="RPE"
                name="rpe"
                type="number"
                min="0"
                max="10"
                step="0.1"
                defaultValue={set.rpe ?? ''}
                placeholder="Opcional"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="dash-primary"
                disabled={action.busy}
              >
                {action.busy
                  ? 'Salvando…'
                  : 'Salvar alteração'}
              </button>

              <button
                type="button"
                className="dash-secondary"
                disabled={action.busy}
                onClick={() =>
                  setEditingSetId(null)
                }
              >
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    ) : (
      <tr
        key={set.id}
        className="border-t border-border"
      >
        <td className="p-2">
          {set.setNumber}
        </td>

        <td className="p-2 whitespace-nowrap">
          {set.weight === null
            ? '—'
            : `${set.weight} kg`}
        </td>

        <td className="p-2">
          {set.reps}
        </td>

        <td className="p-2">
          {set.rir ?? '—'}
        </td>

        <td className="p-2">
          {set.rpe ?? '—'}
        </td>

        {!finished && (
          <td className="p-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="dash-secondary"
                onClick={() =>
                  setEditingSetId(set.id)
                }
              >
                Editar
              </button>

              <ConfirmButton
                label="Remover"
                message={`Remover a série ${set.setNumber}?`}
                disabled={action.busy}
                onConfirm={() =>
                  void action.run(
                    () =>
                      service.deleteSet(set.id),
                    onSaved
                  )
                }
              />
            </div>
          </td>
        )}
      </tr>
    )
  ))}
</tbody>
          </table>
        </div>
      )}

      {!finished && (
        <form
          onSubmit={submit}
          className="mt-5"
        >
          <fieldset
            disabled={action.busy}
            className="space-y-4"
          >
            <legend className="mb-4 text-sm font-medium">
              Registrar série {exercise.sets.length + 1}
            </legend>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field
                label="Carga (kg)"
                name="weight"
                type="number"
                min="0"
                max="10000"
                step="0.01"
                placeholder="Opcional"
                defaultValue={
                  exercise.sets.at(-1)?.weight ?? ''
                }
              />

              <Field
                label="Repetições"
                name="reps"
                type="number"
                min="1"
                max="100"
                step="1"
                required
                defaultValue={
                  exercise.sets.at(-1)?.reps ?? ''
                }
              />

              <Field
                label="RIR"
                name="rir"
                type="number"
                min="0"
                max="10"
                step="1"
                placeholder="Opcional"
                defaultValue={
                  exercise.sets.at(-1)?.rir ?? ''
                }
              />

              <Field
                label="RPE"
                name="rpe"
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="Opcional"
                defaultValue={
                  exercise.sets.at(-1)?.rpe ?? ''
                }
              />
            </div>

            <p className="text-xs leading-5 text-muted">
              RIR: repetições restantes. RPE: esforço percebido
              de 0 a 10.
            </p>

            <ErrorNotice message={action.error} />

            <button className="dash-primary">
              {action.busy
                ? 'Salvando…'
                : '+ Registrar série'}
            </button>
          </fieldset>
        </form>
      )}
    </Panel>
  )
}

export default function SessionView({
  id,
  onChanged
}: {
  id: number
  onChanged: () => void
}) {
  const load = useCallback(
    () => service.session(id),
    [id]
  )

  const remote = useRemote(load)
  const action = useAction()

  if (remote.loading) {
    return <Loading />
  }

  if (remote.error || !remote.data) {
    return (
      <ErrorNotice
        message={remote.error}
        retry={remote.reload}
      />
    )
  }

  const session = remote.data
  const finished = session.finishedAt !== null

  const saved = () => {
    remote.reload()
    onChanged()
  }

  const totalSets = session.exercises.reduce(
    (total, exercise) =>
      total + exercise.sets.length,
    0
  )

  return (
    <div className="space-y-6">
      <a
        href="#/dashboard"
        className="auth-link text-sm"
      >
        ← Voltar ao início
      </a>

      <Panel>
        <Badge>
          {finished
            ? 'Treino finalizado'
            : 'Em andamento'}
        </Badge>

        <h1 className="dash-title mt-4">
          {finished
            ? 'Treino registrado.'
            : 'Uma série de cada vez.'}
        </h1>

        <p className="mt-3 text-sm text-muted">
          Início: {dateTime(session.startedAt)}
          {session.finishedAt
            ? ` · Fim: ${dateTime(session.finishedAt)}`
            : ''}
        </p>

        <p className="mt-3 text-sm">
          {totalSets} séries registradas ·{' '}
          {session.exercises.length} exercícios
        </p>

        <a
          href={`#/plano/${session.strengthPlanId}`}
          className="auth-link mt-4 inline-block text-sm"
        >
          Consultar a versão do plano
        </a>

        <ErrorNotice message={action.error} />
      </Panel>

      {!session.exercises.length && (
        <Empty>
          Esta sessão não possui exercícios.
        </Empty>
      )}

      {session.exercises.map(exercise => (
        <ExerciseLog
          key={exercise.id}
          exercise={exercise}
          finished={finished}
          onSaved={saved}
        />
      ))}

      {!finished && (
        <Panel title="Concluir sessão">
          <p className="mb-4 text-sm leading-6 text-muted">
            Confira suas séries antes de finalizar. Após a
            conclusão, esta sessão ficará disponível apenas para
            consulta.
          </p>

          <ConfirmButton
            label="Finalizar treino"
            message="Finalizar agora? Não será possível adicionar novas séries a esta sessão."
            disabled={action.busy}
            onConfirm={() =>
              void action.run(
                () => service.finish(id),
                saved
              )
            }
          />
        </Panel>
      )}
    </div>
  )
}