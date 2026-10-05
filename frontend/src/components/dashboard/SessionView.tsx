import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import type { FormEvent } from 'react'
import './SessionView.css'
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
  optionalNumber,
  sessionStatusLabel
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
    <div className="session-suggestions">
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
          <h2 tabIndex={-1} className="text-xl font-semibold">
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
        <div className="session-set-history">
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
              className="space-y-3"
            >
              <legend className="mb-3 text-sm font-medium">
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
              <div className="session-fields">
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
  const hasData = remote.data !== null
  const action = useAction()
  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(0)
  const carouselWidthRef = useRef(0)
  const focusNextRef = useRef(false)
  const navigate = useCallback((index: number) => {
    const carousel = carouselRef.current
    if (!carousel) return
    carousel.scrollTo({ left: index * carousel.clientWidth, behavior: 'instant' })
    setActiveIndex(index)
    activeIndexRef.current = index
  }, [])
  // Keep the footer's confirmation and wrapped text clear of both content and navigation.
  useEffect(() => {
    const footer = footerRef.current
    const page = footer?.closest<HTMLElement>('.session-page')
    if (!footer || !page) return
    const observer = new ResizeObserver(() => {
      page.style.setProperty('--session-footer-height', footer.offsetHeight + 'px')
    })
    observer.observe(footer)
    return () => { observer.disconnect(); page.style.removeProperty('--session-footer-height') }
  }, [remote.data?.session.finishedAt])
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return
    carouselWidthRef.current = carousel.clientWidth
    const observer = new ResizeObserver(() => {
      carouselWidthRef.current = carousel.clientWidth
      carousel.scrollTo({ left: activeIndexRef.current * carousel.clientWidth, behavior: 'instant' })
    })
    observer.observe(carousel)
    return () => observer.disconnect()
  }, [hasData])
  useEffect(() => {
    const carousel = carouselRef.current
    const panel = carousel?.querySelector<HTMLElement>('.session-slide[data-active=true] > section')
    if (!carousel || !panel) return
    const observer = new ResizeObserver(() => {
      carousel.style.setProperty('--active-slide-height', `${panel.offsetHeight + 8}px`)
    })
    observer.observe(panel)
    if (focusNextRef.current) {
      panel.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
      focusNextRef.current = false
    }
    return () => observer.disconnect()
  }, [activeIndex, hasData])
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
    const carousel = carouselRef.current
    const next = carousel?.querySelector<HTMLElement>(`#exercise-${scrollTarget.nextExerciseId}`)
    if (carousel && next) {
      focusNextRef.current = true
      carousel.scrollTo({ left: next.offsetLeft, behavior: 'instant' })
    } else {
      footerRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    }
    scrollTargetRef.current = null
  }, [remote.data])
  if (remote.loading && !remote.data) {
    return <Loading />
  }
  if (
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
  const isPartial =
    session.status === 2
  const completedExercises =
    session.exercises.filter(
      exercise => exercise.isCompleted
    ).length
  const totalExercises =
    session.exercises.length
  const hasIncompleteExercises =
    completedExercises < totalExercises
  const totalSets =
    session.exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.length,
      0
    )
  const durationMs =
    session.finishedAt !== null
      ? new Date(session.finishedAt).getTime() -
        new Date(session.startedAt).getTime()
      : null
  const durationLabel =
    durationMs === null
      ? null
      : durationMs < 60_000
        ? '< 1 min'
        : `${Math.round(durationMs / 60_000)} min`
  const saved = () => {
    remote.reload()
    onChanged()
  }
  const orderedExercises = [...session.exercises].sort((a, b) => a.order - b.order)
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
    <div className="session-content">
      <a
        href="#/dashboard"
        className="auth-link text-sm"
      >
        ← Voltar ao início
      </a>
      <div className="session-summary"><Panel>
        <Badge>{finished ? sessionStatusLabel(session.status) : 'Em andamento'}</Badge>
        <h2 className="session-title">
          {finished
            ? isPartial
              ? 'Treino encerrado parcialmente.'
              : 'Treino concluído.'
            : 'Seu treino em andamento'}
        </h2>
        <p className="mt-3 text-sm text-muted">
          Início: {dateTime(session.startedAt)}
          {session.finishedAt
            ? ` · Fim: ${dateTime(session.finishedAt)}`
            : ''}
        </p>
        {finished ? (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p>
              {completedExercises} de {totalExercises} exercícios concluídos
            </p>
            <p>{totalSets} séries registradas</p>
            {durationLabel && <p>Duração: {durationLabel}</p>}
          </div>
        ) : (
          <p className="mt-3 text-sm">
            {totalSets} séries registradas · {totalExercises} exercícios
          </p>
        )}
        <a
          href={`#/plano/${session.strengthPlanId}`}
          className="auth-link mt-4 inline-block text-sm"
        >
          Consultar a versão do plano
        </a>
      </Panel></div>
      <ErrorNotice message={remote.error} retry={remote.reload} />
      {!session.exercises.length && (
        <Empty>
          Esta sessão não possui
          exercícios.
        </Empty>
      )}
      {totalExercises > 0 && <section aria-label="Exercícios da sessão" aria-roledescription="carrossel">
        <div className="session-controls">
          <p aria-live="polite" aria-atomic="true">Exercício {activeIndex + 1} de {totalExercises}</p>
          <div className="flex gap-2">
            <button className="dash-secondary" type="button" aria-label="Exercício anterior" disabled={activeIndex === 0} onClick={() => navigate(activeIndex - 1)}>←</button>
            <button className="dash-secondary" type="button" aria-label="Próximo exercício" disabled={activeIndex >= totalExercises - 1} onClick={() => navigate(activeIndex + 1)}>→</button>
          </div>
        </div>
        <div className="session-steps" aria-label="Progresso dos exercícios">
          {orderedExercises.map((exercise, index) => <button key={exercise.id} type="button" aria-current={index === activeIndex ? 'step' : undefined} aria-label={`Exercício ${index + 1}: ${exercise.exerciseName}${exercise.isCompleted ? ', concluído' : ', pendente'}`} onClick={() => navigate(index)}>
            <span>{exercise.isCompleted ? '✓' : index + 1}</span><span>{exercise.exerciseName}</span>
          </button>)}
        </div>
        <div ref={carouselRef} className="session-carousel" onScroll={event => {
          // Resizing can emit a scroll before ResizeObserver restores the selected slide.
          if (event.currentTarget.clientWidth !== carouselWidthRef.current) return
          const index = Math.max(0, Math.min(totalExercises - 1, Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth)))
          activeIndexRef.current = index
          setActiveIndex(index)
        }}>
          {orderedExercises.map((exercise, index) => (
            <div key={exercise.id} id={`exercise-${exercise.id}`} className="session-slide" data-active={index === activeIndex} inert={index !== activeIndex} aria-hidden={index !== activeIndex} role="group" aria-roledescription="slide" aria-label={`Exercício ${index + 1} de ${totalExercises}`}>
              <ExerciseLog exercise={exercise} previous={previousPerformance.find(previous => previous.workoutExerciseId === exercise.id)} finished={finished} onSaved={saved} onFinished={exerciseFinished} />
            </div>
          ))}
        </div>
      </section>}
      {!finished && (
        <div
          ref={footerRef}
          id="finish-session"
          className="session-footer"
        >
          <div className="session-footer-inner">
            <div className="session-footer-progress"><strong>{completedExercises} de {totalExercises} exercícios concluídos</strong><span>{totalSets} séries registradas</span></div>
            <p className="sr-only">
              {totalExercises === 0
                ? 'Esta sessão não possui exercícios e não pode ser finalizada.'
                : hasIncompleteExercises
                  ? `${completedExercises} de ${totalExercises} exercícios foram concluídos. Se finalizar agora, o treino será registrado como parcial.`
                  : 'Todos os exercícios foram concluídos. Confira suas séries antes de finalizar o treino.'}
            </p>
            <ConfirmButton
              label={
                hasIncompleteExercises
                  ? 'Finalizar como parcial'
                  : 'Finalizar treino'
              }
              message={
                hasIncompleteExercises
                  ? 'Ainda existem exercícios não concluídos. Deseja finalizar mesmo assim? O treino será registrado como parcial e ficará disponível apenas para consulta.'
                  : 'Finalizar o treino agora? Após a conclusão, esta sessão ficará disponível apenas para consulta.'
              }
              disabled={action.busy || totalExercises === 0}
              onConfirm={() =>
                void action.run(
                  () => service.finish(id),
                  saved
                )
              }
            />
            <ErrorNotice message={action.error} />
          </div>
        </div>
      )}
    </div>
  )
}
