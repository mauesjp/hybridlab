import { useEffect, useMemo, useState } from "react";

import { hybridWeekService } from "../services/hybridWeekService";

import type {
  HybridSessionType,
  HybridWeekOptions,
  HybridWeekPlan,
  HybridWeekPlanInput,
  TrainingPeriod,
} from "../types/hybridWeek";

const orderedDays = [
  1, // Monday
  2,
  3,
  4,
  5,
  6,
  0, // Sunday
];

const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const shortDayLabels: Record<number, string> = {
  0: "DOM",
  1: "SEG",
  2: "TER",
  3: "QUA",
  4: "QUI",
  5: "SEX",
  6: "SÁB",
};

const periodLabels: Record<TrainingPeriod, string> = {
  0: "Não definido",
  1: "Manhã",
  2: "Tarde",
  3: "Noite",
};

type SessionDraft = {
  key: string;
  sessionType: HybridSessionType;
  period: TrainingPeriod;
  strengthWorkoutDayId: string;
  runningWorkoutId: string;
  notes: string;
};

type WeekDraft = Record<number, SessionDraft[]>;

function generateKey() {
  return `${Date.now()}-${Math.random()}`;
}

function emptyWeek(): WeekDraft {
  return {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };
}

function createSession(
  type: HybridSessionType,
  options: HybridWeekOptions,
): SessionDraft {
  return {
    key: generateKey(),

    sessionType: type,

    period: 0,

    strengthWorkoutDayId:
      type === 0 && options.strengthWorkouts.length
        ? String(options.strengthWorkouts[0].id)
        : "",

    runningWorkoutId:
      type === 1 && options.runningWorkouts.length
        ? String(options.runningWorkouts[0].id)
        : "",

    notes: "",
  };
}

function planToWeek(plan: HybridWeekPlan): WeekDraft {
  const result = emptyWeek();

  const sessions = [...plan.sessions].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.sequence - b.sequence,
  );

  sessions.forEach((session) => {
    result[session.dayOfWeek].push({
      key: generateKey(),

      sessionType: session.sessionType,

      period: session.period,

      strengthWorkoutDayId:
        session.strengthWorkoutDayId === null
          ? ""
          : String(session.strengthWorkoutDayId),

      runningWorkoutId:
        session.runningWorkoutId === null
          ? ""
          : String(session.runningWorkoutId),

      notes: session.notes ?? "",
    });
  });

  return result;
}

