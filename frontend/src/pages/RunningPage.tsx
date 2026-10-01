import { useEffect, useMemo, useState, type FormEvent } from "react";

import { runningService } from "../services/runningService";

import type {
  RunningActivity,
  RunningActivityInput,
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
  notes: string;
  blocks: BlockDraft[];
};

type ActivityForm = {
  activityDate: string;
  distanceKm: string;
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
  averageHeartRate: string;
  rpe: string;
  notes: string;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function todayKey() {
  const date = new Date();

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
}

function formatFullDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function decimalValue(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
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

function emptyWorkoutForm(): WorkoutForm {
  return {
    name: "",
    notes: "",
    blocks: [emptyBlock(0), emptyBlock(1), emptyBlock(4)],
  };
}

function emptyActivityForm(): ActivityForm {
  return {
    activityDate: todayKey(),
    distanceKm: "",
    durationHours: "",
    durationMinutes: "",
    durationSeconds: "",
    averageHeartRate: "",
    rpe: "",
    notes: "",
  };
}

function secondsFromFields(minutes: string, seconds: string) {
  const total = Number(minutes || 0) * 60 + Number(seconds || 0);

  return total > 0 ? total : null;
}

function blockToDraft(block: RunningWorkoutBlock): BlockDraft {
  const duration =
    block.durationSeconds === null ? null : block.durationSeconds;

  const pace =
    block.targetPaceSecondsPerKm === null ? null : block.targetPaceSecondsPerKm;

  return {
    type: block.type,

    distanceKm: block.distanceKm === null ? "" : String(block.distanceKm),

    durationMinutes: duration === null ? "" : String(Math.floor(duration / 60)),

    durationSeconds: duration === null ? "" : String(duration % 60),

    paceMinutes: pace === null ? "" : String(Math.floor(pace / 60)),

    paceSeconds: pace === null ? "" : String(pace % 60),

    repetitions: String(block.repetitions),

    notes: block.notes ?? "",
  };
}

function blockDraftToInput(block: BlockDraft): RunningWorkoutBlockInput {
  return {
    type: block.type,

    distanceKm: decimalValue(block.distanceKm),

    durationSeconds: secondsFromFields(
      block.durationMinutes,
      block.durationSeconds,
    ),

    targetPaceSecondsPerKm: secondsFromFields(
      block.paceMinutes,
      block.paceSeconds,
    ),

    repetitions: Math.max(1, Number(block.repetitions || 1)),

    notes: block.notes.trim() || null,
  };
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "—";
  }

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  const rest = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}min ${pad(rest)}s`;
  }

  if (rest === 0) {
    return `${minutes} min`;
  }

  return `${minutes}:${pad(rest)}`;
}

function formatPace(seconds: number | null) {
  if (seconds === null || seconds <= 0) {
    return "—";
  }

  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}/km`;
}

function formatBlock(block: RunningWorkoutBlock) {
  const details: string[] = [];

  if (block.distanceKm !== null) {
    details.push(`${block.distanceKm} km`);
  }

  if (block.durationSeconds !== null) {
    details.push(formatDuration(block.durationSeconds));
  }

  if (block.targetPaceSecondsPerKm !== null) {
    details.push(`@ ${formatPace(block.targetPaceSecondsPerKm)}`);
  }

  let result = details.join(" · ");

  if (block.repetitions > 1) {
    result = `${block.repetitions}× ` + result;
  }

  return result || "Sem detalhes";
}

function activityDurationSeconds(form: ActivityForm) {
  return (
    Number(form.durationHours || 0) * 3600 +
    Number(form.durationMinutes || 0) * 60 +
    Number(form.durationSeconds || 0)
  );
}

