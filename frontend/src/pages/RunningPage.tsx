import { useEffect, useMemo, useState } from "react";

import { runningService } from "../services/runningService";

import type {
  RunningWorkout,
  RunningWorkoutBlock,
  RunningWorkoutBlockInput,
  RunningWorkoutBlockType,
  RunningWorkoutInput,
} from "../types/running";

const blockTypeLabels: Record<RunningWorkoutBlockType, string> = {
  0: "Aquecimento",
  1: "Corrida",
  2: "Intervalo",
  3: "Recuperação",
  4: "Desaquecimento",
};

type BlockDraft = {
  type: RunningWorkoutBlockType;
  distanceKm: string;
  durationMinutes: string;
  durationSeconds: string;
  paceMinutes: string;
  paceSeconds: string;
  repetitions: string;
  notes: string;
};

type WorkoutForm = {
  name: string;
  scheduledDate: string;
  notes: string;
  blocks: BlockDraft[];
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
}

function todayKey() {
  return dateKey(new Date());
}

function getMonday(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const day = (result.getDay() + 6) % 7;

  result.setDate(result.getDate() - day);

  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
}

function formatDayName(date: Date) {
  return date
    .toLocaleDateString("pt-BR", {
      weekday: "short",
    })
    .replace(".", "");
}

