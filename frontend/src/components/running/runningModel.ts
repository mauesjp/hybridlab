import type {
  RunningActivity,
  RunningWorkout,
  RunningWorkoutBlock,
  RunningWorkoutBlockInput,
  RunningWorkoutBlockType,
} from "../../types/running";

export const blockTypeLabels: Record<RunningWorkoutBlockType, string> = {
  0: "Aquecimento",
  1: "Corrida",
  2: "Intervalo",
  3: "Recuperação",
  4: "Desaquecimento",
};

export type BlockDraft = {
  type: RunningWorkoutBlockType;
  distanceKm: string;
  durationMinutes: string;
  durationSeconds: string;
  paceMinutes: string;
  paceSeconds: string;
  repetitions: string;
  notes: string;
};

export type WorkoutForm = {
  name: string;
  notes: string;
  blocks: BlockDraft[];
};

export type ActivityForm = {
  activityDate: string;
  distanceKm: string;
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
  averageHeartRate: string;
  rpe: string;
  notes: string;
};

export function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function todayKey() {
  const date = new Date();

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
}

export function formatFullDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

export function decimalValue(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
}

export function emptyBlock(type: RunningWorkoutBlockType = 1): BlockDraft {
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

export function emptyWorkoutForm(): WorkoutForm {
  return {
    name: "",
    notes: "",
    blocks: [emptyBlock(0), emptyBlock(1), emptyBlock(4)],
  };
}

export function emptyActivityForm(): ActivityForm {
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

export function secondsFromFields(minutes: string, seconds: string) {
  const total = Number(minutes || 0) * 60 + Number(seconds || 0);

  return total > 0 ? total : null;
}

export function blockToDraft(block: RunningWorkoutBlock): BlockDraft {
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

export function blockDraftToInput(block: BlockDraft): RunningWorkoutBlockInput {
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

export function formatDuration(seconds: number | null) {
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

export function formatPace(seconds: number | null) {
  if (seconds === null || seconds <= 0) {
    return "—";
  }

  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}/km`;
}

export function formatBlock(block: RunningWorkoutBlock) {
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

export function activityDurationSeconds(form: ActivityForm) {
  return (
    Number(form.durationHours || 0) * 3600 +
    Number(form.durationMinutes || 0) * 60 +
    Number(form.durationSeconds || 0)
  );
}

export function activityToForm(activity: RunningActivity): ActivityForm {
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


export function workoutTotals(workout: RunningWorkout) {
  let duration = 0, distance = 0;
  let completeDuration = workout.blocks.length > 0, completeDistance = completeDuration;
  for (const block of workout.blocks) {
    const pace = block.targetPaceSecondsPerKm;
    const seconds = block.durationSeconds ?? (block.distanceKm !== null && pace && pace > 0 ? block.distanceKm * pace : null);
    const km = block.distanceKm ?? (block.durationSeconds !== null && pace && pace > 0 ? block.durationSeconds / pace : null);
    if (seconds === null) completeDuration = false;
    else duration += seconds * block.repetitions;
    if (km === null) completeDistance = false;
    else distance += km * block.repetitions;
  }
  const paces = [...new Set(workout.blocks.map(b => b.targetPaceSecondsPerKm).filter((p): p is number => p !== null && p > 0))];
  return { duration: completeDuration ? Math.round(duration) : null, distance: completeDistance ? distance : null, paces };
}

export function parseRunningRoute(route: string) {
  if (route === '#/corrida') return { view: 'overview' as const, id: null };
  if (route === '#/corrida/criar') return { view: 'workout-form' as const, id: null };
  if (route === '#/corrida/registrar') return { view: 'activity-form' as const, id: null };
  if (route === '#/corrida/historico') return { view: 'history' as const, id: null };
  const match = /^#\/corrida\/(treino|atividade)\/([1-9]\d*)(\/editar)?$/.exec(route);
  if (!match) return { view: 'missing' as const, id: null };
  return { view: match[1] === 'treino' ? (match[3] ? 'workout-form' as const : 'workout' as const) : (match[3] ? 'activity-form' as const : 'activity' as const), id: Number(match[2]) };
}