function activityToForm(activity: RunningActivity): ActivityForm {
  const hours = Math.floor(activity.durationSeconds / 3600);

  const minutes = Math.floor((activity.durationSeconds % 3600) / 60);

  const seconds = activity.durationSeconds % 60;

  return {
    activityDate: activity.activityDate.slice(0, 10),

    distanceKm: String(activity.distanceKm),

    durationHours: hours ? String(hours) : "",

    durationMinutes: String(minutes),

    durationSeconds: seconds ? String(seconds) : "",

    averageHeartRate:
      activity.averageHeartRate === null
        ? ""
        : String(activity.averageHeartRate),

    rpe: activity.rpe === null ? "" : String(activity.rpe),

    notes: activity.notes ?? "",
  };
}

function PaceChart({ activities }: { activities: RunningActivity[] }) {
  const data = [...activities]
    .sort((a, b) => a.activityDate.localeCompare(b.activityDate))
    .slice(-12);

  if (data.length < 2) {
    return (
      <div className="rounded-xl border border-border p-5 text-sm text-muted">
        Registre pelo menos duas corridas para visualizar a evolução do pace.
      </div>
    );
  }

  const width = 720;
  const height = 230;
  const paddingX = 42;
  const paddingY = 30;

  const values = data.map((item) => item.averagePaceSecondsPerKm);

  const min = Math.min(...values);

  const max = Math.max(...values);

  const range = max - min || 1;

  const chartWidth = width - paddingX * 2;

  const chartHeight = height - paddingY * 2;

  const points = data.map((activity, index) => ({
    ...activity,

    x: paddingX + (index / (data.length - 1)) * chartWidth,

    y:
      paddingY +
      ((activity.averagePaceSecondsPerKm - min) / range) * chartHeight,
  }));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] w-full">
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} r="5" fill="currentColor" />

            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              fill="currentColor"
              fontSize="11"
            >
              {formatPace(point.averagePaceSecondsPerKm).replace("/km", "")}
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-2 text-xs text-muted">
        Últimas 12 corridas. Quanto menor o pace, mais rápida foi a corrida.
      </p>
    </div>
  );
}

