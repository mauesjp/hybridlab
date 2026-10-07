import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import type { FormEvent } from 'react'

import { dashboardService as service } from '../../services/dashboardService'
import type {
  BodyWeightEntry,
  BodyWeightInput
} from '../../types/dashboard'

import {
  Empty,
  ErrorNotice,
  Loading,
  Panel
} from './UI'

function localDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function inputDateValue(value: string) {
  return value.slice(0, 10)
}

function dateParts(value: string) {
  const [year, month, day] = value
    .slice(0, 10)
    .split('-')
    .map(Number)

  return { year, month, day }
}

function dateTimestamp(value: string) {
  const { year, month, day } = dateParts(value)
  return Date.UTC(year, month - 1, day)
}

function dateValue(value: string) {
  const { year, month, day } = dateParts(value)

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString('pt-BR')
}

function shortDateValue(value: string) {
  const { year, month, day } = dateParts(value)

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  })
}

function numberValue(value: number) {
  return value.toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }
  )
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível concluir a operação.'
}

type WeightProgressPoint = {
  id: number
  recordedAt: string
  timestamp: number
  weightKg: number
  average7Kg: number
  sampleCount: number
}

function buildWeightProgress(
  entries: BodyWeightEntry[]
): WeightProgressPoint[] {
  const chronological = [...entries].sort(
    (a, b) =>
      dateTimestamp(a.recordedAt) -
      dateTimestamp(b.recordedAt)
  )

  const dayMs = 24 * 60 * 60 * 1000

  return chronological.map((entry, index) => {
    const timestamp = dateTimestamp(entry.recordedAt)
    const startTimestamp = timestamp - 6 * dayMs

    const windowEntries = chronological.slice(0, index + 1).filter(
      item => {
        const itemTimestamp = dateTimestamp(item.recordedAt)

        return (
          itemTimestamp >= startTimestamp &&
          itemTimestamp <= timestamp
        )
      }
    )

    const average7Kg =
      windowEntries.reduce(
        (total, item) => total + item.weightKg,
        0
      ) / windowEntries.length

    return {
      id: entry.id,
      recordedAt: entry.recordedAt,
      timestamp,
      weightKg: entry.weightKg,
      average7Kg,
      sampleCount: windowEntries.length
    }
  })
}

function pathFromPoints(
  points: WeightProgressPoint[],
  value: (point: WeightProgressPoint) => number,
  x: (index: number) => number,
  y: (value: number) => number
) {
  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'

      return `${command} ${x(index)} ${y(value(point))}`
    })
    .join(' ')
}