function formatDayNumber(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatFullDate(value: string) {
  const date = value.slice(0, 10);

  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function emptyBlock(type: RunningWorkoutBlockType = 1): BlockDraft {
  return {
    type,
    distanceKm: "",
    durationMinutes: "",
    durationSeconds: "",
    paceMinutes: "",
    paceSeconds: "",
    repetitions: "1",
    notes: "",
  };
}

function emptyForm(scheduledDate = todayKey()): WorkoutForm {
  return {
    name: "",
    scheduledDate,
    notes: "",
    blocks: [emptyBlock(0), emptyBlock(1), emptyBlock(4)],
  };
}

function durationToDraft(totalSeconds: number | null) {
  if (totalSeconds === null) {
    return {
      minutes: "",
      seconds: "",
    };
  }

  return {
    minutes: Math.floor(totalSeconds / 60).toString(),

    seconds: (totalSeconds % 60).toString(),
  };
}

function paceToDraft(totalSeconds: number | null) {
  if (totalSeconds === null) {
    return {
      minutes: "",
      seconds: "",
    };
  }

  return {
    minutes: Math.floor(totalSeconds / 60).toString(),

    seconds: pad(totalSeconds % 60),
  };
}

function blockToDraft(block: RunningWorkoutBlock): BlockDraft {
  const duration = durationToDraft(block.durationSeconds);

  const pace = paceToDraft(block.targetPaceSecondsPerKm);

  return {
    type: block.type,

    distanceKm: block.distanceKm === null ? "" : String(block.distanceKm),

    durationMinutes: duration.minutes,

    durationSeconds: duration.seconds,

    paceMinutes: pace.minutes,

    paceSeconds: pace.seconds,

    repetitions: String(block.repetitions),

    notes: block.notes ?? "",
  };
}

function secondsFromFields(minutes: string, seconds: string) {
  const min = Number(minutes || 0);

  const sec = Number(seconds || 0);

  const total = min * 60 + sec;

  return total > 0 ? total : null;
}

function blockDraftToInput(block: BlockDraft): RunningWorkoutBlockInput {
  const distance = block.distanceKm.trim()
    ? Number(block.distanceKm.replace(",", "."))
    : null;

  const duration = secondsFromFields(
    block.durationMinutes,
    block.durationSeconds,
  );

  const pace = secondsFromFields(block.paceMinutes, block.paceSeconds);

  return {
    type: block.type,

    distanceKm: distance,

    durationSeconds: duration,

    targetPaceSecondsPerKm: pace,

    repetitions: Math.max(1, Number(block.repetitions || 1)),

    notes: block.notes.trim() || null,
  };
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return null;

  const minutes = Math.floor(seconds / 60);

  const rest = seconds % 60;

  if (rest === 0) return `${minutes} min`;

  return `${minutes}:${pad(rest)}`;
}

function formatPace(seconds: number | null) {
  if (seconds === null) return null;

  const minutes = Math.floor(seconds / 60);

  const rest = seconds % 60;

  return `${minutes}:${pad(rest)}/km`;
}

function formatBlock(block: RunningWorkoutBlock) {
  const details: string[] = [];

  if (block.distanceKm !== null) {
    details.push(`${block.distanceKm} km`);
  }

  const duration = formatDuration(block.durationSeconds);

  if (duration) {
    details.push(duration);
  }

  const pace = formatPace(block.targetPaceSecondsPerKm);

  if (pace) {
    details.push(`@ ${pace}`);
  }

  let text = details.join(" · ");

  if (block.repetitions > 1) {
    text = `${block.repetitions}× ` + text;
  }

  return text || "Bloco sem detalhes";
}

export default function RunningPage() {
  const [workouts, setWorkouts] = useState<RunningWorkout[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const [form, setForm] = useState<WorkoutForm>(emptyForm());

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await runningService.getAll();

        setWorkouts(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os treinos.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, RunningWorkout[]>();

    workouts.forEach((workout) => {
      const key = workout.scheduledDate.slice(0, 10);

      const current = map.get(key) ?? [];

      current.push(workout);

      map.set(key, current);
    });

    map.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

    return map;
  }, [workouts]);

  function resetForm(date = todayKey()) {
    setEditingId(null);
    setForm(emptyForm(date));
    setError(null);
  }

  function startCreate(date: string) {
    resetForm(date);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEdit(workout: RunningWorkout) {
    setEditingId(workout.id);

    setForm({
      name: workout.name,

      scheduledDate: workout.scheduledDate.slice(0, 10),

      notes: workout.notes ?? "",

      blocks: workout.blocks
        .sort((a, b) => a.sequence - b.sequence)
        .map(blockToDraft),
    });

    setError(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateBlock(index: number, patch: Partial<BlockDraft>) {
    setForm((current) => ({
      ...current,

      blocks: current.blocks.map((block, blockIndex) =>
        blockIndex === index
          ? {
              ...block,
              ...patch,
            }
          : block,
      ),
    }));
  }

  function addBlock() {
    setForm((current) => ({
      ...current,

      blocks: [...current.blocks, emptyBlock()],
    }));
  }

  function removeBlock(index: number) {
    setForm((current) => ({
      ...current,

      blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setForm((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.blocks.length) {
        return current;
      }

      const blocks = [...current.blocks];

      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];

      return {
        ...current,
        blocks,
      };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError(null);

    if (!form.name.trim()) {
      setError("Informe um nome para o treino.");
      return;
    }

    if (!form.scheduledDate) {
      setError("Informe a data do treino.");
      return;
    }

    if (form.blocks.length === 0) {
      setError("Adicione pelo menos um bloco ao treino.");
      return;
    }

    const blocks = form.blocks.map(blockDraftToInput);

    const invalidBlock = blocks.some(
      (block) => block.distanceKm === null && block.durationSeconds === null,
    );

    if (invalidBlock) {
      setError("Cada bloco precisa ter uma distância ou duração.");
      return;
    }

    const input: RunningWorkoutInput = {
      name: form.name.trim(),

      scheduledDate: form.scheduledDate,

      notes: form.notes.trim() || null,

      blocks,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        const updated = await runningService.update(editingId, input);

        setWorkouts((current) =>
          current.map((workout) =>
            workout.id === updated.id ? updated : workout,
          ),
        );
      } else {
        const created = await runningService.create(input);

        setWorkouts((current) => [...current, created]);
      }

      resetForm(form.scheduledDate);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o treino.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorkout(workout: RunningWorkout) {
    const confirmed = window.confirm(`Excluir "${workout.name}"?`);

    if (!confirmed) return;

    try {
      setError(null);

      await runningService.remove(workout.id);

      setWorkouts((current) =>
        current.filter((item) => item.id !== workout.id),
      );

      if (editingId === workout.id) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o treino.",
      );
    }
  }

  const weekEnd = weekDays[6];

  return (
    <div className="space-y-8">
      <div>
        <p className="dash-eyebrow">Corrida</p>

        <h1 className="mt-2 text-3xl font-semibold">Planejamento semanal</h1>

        <p className="mt-2 text-sm text-muted">
          Monte seus treinos de corrida e acompanhe a programação da semana.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-border p-4 text-sm">
          {error}
        </div>
      )}

      <section className="dash-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="dash-eyebrow">
              {editingId === null ? "Novo treino" : "Editando treino"}
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {editingId === null ? "Montar treino" : "Atualizar treino"}
            </h2>
          </div>

          {editingId !== null && (
            <button
              type="button"
              onClick={() => resetForm()}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Nome do treino</span>

              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex.: Intervalado 5x4min"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Data</span>

              <input
                type="date"
                value={form.scheduledDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scheduledDate: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-medium">Observações</span>

            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={3}
              placeholder="Opcional"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            />
          </label>

          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Blocos do treino</h3>

                <p className="mt-1 text-sm text-muted">
                  A ordem abaixo será a ordem de execução.
                </p>
              </div>

              <button
                type="button"
                onClick={addBlock}
                className="rounded-xl border border-border px-4 py-2 text-sm"
              >
                + Adicionar bloco
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {form.blocks.map((block, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium">Bloco {index + 1}</p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveBlock(index, -1)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-30"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        disabled={index === form.blocks.length - 1}
                        onClick={() => moveBlock(index, 1)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-30"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="block text-sm">
                      <span className="font-medium">Tipo</span>

                      <select
                        value={block.type}
                        onChange={(event) =>
                          updateBlock(index, {
                            type: Number(
                              event.target.value,
                            ) as RunningWorkoutBlockType,
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                      >
                        {(
                          Object.entries(blockTypeLabels) as [string, string][]
                        ).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm">
                      <span className="font-medium">Distância (km)</span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={block.distanceKm}
                        onChange={(event) =>
                          updateBlock(index, {
                            distanceKm: event.target.value,
                          })
                        }
                        placeholder="Ex.: 5"
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="font-medium">Repetições</span>

                      <input
                        type="number"
                        min="1"
                        value={block.repetitions}
                        onChange={(event) =>
                          updateBlock(index, {
                            repetitions: event.target.value,
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Duração</p>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Min"
                          value={block.durationMinutes}
                          onChange={(event) =>
                            updateBlock(index, {
                              durationMinutes: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                        />

                        <input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="Seg"
                          value={block.durationSeconds}
                          onChange={(event) =>
                            updateBlock(index, {
                              durationSeconds: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Pace alvo</p>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Min/km"
                          value={block.paceMinutes}
                          onChange={(event) =>
                            updateBlock(index, {
                              paceMinutes: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                        />

                        <input
                          type="number"
                          min="0"
                          max="59"
                          placeholder="Seg"
                          value={block.paceSeconds}
                          onChange={(event) =>
                            updateBlock(index, {
                              paceSeconds: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="mt-4 block text-sm">
                    <span className="font-medium">Observação do bloco</span>

                    <input
                      value={block.notes}
                      onChange={(event) =>
                        updateBlock(index, {
                          notes: event.target.value,
                        })
                      }
                      placeholder="Opcional"
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : editingId === null
                ? "Criar treino"
                : "Salvar alterações"}
          </button>
        </form>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="dash-eyebrow">Semana</p>

            <h2 className="mt-2 text-xl font-semibold">
              {formatDayNumber(weekStart)} — {formatDayNumber(weekEnd)}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWeekStart(getMonday(new Date()))}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Hoje
            </button>

            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              ← Semana anterior
            </button>

            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Próxima semana →
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 dash-panel text-sm text-muted">
            Carregando planejamento...
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {weekDays.map((day) => {
              const key = dateKey(day);

              const dayWorkouts = workoutsByDate.get(key) ?? [];

              const isToday = key === todayKey();

              return (
                <div key={key} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase text-muted">
                        {formatDayName(day)}
                      </p>

                      <p
                        className={`mt-1 text-lg font-semibold ${
                          isToday ? "underline" : ""
                        }`}
                      >
                        {formatDayNumber(day)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => startCreate(key)}
                      className="rounded-lg border border-border px-2 py-1 text-xs"
                    >
                      +
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {!dayWorkouts.length ? (
                      <p className="text-xs text-muted">
                        Sem treino planejado.
                      </p>
                    ) : (
                      dayWorkouts.map((workout) => (
                        <div
                          key={workout.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <p className="font-medium">{workout.name}</p>

                          <div className="mt-3 space-y-2">
                            {[...workout.blocks]
                              .sort((a, b) => a.sequence - b.sequence)
                              .map((block) => (
                                <div key={block.id} className="text-xs">
                                  <p className="font-medium">
                                    {blockTypeLabels[block.type]}
                                  </p>

                                  <p className="mt-0.5 text-muted">
                                    {formatBlock(block)}
                                  </p>
                                </div>
                              ))}
                          </div>

                          {workout.notes && (
                            <p className="mt-3 text-xs text-muted">
                              {workout.notes}
                            </p>
                          )}

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(workout)}
                              className="rounded-lg border border-border px-2 py-1 text-xs"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => void deleteWorkout(workout)}
                              className="rounded-lg border border-border px-2 py-1 text-xs"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!!workouts.length && (
        <section className="dash-panel">
          <p className="dash-eyebrow">Planejamento</p>

          <h2 className="mt-2 text-xl font-semibold">Todos os treinos</h2>

          <div className="mt-4 divide-y divide-border">
            {[...workouts]
              .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
              .map((workout) => (
                <div
                  key={workout.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-medium">{workout.name}</p>

                    <p className="mt-1 text-sm text-muted">
                      {formatFullDate(workout.scheduledDate)} ·{" "}
                      {workout.blocks.length} blocos
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startEdit(workout)}
                    className="rounded-xl border border-border px-4 py-2 text-sm"
                  >
                    Editar
                  </button>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