export default function RunningPage() {
  const [workouts, setWorkouts] = useState<RunningWorkout[]>([]);

  const [activities, setActivities] = useState<RunningActivity[]>([]);

  const [workoutForm, setWorkoutForm] =
    useState<WorkoutForm>(emptyWorkoutForm());

  const [activityForm, setActivityForm] =
    useState<ActivityForm>(emptyActivityForm());

  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);

  const [editingActivityId, setEditingActivityId] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [savingWorkout, setSavingWorkout] = useState(false);

  const [savingActivity, setSavingActivity] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const [workoutData, activityData] = await Promise.all([
          runningService.getAll(),
          runningService.getActivities(),
        ]);

        setWorkouts(workoutData);

        setActivities(activityData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar corrida.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const activitySummary = useMemo(() => {
    const distance = activities.reduce(
      (total, item) => total + item.distanceKm,
      0,
    );

    const duration = activities.reduce(
      (total, item) => total + item.durationSeconds,
      0,
    );

    const averagePace = distance > 0 ? Math.round(duration / distance) : null;

    const bestPace = activities.length
      ? Math.min(...activities.map((item) => item.averagePaceSecondsPerKm))
      : null;

    return {
      count: activities.length,
      distance,
      averagePace,
      bestPace,
    };
  }, [activities]);

  const orderedActivities = useMemo(
    () =>
      [...activities].sort(
        (a, b) => b.activityDate.localeCompare(a.activityDate) || b.id - a.id,
      ),
    [activities],
  );

  function resetWorkoutForm() {
    setEditingWorkoutId(null);

    setWorkoutForm(emptyWorkoutForm());
  }

  function resetActivityForm() {
    setEditingActivityId(null);

    setActivityForm(emptyActivityForm());
  }

  function startEditWorkout(workout: RunningWorkout) {
    setEditingWorkoutId(workout.id);

    setWorkoutForm({
      name: workout.name,
      notes: workout.notes ?? "",

      blocks: [...workout.blocks]
        .sort((a, b) => a.sequence - b.sequence)
        .map(blockToDraft),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateBlock(index: number, patch: Partial<BlockDraft>) {
    setWorkoutForm((current) => ({
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
    setWorkoutForm((current) => ({
      ...current,

      blocks: [...current.blocks, emptyBlock()],
    }));
  }

  function removeBlock(index: number) {
    setWorkoutForm((current) => ({
      ...current,

      blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setWorkoutForm((current) => {
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

  async function handleWorkoutSubmit(event: FormEvent) {
    event.preventDefault();

    setError(null);

    if (!workoutForm.name.trim()) {
      setError("Informe o nome do treino.");
      return;
    }

    if (workoutForm.blocks.length === 0) {
      setError("Adicione pelo menos um bloco.");
      return;
    }

    const blocks = workoutForm.blocks.map(blockDraftToInput);

    if (
      blocks.some(
        (block) => block.distanceKm === null && block.durationSeconds === null,
      )
    ) {
      setError("Cada bloco precisa ter distância ou duração.");
      return;
    }

    const input: RunningWorkoutInput = {
      name: workoutForm.name.trim(),

      notes: workoutForm.notes.trim() || null,

      blocks,
    };

    try {
      setSavingWorkout(true);

      if (editingWorkoutId === null) {
        const created = await runningService.create(input);

        setWorkouts((current) => [...current, created]);
      } else {
        const updated = await runningService.update(editingWorkoutId, input);

        setWorkouts((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }

      resetWorkoutForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o treino.",
      );
    } finally {
      setSavingWorkout(false);
    }
  }

  async function deleteWorkout(workout: RunningWorkout) {
    if (!window.confirm(`Excluir "${workout.name}"?`)) {
      return;
    }

    try {
      await runningService.remove(workout.id);

      setWorkouts((current) =>
        current.filter((item) => item.id !== workout.id),
      );

      if (editingWorkoutId === workout.id) {
        resetWorkoutForm();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o treino.",
      );
    }
  }

  function startEditActivity(activity: RunningActivity) {
    if (activity.source !== 0) {
      return;
    }

    setEditingActivityId(activity.id);

    setActivityForm(activityToForm(activity));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleActivitySubmit(event: FormEvent) {
    event.preventDefault();

    setError(null);

    const distance = decimalValue(activityForm.distanceKm);

    const duration = activityDurationSeconds(activityForm);

    const heartRate = activityForm.averageHeartRate.trim()
      ? Number(activityForm.averageHeartRate)
      : null;

    const rpe = decimalValue(activityForm.rpe);

    if (!activityForm.activityDate) {
      setError("Informe a data.");
      return;
    }

    if (activityForm.activityDate > todayKey()) {
      setError("A data não pode estar no futuro.");
      return;
    }

    if (distance === null || distance <= 0) {
      setError("Informe uma distância válida.");
      return;
    }

    if (duration <= 0) {
      setError("Informe a duração.");
      return;
    }

    if (heartRate !== null && (heartRate < 30 || heartRate > 250)) {
      setError("FC média deve estar entre 30 e 250 bpm.");
      return;
    }

    if (rpe !== null && (rpe < 1 || rpe > 10)) {
      setError("RPE deve estar entre 1 e 10.");
      return;
    }

    const input: RunningActivityInput = {
      activityDate: activityForm.activityDate,

      distanceKm: distance,

      durationSeconds: duration,

      averageHeartRate: heartRate,

      rpe,

      notes: activityForm.notes.trim() || null,
    };

    try {
      setSavingActivity(true);

      if (editingActivityId === null) {
        const created = await runningService.createActivity(input);

        setActivities((current) => [created, ...current]);
      } else {
        const updated = await runningService.updateActivity(
          editingActivityId,
          input,
        );

        setActivities((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }

      resetActivityForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a corrida.",
      );
    } finally {
      setSavingActivity(false);
    }
  }

  async function deleteActivity(activity: RunningActivity) {
    if (activity.source !== 0 || !window.confirm("Excluir esta corrida?")) {
      return;
    }

    try {
      await runningService.removeActivity(activity.id);

      setActivities((current) =>
        current.filter((item) => item.id !== activity.id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir a corrida.",
      );
    }
  }

  if (loading) {
    return (
      <div className="dash-panel text-sm text-muted">Carregando corrida...</div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="dash-eyebrow">Corrida</p>

        <h1 className="mt-2 text-3xl font-semibold">Treinos e atividades</h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Crie seus modelos de treino de corrida e registre as atividades
          realizadas. A organização por dia é feita em Minha Semana.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-border p-4 text-sm">
          {error}
        </div>
      )}

      <section className="dash-panel">
        <p className="dash-eyebrow">Biblioteca</p>

        <h2 className="mt-2 text-xl font-semibold">
          {editingWorkoutId === null
            ? "Criar treino de corrida"
            : "Editar treino de corrida"}
        </h2>

        <form onSubmit={handleWorkoutSubmit} className="mt-6 space-y-5">
          <label className="block text-sm">
            <span className="font-medium">Nome</span>

            <input
              value={workoutForm.name}
              onChange={(event) =>
                setWorkoutForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Ex.: Intervalado 5x4 min"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium">Observações</span>

            <textarea
              rows={2}
              value={workoutForm.notes}
              onChange={(event) =>
                setWorkoutForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Blocos</h3>

            <button
              type="button"
              onClick={addBlock}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              + Bloco
            </button>
          </div>

          <div className="space-y-4">
            {workoutForm.blocks.map((block, index) => (
              <div key={index} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong>Bloco {index + 1}</strong>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlock(index, -1)}
                      className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-30"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      disabled={index === workoutForm.blocks.length - 1}
                      onClick={() => moveBlock(index, 1)}
                      className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-30"
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

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="text-sm">
                    Tipo
                    <select
                      value={block.type}
                      onChange={(event) =>
                        updateBlock(index, {
                          type: Number(
                            event.target.value,
                          ) as RunningWorkoutBlockType,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
                    >
                      {Object.entries(blockTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm">
                    Distância (km)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={block.distanceKm}
                      onChange={(event) =>
                        updateBlock(index, {
                          distanceKm: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  </label>

                  <label className="text-sm">
                    Repetições
                    <input
                      type="number"
                      min="1"
                      value={block.repetitions}
                      onChange={(event) =>
                        updateBlock(index, {
                          repetitions: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm">Duração</p>

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
                        className="rounded-xl border border-border bg-background px-4 py-3"
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
                        className="rounded-xl border border-border bg-background px-4 py-3"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm">Pace alvo</p>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={block.paceMinutes}
                        onChange={(event) =>
                          updateBlock(index, {
                            paceMinutes: event.target.value,
                          })
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3"
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
                        className="rounded-xl border border-border bg-background px-4 py-3"
                      />
                    </div>
                  </div>
                </div>

                <input
                  value={block.notes}
                  onChange={(event) =>
                    updateBlock(index, {
                      notes: event.target.value,
                    })
                  }
                  placeholder="Observação do bloco"
                  className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              disabled={savingWorkout}
              className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
            >
              {savingWorkout
                ? "Salvando..."
                : editingWorkoutId === null
                  ? "Criar treino"
                  : "Salvar alterações"}
            </button>

            {editingWorkoutId !== null && (
              <button
                type="button"
                onClick={resetWorkoutForm}
                className="rounded-xl border border-border px-5 py-3"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <p className="dash-eyebrow">Seus modelos</p>

        <h2 className="mt-2 text-xl font-semibold">Treinos de corrida</h2>

        {!workouts.length ? (
          <div className="dash-panel mt-4 text-sm text-muted">
            Nenhum treino de corrida criado.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {[...workouts]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((workout) => (
                <div key={workout.id} className="dash-panel">
                  <h3 className="text-lg font-semibold">{workout.name}</h3>

                  {workout.notes && (
                    <p className="mt-2 text-sm text-muted">{workout.notes}</p>
                  )}

                  <div className="mt-4 space-y-3">
                    {[...workout.blocks]
                      .sort((a, b) => a.sequence - b.sequence)
                      .map((block) => (
                        <div
                          key={block.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <p className="text-sm font-medium">
                            {blockTypeLabels[block.type]}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {formatBlock(block)}
                          </p>
                        </div>
                      ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => startEditWorkout(workout)}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => void deleteWorkout(workout)}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="dash-panel">
        <p className="dash-eyebrow">Atividade realizada</p>

        <h2 className="mt-2 text-xl font-semibold">
          {editingActivityId === null ? "Registrar corrida" : "Editar corrida"}
        </h2>

        <form onSubmit={handleActivitySubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              Data
              <input
                type="date"
                max={todayKey()}
                value={activityForm.activityDate}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    activityDate: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>

            <label className="text-sm">
              Distância (km)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={activityForm.distanceKm}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    distanceKm: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>

            <label className="text-sm">
              FC média
              <input
                type="number"
                value={activityForm.averageHeartRate}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    averageHeartRate: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>
          </div>

          <div>
            <p className="text-sm">Duração</p>

            <div className="mt-2 grid max-w-xl grid-cols-3 gap-2">
              <input
                type="number"
                min="0"
                placeholder="Horas"
                value={activityForm.durationHours}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    durationHours: event.target.value,
                  }))
                }
                className="rounded-xl border border-border bg-background px-4 py-3"
              />

              <input
                type="number"
                min="0"
                max="59"
                placeholder="Min"
                value={activityForm.durationMinutes}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
                className="rounded-xl border border-border bg-background px-4 py-3"
              />

              <input
                type="number"
                min="0"
                max="59"
                placeholder="Seg"
                value={activityForm.durationSeconds}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    durationSeconds: event.target.value,
                  }))
                }
                className="rounded-xl border border-border bg-background px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              RPE
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={activityForm.rpe}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    rpe: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>

            <label className="text-sm">
              Observações
              <input
                value={activityForm.notes}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              disabled={savingActivity}
              className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
            >
              {savingActivity
                ? "Salvando..."
                : editingActivityId === null
                  ? "Registrar corrida"
                  : "Salvar alterações"}
            </button>

            {editingActivityId !== null && (
              <button
                type="button"
                onClick={resetActivityForm}
                className="rounded-xl border border-border px-5 py-3"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="dash-panel">
          <p className="text-sm text-muted">Corridas</p>

          <p className="mt-3 text-3xl font-semibold">{activitySummary.count}</p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Distância</p>

          <p className="mt-3 text-3xl font-semibold">
            {activitySummary.distance.toLocaleString("pt-BR", {
              maximumFractionDigits: 2,
            })}{" "}
            km
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Pace médio</p>

          <p className="mt-3 text-3xl font-semibold">
            {formatPace(activitySummary.averagePace)}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Melhor pace</p>

          <p className="mt-3 text-3xl font-semibold">
            {formatPace(activitySummary.bestPace)}
          </p>
        </div>
      </section>

      <section className="dash-panel">
        <p className="dash-eyebrow">Evolução</p>

        <h2 className="mt-2 text-xl font-semibold">Pace por corrida</h2>

        <div className="mt-6">
          <PaceChart activities={activities} />
        </div>
      </section>

      <section className="dash-panel">
        <p className="dash-eyebrow">Histórico</p>

        <h2 className="mt-2 text-xl font-semibold">Corridas realizadas</h2>

        {!orderedActivities.length ? (
          <p className="mt-4 text-sm text-muted">Nenhuma corrida registrada.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {orderedActivities.map((activity) => (
              <div key={activity.id} className="py-5">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {activity.distanceKm.toLocaleString("pt-BR")} km
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {formatFullDate(activity.activityDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPace(activity.averagePaceSecondsPerKm)}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      {formatDuration(activity.durationSeconds)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 text-sm text-muted">
                  FC média: {activity.averageHeartRate ?? "—"} · RPE:{" "}
                  {activity.rpe ?? "—"}
                </div>

                {activity.notes && (
                  <p className="mt-2 text-sm text-muted">{activity.notes}</p>
                )}

                {activity.source === 0 && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => startEditActivity(activity)}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => void deleteActivity(activity)}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