function WeightProgressChart({
  points,
  goalWeight
}: {
  points: WeightProgressPoint[]
  goalWeight: number | null
}) {
  if (points.length < 2) {
    return (
      <Empty>
        Registre pelo menos duas pesagens para visualizar o gráfico de evolução.
      </Empty>
    )
  }

  const visiblePoints = points.slice(-30)

  const width = 760
  const height = 300
  const left = 52
  const right = 20
  const top = 22
  const bottom = 48
  const innerWidth = width - left - right
  const innerHeight = height - top - bottom

  const values = visiblePoints.flatMap(point => [
    point.weightKg,
    point.average7Kg
  ])

  if (goalWeight !== null) {
    values.push(goalWeight)
  }

  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const rawRange = rawMax - rawMin
  const verticalPadding = Math.max(
    0.5,
    rawRange === 0 ? 1 : rawRange * 0.12
  )
  const minWeight = rawMin - verticalPadding
  const maxWeight = rawMax + verticalPadding
  const weightRange = maxWeight - minWeight

  const x = (index: number) =>
    left +
    (visiblePoints.length === 1
      ? innerWidth / 2
      : (index / (visiblePoints.length - 1)) * innerWidth)

  const y = (value: number) =>
    top +
    ((maxWeight - value) / weightRange) * innerHeight

  const weightPath = pathFromPoints(
    visiblePoints,
    point => point.weightKg,
    x,
    y
  )

  const averagePath = pathFromPoints(
    visiblePoints,
    point => point.average7Kg,
    x,
    y
  )

  const yTicks = [
    maxWeight,
    (maxWeight + minWeight) / 2,
    minWeight
  ]

  const xTickIndexes = Array.from(
    new Set([
      0,
      Math.floor((visiblePoints.length - 1) / 2),
      visiblePoints.length - 1
    ])
  )

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Gráfico de evolução do peso corporal"
        >
          {yTicks.map(tick => (
            <g key={tick}>
              <line
                x1={left}
                x2={width - right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                opacity="0.12"
                vectorEffect="non-scaling-stroke"
              />

              <text
                x={left - 10}
                y={y(tick) + 4}
                textAnchor="end"
                fill="currentColor"
                opacity="0.55"
                fontSize="11"
              >
                {numberValue(tick)}
              </text>
            </g>
          ))}

          {goalWeight !== null && (
            <g>
              <line
                x1={left}
                x2={width - right}
                y1={y(goalWeight)}
                y2={y(goalWeight)}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 5"
                opacity="0.5"
                vectorEffect="non-scaling-stroke"
              />

              <text
                x={width - right}
                y={Math.max(top + 12, y(goalWeight) - 7)}
                textAnchor="end"
                fill="currentColor"
                opacity="0.65"
                fontSize="11"
              >
                Meta {numberValue(goalWeight)} kg
              </text>
            </g>
          )}

          <path
            d={averagePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="7 5"
            opacity="0.55"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          <path
            d={weightPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {visiblePoints.map((point, index) => (
            <circle
              key={point.id}
              cx={x(index)}
              cy={y(point.weightKg)}
              r="3.5"
              fill="currentColor"
            >
              <title>
                {dateValue(point.recordedAt)} · {numberValue(point.weightKg)} kg · Média 7d {numberValue(point.average7Kg)} kg
              </title>
            </circle>
          ))}

          {xTickIndexes.map(index => {
            const point = visiblePoints[index]

            return (
              <text
                key={`${point.id}-${index}`}
                x={x(index)}
                y={height - 15}
                textAnchor={
                  index === 0
                    ? 'start'
                    : index === visiblePoints.length - 1
                      ? 'end'
                      : 'middle'
                }
                fill="currentColor"
                opacity="0.55"
                fontSize="11"
              >
                {shortDateValue(point.recordedAt)}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-px w-7 bg-current" />
          Peso registrado
        </span>

        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-7 border-t border-dashed border-current opacity-70" />
          Média móvel de 7 dias
        </span>

        {goalWeight !== null && (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-7 border-t border-dotted border-current opacity-70" />
            Meta
          </span>
        )}
      </div>

      {points.length > 30 && (
        <p className="mt-3 text-xs text-muted">
          O gráfico exibe as 30 pesagens mais recentes.
        </p>
      )}
    </div>
  )
}

const inputClass =
  'mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none'

export default function BodyWeightView() {
  const [view, setView] = useState<"overview" | "record" | "goal">("overview")
  const [historyLimit, setHistoryLimit] = useState(10)
  const [entries, setEntries] =
    useState<BodyWeightEntry[]>([])

  const [goalWeight, setGoalWeight] =
    useState<number | null>(null)

  const [goalInput, setGoalInput] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [weight, setWeight] =
    useState('')

  const [recordedAt, setRecordedAt] =
    useState(
      localDateValue(new Date())
    )

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [editingWeight, setEditingWeight] =
    useState('')

  const [
    editingRecordedAt,
    setEditingRecordedAt
  ] = useState('')

  const load = useCallback(async () => {
    const [weightData, goalData] =
      await Promise.all([
        service.bodyWeight(),
        service.bodyWeightGoal()
      ])

    setEntries(weightData)
    setGoalWeight(goalData.goalWeightKg)
    setGoalInput(
      goalData.goalWeightKg?.toString() ?? ''
    )
    setError(null)

    return weightData
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      service.bodyWeight(),
      service.bodyWeightGoal()
    ])
      .then(([weightData, goalData]) => {
        if (cancelled) {
          return
        }

        setEntries(weightData)
        setGoalWeight(goalData.goalWeightKg)
        setGoalInput(
          goalData.goalWeightKg?.toString() ?? ''
        )
        setError(null)
      })
      .catch(error => {
        if (cancelled) {
          return
        }

        setError(errorMessage(error))
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const progressPoints = useMemo(
    () => buildWeightProgress(entries),
    [entries]
  )

  const currentWeight =
    progressPoints.at(-1)?.weightKg ?? null

  const firstWeight =
    progressPoints[0]?.weightKg ?? null

  const currentAverage7 =
    progressPoints.at(-1)?.average7Kg ?? null

  const currentAverageSamples =
    progressPoints.at(-1)?.sampleCount ?? 0

  const variation = useMemo(() => {
    if (
      currentWeight === null ||
      firstWeight === null
    ) {
      return null
    }

    return currentWeight - firstWeight
  }, [currentWeight, firstWeight])

  const goalDistance = useMemo(() => {
    if (
      currentWeight === null ||
      goalWeight === null
    ) {
      return null
    }

    return Math.abs(currentWeight - goalWeight)
  }, [currentWeight, goalWeight])

  async function createEntry(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const parsedWeight =
      Number(weight.replace(',', '.'))

    if (
      !Number.isFinite(parsedWeight) ||
      parsedWeight < 30 ||
      parsedWeight > 400
    ) {
      setError(
        'Informe um peso entre 30 kg e 400 kg.'
      )
      return
    }

    if (!recordedAt) {
      setError(
        'Informe a data da pesagem.'
      )
      return
    }

    const body: BodyWeightInput = {
      weightKg: parsedWeight,
      recordedAt: `${recordedAt}T00:00:00`
    }

    try {
      setSaving(true)
      setError(null)

      await service.createBodyWeight(body)

      setWeight('')
      setRecordedAt(
        localDateValue(new Date())
      )

      await load()
      setView("overview")
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  function beginEdit(
    entry: BodyWeightEntry
  ) {
    setEditingId(entry.id)

    setEditingWeight(
      entry.weightKg.toString()
    )

    setEditingRecordedAt(
      inputDateValue(entry.recordedAt)
    )
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingWeight('')
    setEditingRecordedAt('')
  }

  async function saveEdit(
    entryId: number
  ) {
    const parsedWeight =
      Number(
        editingWeight.replace(',', '.')
      )

    if (
      !Number.isFinite(parsedWeight) ||
      parsedWeight < 30 ||
      parsedWeight > 400
    ) {
      setError(
        'Informe um peso entre 30 kg e 400 kg.'
      )
      return
    }

    if (!editingRecordedAt) {
      setError(
        'Informe a data da pesagem.'
      )
      return
    }

    try {
      setSaving(true)
      setError(null)

      await service.updateBodyWeight(
        entryId,
        {
          weightKg: parsedWeight,
          recordedAt:
            `${editingRecordedAt}T00:00:00`
        }
      )

      cancelEdit()

      await load()
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function deleteEntry(
    entry: BodyWeightEntry
  ) {
    const confirmed =
      window.confirm(
        `Excluir a pesagem de ${numberValue(
          entry.weightKg
        )} kg?`
      )

    if (!confirmed) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      await service.deleteBodyWeight(
        entry.id
      )

      if (editingId === entry.id) {
        cancelEdit()
      }

      await load()
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function saveGoal(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const normalized = goalInput.trim()

    if (!normalized) {
      setError(
        'Informe a meta de peso ou use “Remover meta”.'
      )
      return
    }

    const parsedGoal =
      Number(normalized.replace(',', '.'))

    if (
      !Number.isFinite(parsedGoal) ||
      parsedGoal < 30 ||
      parsedGoal > 400
    ) {
      setError(
        'Informe uma meta entre 30 kg e 400 kg.'
      )
      return
    }

    try {
      setSaving(true)
      setError(null)

      const result =
        await service.updateBodyWeightGoal(
          parsedGoal
        )

      setGoalWeight(result.goalWeightKg)
      setGoalInput(
        result.goalWeightKg?.toString() ?? ''
      )
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function removeGoal() {
    const confirmed = window.confirm(
      'Remover sua meta de peso?'
    )

    if (!confirmed) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const result =
        await service.updateBodyWeightGoal(null)

      setGoalWeight(result.goalWeightKg)
      setGoalInput('')
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="progress-toolbar">
        <div>
        <p className="dash-eyebrow">
          EVOLUÇÃO CORPORAL
        </p>

        <h2 className="mt-2 text-3xl font-semibold">
          Sua evolução
        </h2>

        <p className="mt-3 text-sm text-muted">
          Registre suas pesagens e acompanhe sua evolução.
        </p></div>
        <div className="flex flex-wrap gap-2"><button className="dash-primary" onClick={() => setView(view === "record" ? "overview" : "record")}>{view === "record" ? "Voltar à evolução" : "Registrar pesagem"}</button><button className="dash-secondary" onClick={() => setView(view === "goal" ? "overview" : "goal")}>{view === "goal" ? "Voltar à evolução" : "Ajustar meta"}</button></div>
      </div>

      {error && (
        <ErrorNotice message={error} />
      )}

      {view === "overview" && <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Peso atual">
          <p className="text-3xl font-semibold">
            {currentWeight === null
              ? '—'
              : `${numberValue(currentWeight)} kg`}
          </p>

          {progressPoints.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              Último registro em {dateValue(progressPoints.at(-1)!.recordedAt)}.
            </p>
          )}
        </Panel>

        <Panel title="Média 7 dias">
          <p className="text-3xl font-semibold">
            {currentAverage7 === null
              ? '—'
              : `${numberValue(currentAverage7)} kg`}
          </p>

          {currentAverage7 !== null && (
            <p className="mt-2 text-xs text-muted">
              {currentAverageSamples}{' '}
              {currentAverageSamples === 1
                ? 'pesagem considerada'
                : 'pesagens consideradas'} nos últimos 7 dias.
            </p>
          )}
        </Panel>

        <Panel title="Meta">
          <p className="text-3xl font-semibold">
            {goalWeight === null
              ? '—'
              : `${numberValue(goalWeight)} kg`}
          </p>

          {goalDistance !== null && (
            <p className="mt-2 text-xs text-muted">
              {goalDistance === 0
                ? 'Meta atingida.'
                : `${numberValue(goalDistance)} kg de distância da meta.`}
            </p>
          )}
        </Panel>

        <Panel title="Variação">
          <p className="text-3xl font-semibold">
            {variation === null
              ? '—'
              : `${variation > 0 ? '+' : ''}${numberValue(variation)} kg`}
          </p>

          {progressPoints.length > 1 && (
            <p className="mt-2 text-xs text-muted">
              Desde {numberValue(firstWeight!)} kg na primeira pesagem.
            </p>
          )}
        </Panel>
      </div>

      <Panel title="Evolução">
        <p className="mb-5 text-sm leading-6 text-muted">
          A média móvel considera as pesagens registradas no dia e nos 6 dias anteriores, reduzindo o efeito das oscilações diárias.
        </p>

        <WeightProgressChart
          points={progressPoints}
          goalWeight={goalWeight}
        />
      </Panel>

      </>}
      {view === "goal" && <Panel title="Meta de peso">
        <form
          onSubmit={saveGoal}
          className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end"
        >
          <label className="text-sm">
            <span className="font-medium">
              Meta (kg)
            </span>

            <input
              type="number"
              min="30"
              max="400"
              step="0.01"
              value={goalInput}
              onChange={event =>
                setGoalInput(event.target.value)
              }
              placeholder="Ex.: 88"
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            className="dash-primary"
            disabled={saving}
          >
            {saving
              ? 'Salvando…'
              : goalWeight === null
                ? 'Definir meta'
                : 'Atualizar meta'}
          </button>

          {goalWeight !== null && (
            <button
              type="button"
              className="dash-secondary"
              disabled={saving}
              onClick={() => void removeGoal()}
            >
              Remover meta
            </button>
          )}
        </form>
      </Panel>

      }
      {view === "record" && <Panel title="Registrar pesagem">
        <form
          onSubmit={createEntry}
          className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
        >
          <label className="text-sm">
            <span className="font-medium">
              Peso (kg)
            </span>

            <input
              type="number"
              min="30"
              max="400"
              step="0.01"
              required
              value={weight}
              onChange={event =>
                setWeight(event.target.value)
              }
              placeholder="Ex.: 91.85"
              className={inputClass}
            />
          </label>

          <label className="text-sm">
            <span className="font-medium">
              Data da pesagem
            </span>

            <input
              type="date"
              required
              value={recordedAt}
              max={localDateValue(new Date())}
              onChange={event =>
                setRecordedAt(event.target.value)
              }
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            className="dash-primary"
            disabled={saving}
          >
            {saving
              ? 'Salvando…'
              : '+ Registrar'}
          </button>
        </form>

        <p className="mt-3 text-xs text-muted">
          É permitido um registro oficial por dia.
        </p>
      </Panel>

      }
      {view === "overview" && <Panel title="Histórico">
        {!entries.length ? (
          <Empty>
            Nenhuma pesagem registrada.
          </Empty>
        ) : (
          <div className="space-y-3">
            {[...entries].sort((a,b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0,historyLimit).map(entry => {
              const editing =
                editingId === entry.id

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border p-4"
                >
                  {editing ? (
                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                      <label className="text-sm">
                        <span className="font-medium">
                          Peso
                        </span>

                        <input
                          type="number"
                          min="30"
                          max="400"
                          step="0.01"
                          value={editingWeight}
                          onChange={event =>
                            setEditingWeight(
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="text-sm">
                        <span className="font-medium">
                          Data
                        </span>

                        <input
                          type="date"
                          value={editingRecordedAt}
                          max={localDateValue(new Date())}
                          onChange={event =>
                            setEditingRecordedAt(
                              event.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="dash-primary"
                          disabled={saving}
                          onClick={() =>
                            void saveEdit(entry.id)
                          }
                        >
                          Salvar
                        </button>

                        <button
                          type="button"
                          className="dash-secondary"
                          disabled={saving}
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xl font-semibold">
                          {numberValue(entry.weightKg)} kg
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {dateValue(entry.recordedAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="dash-secondary"
                          onClick={() =>
                            beginEdit(entry)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="dash-secondary"
                          disabled={saving}
                          onClick={() =>
                            void deleteEntry(entry)
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {entries.length > historyLimit && <button className="dash-secondary mt-4" onClick={() => setHistoryLimit(value => value+10)}>Mostrar mais pesagens</button>}
      </Panel>}
    </div>
  )
}