export default function HybridWeekPage() {
  const [options, setOptions] = useState<HybridWeekOptions>({
    strengthWorkouts: [],
    runningWorkouts: [],
  });

  const [week, setWeek] = useState<WeekDraft>(emptyWeek());

  const [planId, setPlanId] = useState<number | null>(null);

  const [planName, setPlanName] = useState("Minha semana híbrida");

  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [activating, setActivating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [plans, availableOptions] = await Promise.all([
          hybridWeekService.getAll(),
          hybridWeekService.getOptions(),
        ]);

        setOptions(availableOptions);

        const plan = plans.find((item) => item.isActive) ?? plans[0] ?? null;

        if (plan) {
          setPlanId(plan.id);
          setPlanName(plan.name);
          setIsActive(plan.isActive);
          setWeek(planToWeek(plan));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar sua Semana Híbrida.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const stats = useMemo(() => {
    let totalSessions = 0;
    let strengthSessions = 0;
    let runningSessions = 0;
    let trainingDays = 0;

    orderedDays.forEach((day) => {
      const sessions = week[day];

      if (sessions.length > 0) {
        trainingDays++;
      }

      totalSessions += sessions.length;

      sessions.forEach((session) => {
        if (session.sessionType === 0) {
          strengthSessions++;
        } else {
          runningSessions++;
        }
      });
    });

    return {
      totalSessions,
      strengthSessions,
      runningSessions,
      trainingDays,
      restDays: 7 - trainingDays,
    };
  }, [week]);

  function addSession(day: number, type: HybridSessionType) {
    setError(null);
    setSuccess(null);

    if (type === 0 && options.strengthWorkouts.length === 0) {
      setError(
        "Você ainda não possui treinos de musculação disponíveis no plano ativo.",
      );
      return;
    }

    if (type === 1 && options.runningWorkouts.length === 0) {
      setError("Você ainda não possui treinos de corrida cadastrados.");
      return;
    }

    setWeek((current) => ({
      ...current,

      [day]: [...current[day], createSession(type, options)],
    }));
  }

  function updateSession(
    day: number,
    index: number,
    patch: Partial<SessionDraft>,
  ) {
    setWeek((current) => ({
      ...current,

      [day]: current[day].map((session, sessionIndex) =>
        sessionIndex === index
          ? {
              ...session,
              ...patch,
            }
          : session,
      ),
    }));

    setSuccess(null);
  }

  function removeSession(day: number, index: number) {
    setWeek((current) => ({
      ...current,

      [day]: current[day].filter((_, sessionIndex) => sessionIndex !== index),
    }));

    setSuccess(null);
  }

  function moveSession(day: number, index: number, direction: -1 | 1) {
    setWeek((current) => {
      const sessions = [...current[day]];

      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= sessions.length) {
        return current;
      }

      [sessions[index], sessions[targetIndex]] = [
        sessions[targetIndex],
        sessions[index],
      ];

      return {
        ...current,
        [day]: sessions,
      };
    });

    setSuccess(null);
  }

  async function saveWeek() {
    setError(null);
    setSuccess(null);

    if (!planName.trim()) {
      setError("Informe um nome para a Semana Híbrida.");
      return;
    }

    const sessions = orderedDays.flatMap((day) =>
      week[day].map((session, index) => {
        if (session.sessionType === 0) {
          if (!session.strengthWorkoutDayId) {
            throw new Error(
              `${dayLabels[day]} possui uma sessão de musculação sem treino selecionado.`,
            );
          }

          return {
            dayOfWeek: day,

            sessionType: 0 as const,

            period: session.period,

            sequence: index,

            strengthWorkoutDayId: Number(session.strengthWorkoutDayId),

            runningWorkoutId: null,

            notes: session.notes.trim() || null,
          };
        }

        if (!session.runningWorkoutId) {
          throw new Error(
            `${dayLabels[day]} possui uma sessão de corrida sem treino selecionado.`,
          );
        }

        return {
          dayOfWeek: day,

          sessionType: 1 as const,

          period: session.period,

          sequence: index,

          strengthWorkoutDayId: null,

          runningWorkoutId: Number(session.runningWorkoutId),

          notes: session.notes.trim() || null,
        };
      }),
    );

    const input: HybridWeekPlanInput = {
      name: planName.trim(),

      isActive,

      sessions,
    };

    try {
      setSaving(true);

      const saved =
        planId === null
          ? await hybridWeekService.create(input)
          : await hybridWeekService.update(planId, input);

      setPlanId(saved.id);

      setPlanName(saved.name);

      setIsActive(saved.isActive);

      setWeek(planToWeek(saved));

      setSuccess("Semana Híbrida salva com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar sua Semana Híbrida.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function activatePlan() {
    if (planId === null) {
      setError("Salve a Semana Híbrida antes de ativá-la.");
      return;
    }

    try {
      setActivating(true);
      setError(null);
      setSuccess(null);

      const activated = await hybridWeekService.activate(planId);

      setIsActive(true);

      setWeek(planToWeek(activated));

      setSuccess("Esta agora é sua Semana Híbrida ativa.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível ativar a Semana Híbrida.",
      );
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="dash-panel text-sm text-muted">
        Carregando sua Semana Híbrida...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="dash-eyebrow">Planejamento híbrido</p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold">Minha Semana</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Combine seus treinos de musculação e corrida em uma única rotina
              semanal.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isActive && planId !== null && (
              <button
                type="button"
                disabled={activating}
                onClick={() => void activatePlan()}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {activating ? "Ativando..." : "Tornar ativa"}
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => void saveWeek()}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar semana"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-border p-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-border p-4 text-sm">
          {success}
        </div>
      )}

      <section className="dash-panel">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block text-sm">
            <span className="font-medium">Nome da rotina</span>

            <input
              value={planName}
              maxLength={150}
              onChange={(event) => {
                setPlanName(event.target.value);
                setSuccess(null);
              }}
              placeholder="Ex.: Semana híbrida principal"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            />
          </label>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>

            <div className="mt-2 rounded-full border border-border px-4 py-2 text-sm">
              {isActive ? "Semana ativa" : "Semana inativa"}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="dash-panel">
          <p className="text-sm text-muted">Dias de treino</p>

          <p className="mt-3 text-3xl font-semibold">{stats.trainingDays}</p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Sessões</p>

          <p className="mt-3 text-3xl font-semibold">{stats.totalSessions}</p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Musculação</p>

          <p className="mt-3 text-3xl font-semibold">
            {stats.strengthSessions}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Corrida</p>

          <p className="mt-3 text-3xl font-semibold">{stats.runningSessions}</p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Descanso</p>

          <p className="mt-3 text-3xl font-semibold">{stats.restDays}</p>
        </div>
      </section>

      <section className="space-y-4">
        {orderedDays.map((day) => {
          const sessions = week[day];

          return (
            <article key={day} className="dash-panel">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border text-xs font-semibold">
                    {shortDayLabels[day]}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">{dayLabels[day]}</h2>

                    <p className="mt-1 text-sm text-muted">
                      {sessions.length === 0
                        ? "Dia de descanso"
                        : sessions.length === 1
                          ? "1 sessão planejada"
                          : `${sessions.length} sessões planejadas`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addSession(day, 0)}
                    className="rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    + Musculação
                  </button>

                  <button
                    type="button"
                    onClick={() => addSession(day, 1)}
                    className="rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    + Corrida
                  </button>
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-border p-5">
                  <p className="font-medium">Descanso</p>

                  <p className="mt-1 text-sm text-muted">
                    Nenhum treino planejado para este dia.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {sessions.map((session, index) => (
                    <div
                      key={session.key}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                            {session.sessionType === 0
                              ? "Musculação"
                              : "Corrida"}
                          </span>

                          <span className="text-xs text-muted">
                            Sessão {index + 1}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveSession(day, index, -1)}
                            className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-30"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            disabled={index === sessions.length - 1}
                            onClick={() => moveSession(day, index, 1)}
                            className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-30"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() => removeSession(day, index)}
                            className="rounded-lg border border-border px-3 py-1.5 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <label className="block text-sm">
                          <span className="font-medium">Treino</span>

                          {session.sessionType === 0 ? (
                            <select
                              value={session.strengthWorkoutDayId}
                              onChange={(event) =>
                                updateSession(day, index, {
                                  strengthWorkoutDayId: event.target.value,
                                })
                              }
                              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                            >
                              {options.strengthWorkouts.map((workout) => (
                                <option key={workout.id} value={workout.id}>
                                  {workout.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={session.runningWorkoutId}
                              onChange={(event) =>
                                updateSession(day, index, {
                                  runningWorkoutId: event.target.value,
                                })
                              }
                              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                            >
                              {options.runningWorkouts.map((workout) => (
                                <option key={workout.id} value={workout.id}>
                                  {workout.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </label>

                        <label className="block text-sm">
                          <span className="font-medium">Período</span>

                          <select
                            value={session.period}
                            onChange={(event) =>
                              updateSession(day, index, {
                                period: Number(
                                  event.target.value,
                                ) as TrainingPeriod,
                              })
                            }
                            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
                          >
                            {(
                              Object.entries(periodLabels) as [string, string][]
                            ).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className="mt-4 block text-sm">
                        <span className="font-medium">Observações</span>

                        <input
                          value={session.notes}
                          maxLength={500}
                          onChange={(event) =>
                            updateSession(day, index, {
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
              )}
            </article>
          );
        })}
      </section>

      <section className="dash-panel">
        <h2 className="text-lg font-semibold">Como funciona</h2>

        <p className="mt-2 text-sm leading-6 text-muted">
          Seus treinos continuam sendo criados nos módulos de Musculação e
          Corrida. Aqui você apenas organiza quando cada sessão será realizada.
        </p>

        <p className="mt-2 text-sm leading-6 text-muted">
          Dias sem sessões são considerados automaticamente dias de descanso.
        </p>
      </section>
    </div>
  );
}
