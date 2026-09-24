import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import type { FormEvent } from 'react'

import { dashboardService as service } from '../../services/dashboardService'
import { useAction, useRemote } from '../../hooks/useRemote'

import type {
  PreviousExercisePerformance,
  WorkoutExercise
} from '../../types/dashboard'

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

function uniqueNumbers(values: number[]) {
  return [...new Set(values)]
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(max, Math.max(min, value))
}

function formatNumber(value: number) {
  return Number(value.toFixed(2)).toString()
}

function QuickButtons({
  values,
  unit,
  onSelect
}: {
  values: number[]
  unit?: string
  onSelect: (value: number) => void
}) {
  if (!values.length) {
    return null
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {values.map(value => (
        <button
          key={value}
          type="button"
          className="dash-secondary"
          onClick={() => onSelect(value)}
        >
          {formatNumber(value)}
          {unit ? ` ${unit}` : ''}
        </button>
      ))}
    </div>
  )
}

function ExerciseLog({
  exercise,
  previous,
  finished,
  onSaved,
  onFinished
}: {
  exercise: WorkoutExercise
  previous?: PreviousExercisePerformance
  finished: boolean
  onSaved: () => void
  onFinished: (exerciseId: number) => void
}) {
  const action = useAction()

  const [editingSetId, setEditingSetId] =
    useState<number | null>(null)

  const formRef =
    useRef<HTMLFormElement>(null)

  const nextSetNumber =
    exercise.sets.length + 1

  const previousSet =
    previous?.sets.find(
      set => set.setNumber === nextSetNumber
    )

  function fillField(
    fieldName: string,
    value: number
  ) {
    const field =
      formRef.current?.elements.namedItem(
        fieldName
      )

    if (field instanceof HTMLInputElement) {
      field.value = formatNumber(value)
      field.focus()
    }
  }

  function submitEdit(
    event: FormEvent<HTMLFormElement>,
    setId: number
  ) {
    event.preventDefault()

    const form =
      new FormData(event.currentTarget)

    const input = {
      weight: optionalNumber(
        form,
        'weight'
      ),
      reps: numberValue(
        form,
        'reps'
      ),
      rir: optionalNumber(
        form,
        'rir'
      ),
      rpe: optionalNumber(
        form,
        'rpe'
      )
    }

    void action.run(
      () =>
        service.updateSet(
          setId,
          input
        ),
      () => {
        setEditingSetId(null)
        onSaved()
      }
    )
  }

  function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const form =
      new FormData(event.currentTarget)

    const input = {
      weight: optionalNumber(
        form,
        'weight'
      ),
      reps: numberValue(
        form,
        'reps'
      ),
      rir: optionalNumber(
        form,
        'rir'
      ),
      rpe: optionalNumber(
        form,
        'rpe'
      )
    }

    void action.run(
      () =>
        service.addSet(
          exercise.id,
          input
        ),
      onSaved
    )
  }

  const weightOptions =
    previousSet?.weight == null
      ? []
      : uniqueNumbers([
          previousSet.weight,
          previousSet.weight + 3,
          previousSet.weight + 5
        ])

  const repsOptions =
    previousSet == null
      ? []
      : uniqueNumbers([
          previousSet.reps,
          clamp(
            previousSet.reps - 1,
            1,
            100
          ),
          clamp(
            previousSet.reps + 1,
            1,
            100
          )
        ])

  const rirOptions =
    previousSet?.rir == null
      ? []
      : uniqueNumbers([
          previousSet.rir,
          clamp(
            previousSet.rir - 1,
            0,
            10
          ),
          clamp(
            previousSet.rir + 1,
            0,
            10
          )
        ])

  const rpeOptions =
    previousSet?.rpe == null
      ? []
      : uniqueNumbers([
          previousSet.rpe,
          clamp(
            previousSet.rpe - 0.5,
            0,
            10
          ),
          clamp(
            previousSet.rpe + 0.5,
            0,
            10
          )
        ])

  return (
    <Panel>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="dash-eyebrow">
            Exercício{' '}
            {exercise.order
              .toString()
              .padStart(2, '0')}
          </p>

          <h2 className="text-xl font-semibold">
            {exercise.exerciseName}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>
            {exercise.sets.length} /{' '}
            {exercise.targetSets} séries
          </Badge>

          {exercise.isCompleted && (
            <Badge>
              Concluído
            </Badge>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">
        Prescrição:{' '}
        {exercise.targetSets} ×{' '}
        {exercise.minReps}–
        {exercise.maxReps}{' '}
        repetições

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
              Séries registradas de{' '}
              {exercise.exerciseName}
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

                {!finished &&
                  !exercise.isCompleted && (
                    <th className="p-2 font-normal">
                      Ações
                    </th>
                  )}
              </tr>
            </thead>

            <tbody>
              {exercise.sets.map(set =>
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
                          submitEdit(
                            event,
                            set.id
                          )
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
                            defaultValue={
                              set.weight ?? ''
                            }
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
                            defaultValue={
                              set.reps
                            }
                          />

                          <Field
                            label="RIR"
                            name="rir"
                            type="number"
                            min="0"
                            max="10"
                            step="1"
                            defaultValue={
                              set.rir ?? ''
                            }
                            placeholder="Opcional"
                          />

                          <Field
                            label="RPE"
                            name="rpe"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            defaultValue={
                              set.rpe ?? ''
                            }
                            placeholder="Opcional"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            className="dash-primary"
                            disabled={
                              action.busy
                            }
                          >
                            {action.busy
                              ? 'Salvando…'
                              : 'Salvar alteração'}
                          </button>

                          <button
                            type="button"
                            className="dash-secondary"
                            disabled={
                              action.busy
                            }
                            onClick={() =>
                              setEditingSetId(
                                null
                              )
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

                    {!finished &&
                      !exercise.isCompleted && (
                        <td className="p-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="dash-secondary"
                              onClick={() =>
                                setEditingSetId(
                                  set.id
                                )
                              }
                            >
                              Editar
                            </button>

                            <ConfirmButton
                              label="Remover"
                              message={`Remover a série ${set.setNumber}?`}
                              disabled={
                                action.busy
                              }
                              onConfirm={() =>
                                void action.run(
                                  () =>
                                    service.deleteSet(
                                      set.id
                                    ),
                                  onSaved
                                )
                              }
                            />
                          </div>
                        </td>
                      )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {!finished &&
        !exercise.isCompleted && (
          <form
            ref={formRef}
            onSubmit={submit}
            className="mt-5"
          >
            <fieldset
              disabled={action.busy}
              className="space-y-4"
            >
              <legend className="mb-4 text-sm font-medium">
                Registrar série{' '}
                {nextSetNumber}
              </legend>

              {previous?.previousSessionStartedAt && (
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-muted">
                    Referência da série{' '}
                    {nextSetNumber} no último
                    treino ·{' '}
                    {dateTime(
                      previous.previousSessionStartedAt
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <Field
                    label="Carga (kg)"
                    name="weight"
                    type="number"
                    min="0"
                    max="10000"
                    step="0.01"
                    placeholder="Opcional"
                    defaultValue={
                      exercise.sets.at(-1)
                        ?.weight ?? ''
                    }
                  />

                  {previousSet && (
                    <p className="mt-2 text-xs text-muted">
                      Último treino:{' '}
                      {previousSet.weight ===
                      null
                        ? 'sem carga'
                        : `${previousSet.weight} kg`}
                    </p>
                  )}

                  <QuickButtons
                    values={
                      weightOptions
                    }
                    unit="kg"
                    onSelect={value =>
                      fillField(
                        'weight',
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <Field
                    label="Repetições"
                    name="reps"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    required
                    defaultValue={
                      exercise.sets.at(-1)
                        ?.reps ?? ''
                    }
                  />

                  {previousSet && (
                    <p className="mt-2 text-xs text-muted">
                      Último treino:{' '}
                      {previousSet.reps}{' '}
                      reps
                    </p>
                  )}

                  <QuickButtons
                    values={repsOptions}
                    onSelect={value =>
                      fillField(
                        'reps',
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <Field
                    label="RIR"
                    name="rir"
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    placeholder="Opcional"
                    defaultValue={
                      exercise.sets.at(-1)
                        ?.rir ?? ''
                    }
                  />

                  {previousSet && (
                    <p className="mt-2 text-xs text-muted">
                      Último treino:{' '}
                      {previousSet.rir ??
                        '—'}
                    </p>
                  )}

                  <QuickButtons
                    values={rirOptions}
                    onSelect={value =>
                      fillField(
                        'rir',
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <Field
                    label="RPE"
                    name="rpe"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    placeholder="Opcional"
                    defaultValue={
                      exercise.sets.at(-1)
                        ?.rpe ?? ''
                    }
                  />

                  {previousSet && (
                    <p className="mt-2 text-xs text-muted">
                      Último treino:{' '}
                      {previousSet.rpe ??
                        '—'}
                    </p>
                  )}

                  <QuickButtons
                    values={rpeOptions}
                    onSelect={value =>
                      fillField(
                        'rpe',
                        value
                      )
                    }
                  />
                </div>
              </div>

              <p className="text-xs leading-5 text-muted">
                RIR: repetições restantes.
                RPE: esforço percebido de
                0 a 10.
              </p>

              <ErrorNotice
                message={action.error}
              />

              <button className="dash-primary">
                {action.busy
                  ? 'Salvando…'
                  : '+ Registrar série'}
              </button>
            </fieldset>
          </form>
        )}

      {!finished &&
        !exercise.isCompleted && (
          <div className="mt-6 border-t border-border pt-5">
            <ConfirmButton
              label="Finalizar exercício"
              message={`Finalizar “${exercise.exerciseName}” e seguir para o próximo exercício?`}
              disabled={
                action.busy ||
                exercise.sets.length === 0
              }
              onConfirm={() =>
                void action.run(
                  () =>
                    service.finishExercise(
                      exercise.id
                    ),
                  () =>
                    onFinished(
                      exercise.id
                    )
                )
              }
            />

            {exercise.sets.length ===
              0 && (
              <p className="mt-2 text-xs text-muted">
                Registre pelo menos uma
                série antes de finalizar o
                exercício.
              </p>
            )}
          </div>
        )}

      {exercise.isCompleted && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm font-medium">
            ✓ Exercício concluído
          </p>

          {exercise.completedAt && (
            <p className="mt-1 text-xs text-muted">
              Finalizado em{' '}
              {dateTime(
                exercise.completedAt
              )}
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

type ScrollTarget = {
  completedExerciseId: number
  nextExerciseId: number | null
}

export default function SessionView({
  id,
  onChanged
}: {
  id: number
  onChanged: () => void
}) {
  const load = useCallback(
    async () => {
      const [
        session,
        previousPerformance
      ] = await Promise.all([
        service.session(id),
        service.previousPerformance(
          id
        )
      ])

      return {
        session,
        previousPerformance
      }
    },
    [id]
  )

  const remote = useRemote(load)
  const action = useAction()

  const scrollTargetRef =
    useRef<ScrollTarget | null>(null)

  useEffect(() => {
    const scrollTarget =
      scrollTargetRef.current

    if (
      !scrollTarget ||
      !remote.data
    ) {
      return
    }

    const completedExercise =
      remote.data.session.exercises.find(
        exercise =>
          exercise.id ===
          scrollTarget.completedExerciseId
      )

    /*
     * Só fazemos o scroll depois que o reload
     * trouxer o exercício como concluído.
     */
    if (
      !completedExercise?.isCompleted
    ) {
      return
    }

    const elementId =
      scrollTarget.nextExerciseId !== null
        ? `exercise-${scrollTarget.nextExerciseId}`
        : 'finish-session'

    requestAnimationFrame(() => {
      const element =
        document.getElementById(
          elementId
        )

      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })

      scrollTargetRef.current = null
    })
  }, [remote.data])

  if (remote.loading) {
    return <Loading />
  }

  if (
    remote.error ||
    !remote.data
  ) {
    return (
      <ErrorNotice
        message={remote.error}
        retry={remote.reload}
      />
    )
  }

  const {
    session,
    previousPerformance
  } = remote.data

  const finished =
    session.finishedAt !== null

  const saved = () => {
    remote.reload()
    onChanged()
  }

  const totalSets =
    session.exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets.length,
      0
    )

  const orderedExercises = [
    ...session.exercises
  ].sort((a, b) => {
    if (
      a.isCompleted !==
      b.isCompleted
    ) {
      return a.isCompleted
        ? 1
        : -1
    }

    return a.order - b.order
  })

  function exerciseFinished(
    completedExerciseId: number
  ) {
    const nextExercise = [
      ...session.exercises
    ]
      .filter(
        exercise =>
          !exercise.isCompleted &&
          exercise.id !==
            completedExerciseId
      )
      .sort(
        (a, b) =>
          a.order - b.order
      )[0]

    scrollTargetRef.current = {
      completedExerciseId,
      nextExerciseId:
        nextExercise?.id ?? null
    }

    remote.reload()
    onChanged()
  }

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
          Início:{' '}
          {dateTime(
            session.startedAt
          )}

          {session.finishedAt
            ? ` · Fim: ${dateTime(
                session.finishedAt
              )}`
            : ''}
        </p>

        <p className="mt-3 text-sm">
          {totalSets} séries
          registradas ·{' '}
          {
            session.exercises
              .length
          }{' '}
          exercícios
        </p>

        <a
          href={`#/plano/${session.strengthPlanId}`}
          className="auth-link mt-4 inline-block text-sm"
        >
          Consultar a versão do
          plano
        </a>

        <ErrorNotice
          message={action.error}
        />
      </Panel>

      {!session.exercises.length && (
        <Empty>
          Esta sessão não possui
          exercícios.
        </Empty>
      )}

      {orderedExercises.map(
        exercise => (
          <div
            key={exercise.id}
            id={`exercise-${exercise.id}`}
            className="scroll-mt-6"
          >
            <ExerciseLog
              exercise={exercise}
              previous={previousPerformance.find(
                previous =>
                  previous.workoutExerciseId ===
                  exercise.id
              )}
              finished={finished}
              onSaved={saved}
              onFinished={
                exerciseFinished
              }
            />
          </div>
        )
      )}

      {!finished && (
        <div
          id="finish-session"
          className="scroll-mt-6"
        >
          <Panel title="Concluir sessão">
            <p className="mb-4 text-sm leading-6 text-muted">
              Confira suas séries antes
              de finalizar. Após a
              conclusão, esta sessão
              ficará disponível apenas
              para consulta.
            </p>

            <ConfirmButton
              label="Finalizar treino"
              message="Finalizar agora? Não será possível adicionar novas séries a esta sessão."
              disabled={
                action.busy
              }
              onConfirm={() =>
                void action.run(
                  () =>
                    service.finish(id),
                  saved
                )
              }
            />
          </Panel>
        </div>
      )}
    </div>
  )
}