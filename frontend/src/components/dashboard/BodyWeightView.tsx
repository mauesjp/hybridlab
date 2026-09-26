import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'

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

function localDateTimeValue(date: Date) {
  const offset =
    date.getTimezoneOffset() * 60_000

  return new Date(
    date.getTime() - offset
  )
    .toISOString()
    .slice(0, 16)
}

function inputDateTimeValue(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return localDateTimeValue(date)
}

function dateTime(value: string) {
  return new Date(value).toLocaleString(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  )
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

const inputClass =
  'mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none'

export default function BodyWeightView() {
  const [entries, setEntries] =
    useState<BodyWeightEntry[]>([])

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
      localDateTimeValue(new Date())
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
  const data = await service.bodyWeight()

  setEntries(data)
  setError(null)

  return data }, [])

    useEffect(() => {
    let cancelled = false

    service
    .bodyWeight()
    .then(data => {
      if (cancelled) {
        return
      }

      setEntries(data)
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

  const currentWeight =
    entries[0]?.weightKg ?? null

  const firstWeight =
    entries.at(-1)?.weightKg ?? null

  const variation = useMemo(() => {
    if (
      currentWeight === null ||
      firstWeight === null
    ) {
      return null
    }

    return currentWeight - firstWeight
  }, [currentWeight, firstWeight])

  async function createEntry(
    event: React.FormEvent<HTMLFormElement>
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
      recordedAt:
        new Date(recordedAt).toISOString()
    }

    try {
      setSaving(true)
      setError(null)

      await service.createBodyWeight(body)

      setWeight('')
      setRecordedAt(
        localDateTimeValue(new Date())
      )

      await load()
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
      inputDateTimeValue(
        entry.recordedAt
      )
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
            new Date(
              editingRecordedAt
            ).toISOString()
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

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="dash-eyebrow">
          EVOLUÇÃO CORPORAL
        </p>

        <h1 className="mt-2 text-3xl font-semibold">
          Peso corporal
        </h1>

        <p className="mt-3 text-sm text-muted">
          Registre suas pesagens e
          acompanhe sua evolução.
        </p>
      </div>

      {error && (<ErrorNotice message={error} />)}

      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Peso atual">
          <p className="text-3xl font-semibold">
            {currentWeight === null
              ? '—'
              : `${numberValue(
                  currentWeight
                )} kg`}
          </p>
        </Panel>

        <Panel title="Peso inicial">
          <p className="text-3xl font-semibold">
            {firstWeight === null
              ? '—'
              : `${numberValue(
                  firstWeight
                )} kg`}
          </p>
        </Panel>

        <Panel title="Variação">
          <p className="text-3xl font-semibold">
            {variation === null
              ? '—'
              : `${
                  variation > 0
                    ? '+'
                    : ''
                }${numberValue(
                  variation
                )} kg`}
          </p>

          {entries.length > 1 && (
            <p className="mt-2 text-xs text-muted">
              Desde a primeira pesagem
              registrada.
            </p>
          )}
        </Panel>
      </div>

      <Panel title="Registrar pesagem">
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
                setWeight(
                  event.target.value
                )
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
              type="datetime-local"
              required
              value={recordedAt}
              max={localDateTimeValue(
                new Date()
              )}
              onChange={event =>
                setRecordedAt(
                  event.target.value
                )
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
      </Panel>

      <Panel title="Histórico">
        {!entries.length ? (
          <Empty>
            Nenhuma pesagem registrada.
          </Empty>
        ) : (
          <div className="space-y-3">
            {entries.map(entry => {
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
                          value={
                            editingWeight
                          }
                          onChange={event =>
                            setEditingWeight(
                              event.target
                                .value
                            )
                          }
                          className={
                            inputClass
                          }
                        />
                      </label>

                      <label className="text-sm">
                        <span className="font-medium">
                          Data
                        </span>

                        <input
                          type="datetime-local"
                          value={
                            editingRecordedAt
                          }
                          max={localDateTimeValue(
                            new Date()
                          )}
                          onChange={event =>
                            setEditingRecordedAt(
                              event.target
                                .value
                            )
                          }
                          className={
                            inputClass
                          }
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="dash-primary"
                          disabled={saving}
                          onClick={() =>
                            void saveEdit(
                              entry.id
                            )
                          }
                        >
                          Salvar
                        </button>

                        <button
                          type="button"
                          className="dash-secondary"
                          disabled={saving}
                          onClick={
                            cancelEdit
                          }
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xl font-semibold">
                          {numberValue(
                            entry.weightKg
                          )}{' '}
                          kg
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          {dateTime(
                            entry.recordedAt
                          )}
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
                            void deleteEntry(
                              entry
                            )
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
      </Panel>
    </div>
  )
}