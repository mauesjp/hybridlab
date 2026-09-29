import {
  useCallback,
  useMemo,
  useState
} from 'react'

import { useRemote } from '../../hooks/useRemote'
import { dashboardService as service } from '../../services/dashboardService'
import type {
  StrengthExercisePerformance
} from '../../types/dashboard'

import {
  Empty,
  ErrorNotice,
  Loading,
  Panel
} from './UI'

function numberValue(value: number) {
  return value.toLocaleString('pt-BR', {
    maximumFractionDigits: 1
  })
}

function dateValue(value: string) {
  return new Date(value).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit'
    }
  )
}

function EvolutionChart({
  history
}: {
  history: StrengthExercisePerformance[]
}) {
  const useWeight = history.some(
    point => point.weight !== null
  )

  const pointsData = history.map(point => ({
    ...point,
    value: useWeight
      ? point.weight ?? 0
      : point.reps
  }))

  if (pointsData.length < 2) {
    return (
      <Empty>
        São necessários pelo menos dois treinos desse exercício para mostrar a evolução.
      </Empty>
    )
  }

  const width = 720
  const height = 220
  const paddingX = 36
  const paddingY = 26

  const values = pointsData.map(
    point => point.value
  )

  const min = Math.min(...values)
  const max = Math.max(...values)

  const range =
    max - min === 0
      ? 1
      : max - min

  const drawableWidth =
    width - paddingX * 2

  const drawableHeight =
    height - paddingY * 2

  const chartPoints = pointsData.map(
    (point, index) => {
      const x =
        paddingX +
        (
          index /
          (pointsData.length - 1)
        ) *
          drawableWidth

      const y =
        height -
        paddingY -
        (
          (point.value - min) /
          range
        ) *
          drawableHeight

      return {
        ...point,
        x,
        y
      }
    }
  )

  const polyline = chartPoints
    .map(point => `${point.x},${point.y}`)
    .join(' ')

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[620px] w-full"
        role="img"
        aria-label="Evolução do exercício"
      >
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="currentColor"
          opacity="0.18"
        />

        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {chartPoints.map(point => (
          <g key={point.sessionId}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="currentColor"
            />

            <text
              x={point.x}
              y={height - 7}
              textAnchor="middle"
              fill="currentColor"
              fontSize="11"
              opacity="0.65"
            >
              {dateValue(point.startedAt)}
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-2 text-xs text-muted">
        Evolução por{' '}
        {useWeight ? 'carga (kg)' : 'repetições'}.
      </p>
    </div>
  )
}

export default function StrengthAnalyticsView() {
  const [selectedName, setSelectedName] =
    useState('')

  const load = useCallback(
    () => service.strengthAnalytics(),
    []
  )

  const remote = useRemote(load)

  const data = remote.data

  const selectedExercise = useMemo(() => {
    if (!data?.exercises.length) {
      return null
    }

    return (
      data.exercises.find(
        exercise =>
          exercise.name === selectedName
      ) ??
      data.exercises[0]
    )
  }, [data, selectedName])

  if (!data && remote.loading) {
    return <Loading />
  }

  if (!data) {
    return (
      <ErrorNotice
        message={remote.error}
        retry={remote.reload}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="dash-eyebrow">
          Analytics
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          Sua evolução
        </h2>

        <p className="mt-2 text-sm text-muted">
          Acompanhe frequência, volume e progressão dos seus exercícios.
        </p>
      </div>

      {remote.error && (
        <ErrorNotice
          message={remote.error}
          retry={remote.reload}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dash-panel">
          <p className="text-sm text-muted">
            Treinos · 30 dias
          </p>

          <p className="mt-4 text-3xl font-semibold">
            {data.workoutsLast30Days}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">
            Últimos 7 dias
          </p>

          <p className="mt-4 text-3xl font-semibold">
            {data.workoutsLast7Days}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">
            Séries · 30 dias
          </p>

          <p className="mt-4 text-3xl font-semibold">
            {data.setsLast30Days}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">
            Volume · 30 dias
          </p>

          <p className="mt-4 text-3xl font-semibold">
            {numberValue(
              data.volumeLast30Days
            )}{' '}
            kg
          </p>
        </div>
      </div>

      <Panel title="Evolução por exercício">
        {!data.exercises.length ? (
          <Empty>
            Seus exercícios aparecerão aqui depois que você registrar treinos.
          </Empty>
        ) : (
          <div className="space-y-6">
            <label className="block text-sm">
              <span className="font-medium">
                Exercício
              </span>

              <select
                value={
                  selectedExercise?.name ?? ''
                }
                onChange={event =>
                  setSelectedName(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              >
                {data.exercises.map(
                  exercise => (
                    <option
                      key={exercise.name}
                      value={exercise.name}
                    >
                      {exercise.name}
                    </option>
                  )
                )}
              </select>
            </label>

            {selectedExercise && (
              <>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">
                    Maior carga registrada
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {selectedExercise.maxWeight ===
                    null
                      ? '—'
                      : `${numberValue(
                          selectedExercise.maxWeight
                        )} kg`}
                  </p>
                </div>

                <EvolutionChart
                  history={
                    selectedExercise.history
                  }
                />

                <div>
                  <h3 className="font-semibold">
                    Últimas performances
                  </h3>

                  {!selectedExercise.history
                    .length ? (
                    <Empty>
                      Nenhum registro disponível.
                    </Empty>
                  ) : (
                    <div className="mt-3 divide-y divide-border">
                      {[
                        ...selectedExercise.history
                      ]
                        .reverse()
                        .slice(0, 8)
                        .map(performance => (
                          <div
                            key={
                              performance.sessionId
                            }
                            className="flex items-center justify-between gap-4 py-3"
                          >
                            <p className="text-sm text-muted">
                              {new Date(
                                performance.startedAt
                              ).toLocaleDateString(
                                'pt-BR'
                              )}
                            </p>

                            <p className="font-medium">
                              {performance.weight ===
                              null
                                ? `${performance.reps} reps`
                                : `${numberValue(
                                    performance.weight
                                  )} kg × ${performance.reps}`}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Panel>
    </div>
  )
}