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
  scheduledDate: string;
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

function emptyWorkoutForm(scheduledDate = todayKey()): WorkoutForm {
  return {
    name: "",
    scheduledDate,
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

function activityDurationSeconds(form: ActivityForm) {
  const hours = Number(form.durationHours || 0);

  const minutes = Number(form.durationMinutes || 0);

  const seconds = Number(form.durationSeconds || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

function blockDraftToInput(block: BlockDraft): RunningWorkoutBlockInput {
  const distance = decimalValue(block.distanceKm);

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
  if (seconds === null) {
    return null;
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

  if (block.targetPaceSecondsPerKm !== null) {
    details.push(`@ ${formatPace(block.targetPaceSecondsPerKm)}`);
  }

  let text = details.join(" · ");

  if (block.repetitions > 1) {
    text = `${block.repetitions}× ` + text;
  }

  return text || "Bloco sem detalhes";
}

function activityToForm(activity: RunningActivity): ActivityForm {
  const hours = Math.floor(activity.durationSeconds / 3600);

  const minutes = Math.floor((activity.durationSeconds % 3600) / 60);

  const seconds = activity.durationSeconds % 60;

  return {
    activityDate: activity.activityDate.slice(0, 10),

    distanceKm: String(activity.distanceKm),

    durationHours: hours > 0 ? String(hours) : "",

    durationMinutes: String(minutes),

    durationSeconds: seconds > 0 ? String(seconds) : "",

    averageHeartRate:
      activity.averageHeartRate === null
        ? ""
        : String(activity.averageHeartRate),

    rpe: activity.rpe === null ? "" : String(activity.rpe),

    notes: activity.notes ?? "",
  };
}

function PaceChart({ activities }: { activities: RunningActivity[] }) {
  const pointsData = [...activities]
    .sort((a, b) => a.activityDate.localeCompare(b.activityDate))
    .slice(-12);

  if (pointsData.length < 2) {
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

  const values = pointsData.map((activity) => activity.averagePaceSecondsPerKm);

  const min = Math.min(...values);

  const max = Math.max(...values);

  const range = max - min === 0 ? 1 : max - min;

  const drawableWidth = width - paddingX * 2;

  const drawableHeight = height - paddingY * 2;

  const chartPoints = pointsData.map((activity, index) => {
    const x = paddingX + (index / (pointsData.length - 1)) * drawableWidth;

    // Pace menor = mais rápido.
    // Por isso o melhor pace aparece mais alto no gráfico.
    const y =
      paddingY +
      ((activity.averagePaceSecondsPerKm - min) / range) * drawableHeight;

    return {
      ...activity,
      x,
      y,
    };
  });

  const polyline = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[620px] w-full"
        role="img"
        aria-label="Evolução do pace"
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

        {chartPoints.map((point) => (
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

            <text
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              fill="currentColor"
              fontSize="10"
              opacity="0.65"
            >
              {formatFullDate(point.activityDate).slice(0, 5)}
            </text>
          </g>
        ))}
      </svg>

      <p className="mt-2 text-xs text-muted">
        Últimas 12 corridas. Pace menor significa maior velocidade.
      </p>
    </div>
  );
}

export default function RunningPage() {
  const [workouts, setWorkouts] = useState<RunningWorkout[]>([]);

  const [activities, setActivities] = useState<RunningActivity[]>([]);

  const [loading, setLoading] = useState(true);

  const [savingWorkout, setSavingWorkout] = useState(false);

  const [savingActivity, setSavingActivity] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);

  const [editingActivityId, setEditingActivityId] = useState<number | null>(
    null,
  );

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));

  const [workoutForm, setWorkoutForm] =
    useState<WorkoutForm>(emptyWorkoutForm());

  const [activityForm, setActivityForm] =
    useState<ActivityForm>(emptyActivityForm());

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [workoutsData, activitiesData] = await Promise.all([
          runningService.getAll(),
          runningService.getActivities(),
        ]);

        setWorkouts(workoutsData);

        setActivities(activitiesData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o módulo de corrida.",
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

  const activitySummary = useMemo(() => {
    const distance = activities.reduce(
      (total, activity) => total + activity.distanceKm,
      0,
    );

    const duration = activities.reduce(
      (total, activity) => total + activity.durationSeconds,
      0,
    );

    const averagePace = distance > 0 ? Math.round(duration / distance) : null;

    const bestPace = activities.length
      ? Math.min(
          ...activities.map((activity) => activity.averagePaceSecondsPerKm),
        )
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

  function resetWorkoutForm(date = todayKey()) {
    setEditingWorkoutId(null);

    setWorkoutForm(emptyWorkoutForm(date));

    setError(null);
  }

  function resetActivityForm() {
    setEditingActivityId(null);

    setActivityForm(emptyActivityForm());

    setError(null);
  }

  function startCreateWorkout(date: string) {
    resetWorkoutForm(date);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEditWorkout(workout: RunningWorkout) {
    setEditingWorkoutId(workout.id);

    setWorkoutForm({
      name: workout.name,

      scheduledDate: workout.scheduledDate.slice(0, 10),

      notes: workout.notes ?? "",

      blocks: [...workout.blocks]
        .sort((a, b) => a.sequence - b.sequence)
        .map(blockToDraft),
    });

    setError(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEditActivity(activity: RunningActivity) {
    if (activity.source !== 0) {
      return;
    }

    setEditingActivityId(activity.id);

    setActivityForm(activityToForm(activity));

    setError(null);

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
      setError("Informe um nome para o treino.");
      return;
    }

    if (!workoutForm.scheduledDate) {
      setError("Informe a data do treino.");
      return;
    }

    if (workoutForm.blocks.length === 0) {
      setError("Adicione pelo menos um bloco ao treino.");
      return;
    }

    const blocks = workoutForm.blocks.map(blockDraftToInput);

    const invalidBlock = blocks.some(
      (block) => block.distanceKm === null && block.durationSeconds === null,
    );

    if (invalidBlock) {
      setError("Cada bloco precisa ter uma distância ou duração.");
      return;
    }

    const input: RunningWorkoutInput = {
      name: workoutForm.name.trim(),

      scheduledDate: workoutForm.scheduledDate,

      notes: workoutForm.notes.trim() || null,

      blocks,
    };

    try {
      setSavingWorkout(true);

      if (editingWorkoutId !== null) {
        const updated = await runningService.update(editingWorkoutId, input);

        setWorkouts((current) =>
          current.map((workout) =>
            workout.id === updated.id ? updated : workout,
          ),
        );
      } else {
        const created = await runningService.create(input);

        setWorkouts((current) => [...current, created]);
      }

      resetWorkoutForm(workoutForm.scheduledDate);
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

  async function handleActivitySubmit(event: FormEvent) {
    event.preventDefault();

    setError(null);

    const distance = decimalValue(activityForm.distanceKm);

    const duration = activityDurationSeconds(activityForm);

    const averageHeartRate = activityForm.averageHeartRate.trim()
      ? Number(activityForm.averageHeartRate)
      : null;

    const rpe = decimalValue(activityForm.rpe);

    if (!activityForm.activityDate) {
      setError("Informe a data da corrida.");
      return;
    }

    if (activityForm.activityDate > todayKey()) {
      setError("A data da corrida não pode estar no futuro.");
      return;
    }

    if (distance === null || distance <= 0) {
      setError("Informe uma distância válida.");
      return;
    }

    if (duration <= 0) {
      setError("Informe a duração da corrida.");
      return;
    }

    if (
      averageHeartRate !== null &&
      (averageHeartRate < 30 || averageHeartRate > 250)
    ) {
      setError("A frequência cardíaca média deve estar entre 30 e 250 bpm.");
      return;
    }

    if (rpe !== null && (rpe < 1 || rpe > 10)) {
      setError("O RPE deve estar entre 1 e 10.");
      return;
    }

    const input: RunningActivityInput = {
      activityDate: activityForm.activityDate,

      distanceKm: distance,

      durationSeconds: duration,

      averageHeartRate,

      rpe,

      notes: activityForm.notes.trim() || null,
    };

    try {
      setSavingActivity(true);

      if (editingActivityId !== null) {
        const updated = await runningService.updateActivity(
          editingActivityId,
          input,
        );

        setActivities((current) =>
          current.map((activity) =>
            activity.id === updated.id ? updated : activity,
          ),
        );
      } else {
        const created = await runningService.createActivity(input);

        setActivities((current) => [created, ...current]);
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

  async function deleteWorkout(workout: RunningWorkout) {
    const confirmed = window.confirm(`Excluir "${workout.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

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

  async function deleteActivity(activity: RunningActivity) {
    if (activity.source !== 0) {
      return;
    }

    const confirmed = window.confirm(
      `Excluir a corrida de ${formatFullDate(activity.activityDate)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await runningService.removeActivity(activity.id);

      setActivities((current) =>
        current.filter((item) => item.id !== activity.id),
      );

      if (editingActivityId === activity.id) {
        resetActivityForm();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir a corrida.",
      );
    }
  }

  const weekEnd = weekDays[6];

  if (loading) {
    return (
      <div className="dash-panel text-sm text-muted">
        Carregando módulo de corrida...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="dash-eyebrow">Corrida</p>

        <h1 className="mt-2 text-3xl font-semibold">Corrida e evolução</h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          Planeje seus treinos, registre suas corridas e acompanhe sua evolução.
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
            <p className="dash-eyebrow">Registro</p>

            <h2 className="mt-2 text-xl font-semibold">
              {editingActivityId === null
                ? "Registrar corrida"
                : "Editar corrida"}
            </h2>
          </div>

          {editingActivityId !== null && (
            <button
              type="button"
              onClick={resetActivityForm}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={handleActivitySubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium">Data</span>

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
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Distância (km)</span>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={activityForm.distanceKm}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    distanceKm: event.target.value,
                  }))
                }
                placeholder="Ex.: 5"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">FC média</span>

              <input
                type="number"
                min="30"
                max="250"
                value={activityForm.averageHeartRate}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    averageHeartRate: event.target.value,
                  }))
                }
                placeholder="Ex.: 158"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium">Duração</p>

            <div className="mt-2 grid grid-cols-3 gap-2 md:max-w-xl">
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
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
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
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
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
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">RPE</span>

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
                placeholder="1 a 10"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Observações</span>

              <input
                value={activityForm.notes}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Opcional"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={savingActivity}
            className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
          >
            {savingActivity
              ? "Salvando..."
              : editingActivityId === null
                ? "Registrar corrida"
                : "Salvar alterações"}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4">
          <p className="dash-eyebrow">Histórico</p>

          <h2 className="mt-2 text-xl font-semibold">Corrida em números</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="dash-panel">
            <p className="text-sm text-muted">Corridas</p>

            <p className="mt-4 text-3xl font-semibold">
              {activitySummary.count}
            </p>
          </div>

          <div className="dash-panel">
            <p className="text-sm text-muted">Distância total</p>

            <p className="mt-4 text-3xl font-semibold">
              {activitySummary.distance.toLocaleString("pt-BR", {
                maximumFractionDigits: 2,
              })}{" "}
              km
            </p>
          </div>

          <div className="dash-panel">
            <p className="text-sm text-muted">Pace médio</p>

            <p className="mt-4 text-3xl font-semibold">
              {formatPace(activitySummary.averagePace)}
            </p>
          </div>

          <div className="dash-panel">
            <p className="text-sm text-muted">Melhor pace</p>

            <p className="mt-4 text-3xl font-semibold">
              {formatPace(activitySummary.bestPace)}
            </p>
          </div>
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
        <div>
          <p className="dash-eyebrow">Atividades</p>

          <h2 className="mt-2 text-xl font-semibold">Histórico de corridas</h2>
        </div>

        {!orderedActivities.length ? (
          <div className="mt-5 text-sm text-muted">
            Nenhuma corrida registrada ainda.
          </div>
        ) : (
          <div className="mt-5 divide-y divide-border">
            {orderedActivities.map((activity) => (
              <div key={activity.id} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {activity.distanceKm.toLocaleString("pt-BR", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        km
                      </p>

                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                        {activity.source === 0 ? "Manual" : "Strava"}
                      </span>
                    </div>

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

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted">FC média</p>

                    <p className="mt-1 font-medium">
                      {activity.averageHeartRate === null
                        ? "—"
                        : `${activity.averageHeartRate} bpm`}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted">RPE</p>

                    <p className="mt-1 font-medium">
                      {activity.rpe === null ? "—" : `${activity.rpe}/10`}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted">Pace</p>

                    <p className="mt-1 font-medium">
                      {formatPace(activity.averagePaceSecondsPerKm)}
                    </p>
                  </div>
                </div>

                {activity.notes && (
                  <p className="mt-4 text-sm text-muted">{activity.notes}</p>
                )}

                {activity.source === 0 && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditActivity(activity)}
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
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

      <section className="dash-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="dash-eyebrow">Planejamento</p>

            <h2 className="mt-2 text-xl font-semibold">
              {editingWorkoutId === null ? "Montar treino" : "Atualizar treino"}
            </h2>
          </div>

          {editingWorkoutId !== null && (
            <button
              type="button"
              onClick={() => resetWorkoutForm()}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={handleWorkoutSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Nome do treino</span>

              <input
                value={workoutForm.name}
                onChange={(event) =>
                  setWorkoutForm((current) => ({
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
                value={workoutForm.scheduledDate}
                onChange={(event) =>
                  setWorkoutForm((current) => ({
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
              value={workoutForm.notes}
              onChange={(event) =>
                setWorkoutForm((current) => ({
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
              {workoutForm.blocks.map((block, index) => (
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
                        disabled={index === workoutForm.blocks.length - 1}
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
            disabled={savingWorkout}
            className="rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
          >
            {savingWorkout
              ? "Salvando..."
              : editingWorkoutId === null
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
                    onClick={() => startCreateWorkout(key)}
                    className="rounded-lg border border-border px-2 py-1 text-xs"
                  >
                    +
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {!dayWorkouts.length ? (
                    <p className="text-xs text-muted">Sem treino planejado.</p>
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
                            onClick={() => startEditWorkout(workout)}
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
      </section>

      {!!workouts.length && (
        <section className="dash-panel">
          <p className="dash-eyebrow">Planejamento</p>

          <h2 className="mt-2 text-xl font-semibold">
            Todos os treinos planejados
          </h2>

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
                    onClick={() => startEditWorkout(workout)}
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
