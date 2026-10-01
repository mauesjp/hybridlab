import { useEffect, useMemo, useState } from "react";

import { hybridWeekService } from "../services/hybridWeekService";

import type {
  HybridSessionType,
  HybridTrainingPlan,
  HybridTrainingPlanInput,
  HybridWeekOptions,
  TrainingPeriod,
} from "../types/hybridWeek";

const orderedDays = [1, 2, 3, 4, 5, 6, 0];

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

type WeekSessions = Record<number, SessionDraft[]>;

type WeekDraft = {
  key: string;
  weekNumber: number;
  name: string;
  notes: string;
  sessions: WeekSessions;
};

function generateKey() {
  return `${Date.now()}-${Math.random()}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
}

function currentMondayKey() {
  const date = new Date();

  const day = date.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + difference);

  return dateKey(date);
}

function emptySessions(): WeekSessions {
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

function emptyWeek(weekNumber: number): WeekDraft {
  return {
    key: generateKey(),
    weekNumber,
    name: "",
    notes: "",
    sessions: emptySessions(),
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

function planToWeeks(plan: HybridTrainingPlan): WeekDraft[] {
  return [...plan.weeks]
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((week) => {
      const sessions = emptySessions();

      [...week.sessions]
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.sequence - b.sequence)
        .forEach((session) => {
          sessions[session.dayOfWeek].push({
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

      return {
        key: generateKey(),

        weekNumber: week.weekNumber,

        name: week.name ?? "",

        notes: week.notes ?? "",

        sessions,
      };
    });
}

function cloneSessions(source: WeekSessions): WeekSessions {
  const result = emptySessions();

  orderedDays.forEach((day) => {
    result[day] = source[day].map((session) => ({
      ...session,
      key: generateKey(),
    }));
  });

  return result;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function isMonday(value: string) {
  if (!value) {
    return false;
  }

  return parseDateKey(value).getDay() === 1;
}

export default function HybridWeekPage() {
  const [plans, setPlans] = useState<HybridTrainingPlan[]>([]);

  const [options, setOptions] = useState<HybridWeekOptions>({
    strengthWorkouts: [],
    runningWorkouts: [],
  });

  const [planId, setPlanId] = useState<number | null>(null);

  const [planName, setPlanName] = useState("Meu planejamento híbrido");

  const [startDate, setStartDate] = useState(currentMondayKey());

  const [isActive, setIsActive] = useState(true);

  const [weeks, setWeeks] = useState<WeekDraft[]>([emptyWeek(1)]);

  const [selectedWeekNumber, setSelectedWeekNumber] = useState(1);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [activating, setActivating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const selectedWeek =
    weeks.find((week) => week.weekNumber === selectedWeekNumber) ?? weeks[0];

  function applyPlan(plan: HybridTrainingPlan) {
    const mappedWeeks = planToWeeks(plan);

    setPlanId(plan.id);

    setPlanName(plan.name);

    setStartDate(plan.startDate.slice(0, 10));

    setIsActive(plan.isActive);

    setWeeks(mappedWeeks.length ? mappedWeeks : [emptyWeek(1)]);

    const today = dateKey(new Date());

    const current = plan.weeks.find(
      (week) =>
        today >= week.startDate.slice(0, 10) &&
        today <= week.endDate.slice(0, 10),
    );

    setSelectedWeekNumber(current?.weekNumber ?? 1);

    setError(null);
    setSuccess(null);
  }

  function startNewPlan() {
    setPlanId(null);

    setPlanName("Meu planejamento híbrido");

    setStartDate(currentMondayKey());

    setIsActive(true);

    setWeeks([emptyWeek(1)]);

    setSelectedWeekNumber(1);

    setError(null);
    setSuccess(null);
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [planData, availableOptions] = await Promise.all([
          hybridWeekService.getAll(),
          hybridWeekService.getOptions(),
        ]);

        setPlans(planData);

        setOptions(availableOptions);

        const selected =
          planData.find((plan) => plan.isActive) ?? planData[0] ?? null;

        if (selected) {
          applyPlan(selected);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar seu planejamento híbrido.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const selectedWeekStats = useMemo(() => {
    if (!selectedWeek) {
      return {
        trainingDays: 0,
        restDays: 7,
        totalSessions: 0,
        strengthSessions: 0,
        runningSessions: 0,
      };
    }

    let trainingDays = 0;
    let totalSessions = 0;
    let strengthSessions = 0;
    let runningSessions = 0;

    orderedDays.forEach((day) => {
      const sessions = selectedWeek.sessions[day];

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
      trainingDays,

      restDays: 7 - trainingDays,

      totalSessions,

      strengthSessions,

      runningSessions,
    };
  }, [selectedWeek]);

  const selectedWeekDates = useMemo(() => {
    if (!startDate || !selectedWeek) {
      return null;
    }

    const planStart = parseDateKey(startDate);

    const weekStart = addDays(planStart, (selectedWeek.weekNumber - 1) * 7);

    return {
      start: weekStart,
      end: addDays(weekStart, 6),
    };
  }, [startDate, selectedWeek]);

  const planEndDate = useMemo(() => {
    if (!startDate || weeks.length === 0) {
      return null;
    }

    return addDays(parseDateKey(startDate), weeks.length * 7 - 1);
  }, [startDate, weeks.length]);

  function updateSelectedWeek(updater: (week: WeekDraft) => WeekDraft) {
    setWeeks((current) =>
      current.map((week) =>
        week.weekNumber === selectedWeekNumber ? updater(week) : week,
      ),
    );

    setSuccess(null);
  }

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

    updateSelectedWeek((week) => ({
      ...week,

      sessions: {
        ...week.sessions,

        [day]: [...week.sessions[day], createSession(type, options)],
      },
    }));
  }

  function updateSession(
    day: number,
    index: number,
    patch: Partial<SessionDraft>,
  ) {
    updateSelectedWeek((week) => ({
      ...week,

      sessions: {
        ...week.sessions,

        [day]: week.sessions[day].map((session, sessionIndex) =>
          sessionIndex === index
            ? {
                ...session,
                ...patch,
              }
            : session,
        ),
      },
    }));
  }

  function removeSession(day: number, index: number) {
    updateSelectedWeek((week) => ({
      ...week,

      sessions: {
        ...week.sessions,

        [day]: week.sessions[day].filter(
          (_, sessionIndex) => sessionIndex !== index,
        ),
      },
    }));
  }

  function moveSession(day: number, index: number, direction: -1 | 1) {
    updateSelectedWeek((week) => {
      const sessions = [...week.sessions[day]];

      const target = index + direction;

      if (target < 0 || target >= sessions.length) {
        return week;
      }

      [sessions[index], sessions[target]] = [sessions[target], sessions[index]];

      return {
        ...week,

        sessions: {
          ...week.sessions,
          [day]: sessions,
        },
      };
    });
  }

  function addWeek() {
    const number = weeks.length + 1;

    setWeeks((current) => [...current, emptyWeek(number)]);

    setSelectedWeekNumber(number);

    setSuccess(null);
  }

  function duplicateWeek() {
    if (!selectedWeek) {
      return;
    }

    const insertionIndex = selectedWeek.weekNumber;

    const duplicated: WeekDraft = {
      key: generateKey(),

      weekNumber: insertionIndex + 1,

      name: selectedWeek.name,

      notes: selectedWeek.notes,

      sessions: cloneSessions(selectedWeek.sessions),
    };

    const next = [
      ...weeks.slice(0, insertionIndex),

      duplicated,

      ...weeks.slice(insertionIndex),
    ].map((week, index) => ({
      ...week,
      weekNumber: index + 1,
    }));

    setWeeks(next);

    setSelectedWeekNumber(insertionIndex + 1);

    setSuccess(null);
  }

  function deleteWeek() {
    if (weeks.length === 1) {
      setError("O planejamento precisa ter pelo menos uma semana.");
      return;
    }

    if (!selectedWeek) {
      return;
    }

    if (!window.confirm(`Excluir a Semana ${selectedWeek.weekNumber}?`)) {
      return;
    }

    const next = weeks
      .filter((week) => week.weekNumber !== selectedWeek.weekNumber)
      .map((week, index) => ({
        ...week,
        weekNumber: index + 1,
      }));

    setWeeks(next);

    setSelectedWeekNumber(Math.min(selectedWeek.weekNumber, next.length));

    setError(null);
    setSuccess(null);
  }

  async function savePlan() {
    setError(null);
    setSuccess(null);

    if (!planName.trim()) {
      setError("Informe um nome para o planejamento.");
      return;
    }

    if (!startDate) {
      setError("Informe a data inicial.");
      return;
    }

    if (!isMonday(startDate)) {
      setError("A data inicial precisa ser uma segunda-feira.");
      return;
    }

    try {
      const inputWeeks = weeks.map((week) => ({
        weekNumber: week.weekNumber,

        name: week.name.trim() || null,

        notes: week.notes.trim() || null,

        sessions: orderedDays.flatMap((day) =>
          week.sessions[day].map((session, index) => {
            if (session.sessionType === 0) {
              if (!session.strengthWorkoutDayId) {
                throw new Error(
                  `Semana ${week.weekNumber}, ${dayLabels[day]}: selecione o treino de musculação.`,
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
                `Semana ${week.weekNumber}, ${dayLabels[day]}: selecione o treino de corrida.`,
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
        ),
      }));

      const input: HybridTrainingPlanInput = {
        name: planName.trim(),

        startDate,

        isActive,

        weeks: inputWeeks,
      };

      setSaving(true);

      const saved =
        planId === null
          ? await hybridWeekService.create(input)
          : await hybridWeekService.update(planId, input);

      setPlanId(saved.id);

      setPlanName(saved.name);

      setStartDate(saved.startDate.slice(0, 10));

      setIsActive(saved.isActive);

      setWeeks(planToWeeks(saved));

      setPlans((current) => {
        const exists = current.some((plan) => plan.id === saved.id);

        const normalized = current.map((plan) => ({
          ...plan,

          isActive: saved.isActive ? plan.id === saved.id : plan.isActive,
        }));

        if (exists) {
          return normalized.map((plan) =>
            plan.id === saved.id ? saved : plan,
          );
        }

        return [saved, ...normalized];
      });

      setSuccess("Planejamento salvo com sucesso.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o planejamento.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function activatePlan() {
    if (planId === null) {
      setError("Salve o planejamento antes de ativá-lo.");
      return;
    }

    try {
      setActivating(true);
      setError(null);
      setSuccess(null);

      const activated = await hybridWeekService.activate(planId);

      applyPlan(activated);

      setPlans((current) =>
        current.map((plan) =>
          plan.id === activated.id
            ? activated
            : {
                ...plan,
                isActive: false,
              },
        ),
      );

      setSuccess("Planejamento ativado.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível ativar o planejamento.",
      );
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="dash-panel text-sm text-muted">
        Carregando planejamento híbrido...
      </div>
    );
  }

  if (!selectedWeek) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="dash-eyebrow">Planejamento híbrido</p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold">Minha Semana</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Organize ciclos de uma ou mais semanas combinando musculação e
              corrida.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startNewPlan}
              className="rounded-xl border border-border px-4 py-2.5 text-sm"
            >
              Novo planejamento
            </button>

            {!isActive && planId !== null && (
              <button
                type="button"
                disabled={activating}
                onClick={() => void activatePlan()}
                className="rounded-xl border border-border px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {activating ? "Ativando..." : "Tornar ativo"}
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => void savePlan()}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar planejamento"}
            </button>
          </div>
        </div>
      </header>

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

      {plans.length > 0 && (
        <section className="dash-panel">
          <label className="block text-sm">
            <span className="font-medium">Planejamento</span>

            <select
              value={planId ?? ""}
              onChange={(event) => {
                const id = Number(event.target.value);

                const plan = plans.find((item) => item.id === id);

                if (plan) {
                  applyPlan(plan);
                }
              }}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                  {plan.isActive ? " — ativo" : ""}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      <section className="dash-panel">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Nome do planejamento</span>

            <input
              value={planName}
              maxLength={150}
              onChange={(event) => {
                setPlanName(event.target.value);
                setSuccess(null);
              }}
              placeholder="Ex.: Preparação 5 km + estética"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium">Início da Semana 1</span>

            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                setSuccess(null);
              }}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            />

            <p className="mt-2 text-xs text-muted">
              A data inicial precisa ser uma segunda-feira.
            </p>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-border px-4 py-2">
            {weeks.length} {weeks.length === 1 ? "semana" : "semanas"}
          </span>

          <span className="rounded-full border border-border px-4 py-2">
            {isActive ? "Planejamento ativo" : "Planejamento inativo"}
          </span>

          {planEndDate && (
            <span className="rounded-full border border-border px-4 py-2">
              {formatShortDate(parseDateKey(startDate))}
              {" — "}
              {formatShortDate(planEndDate)}
            </span>
          )}
        </div>
      </section>

      <section className="dash-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            disabled={selectedWeekNumber === 1}
            onClick={() => setSelectedWeekNumber((current) => current - 1)}
            className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-30"
          >
            ← Semana anterior
          </button>

          <div className="text-center">
            <p className="dash-eyebrow">
              Semana {selectedWeek.weekNumber} de {weeks.length}
            </p>

            {selectedWeekDates && (
              <h2 className="mt-2 text-xl font-semibold">
                {formatShortDate(selectedWeekDates.start)}
                {" — "}
                {formatShortDate(selectedWeekDates.end)}
              </h2>
            )}
          </div>

          <button
            type="button"
            disabled={selectedWeekNumber === weeks.length}
            onClick={() => setSelectedWeekNumber((current) => current + 1)}
            className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-30"
          >
            Próxima semana →
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Nome da semana
            <input
              value={selectedWeek.name}
              maxLength={150}
              placeholder="Ex.: Base, Progressão, Deload..."
              onChange={(event) =>
                updateSelectedWeek((week) => ({
                  ...week,
                  name: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
            />
          </label>

          <label className="text-sm">
            Observações
            <input
              value={selectedWeek.notes}
              maxLength={1000}
              onChange={(event) =>
                updateSelectedWeek((week) => ({
                  ...week,
                  notes: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={duplicateWeek}
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            Duplicar semana
          </button>

          <button
            type="button"
            onClick={addWeek}
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            + Adicionar semana
          </button>

          <button
            type="button"
            disabled={weeks.length === 1}
            onClick={deleteWeek}
            className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-30"
          >
            Excluir semana
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="dash-panel">
          <p className="text-sm text-muted">Dias de treino</p>

          <p className="mt-3 text-3xl font-semibold">
            {selectedWeekStats.trainingDays}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Sessões</p>

          <p className="mt-3 text-3xl font-semibold">
            {selectedWeekStats.totalSessions}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Musculação</p>

          <p className="mt-3 text-3xl font-semibold">
            {selectedWeekStats.strengthSessions}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Corrida</p>

          <p className="mt-3 text-3xl font-semibold">
            {selectedWeekStats.runningSessions}
          </p>
        </div>

        <div className="dash-panel">
          <p className="text-sm text-muted">Descanso</p>

          <p className="mt-3 text-3xl font-semibold">
            {selectedWeekStats.restDays}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {orderedDays.map((day) => {
          const sessions = selectedWeek.sessions[day];

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
                    Nenhuma sessão planejada.
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
                            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-30"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            disabled={index === sessions.length - 1}
                            onClick={() => moveSession(day, index, 1)}
                            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-30"
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
                        <label className="text-sm">
                          Treino
                          {session.sessionType === 0 ? (
                            <select
                              value={session.strengthWorkoutDayId}
                              onChange={(event) =>
                                updateSession(day, index, {
                                  strengthWorkoutDayId: event.target.value,
                                })
                              }
                              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
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
                              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
                            >
                              {options.runningWorkouts.map((workout) => (
                                <option key={workout.id} value={workout.id}>
                                  {workout.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </label>

                        <label className="text-sm">
                          Período
                          <select
                            value={session.period}
                            onChange={(event) =>
                              updateSession(day, index, {
                                period: Number(
                                  event.target.value,
                                ) as TrainingPeriod,
                              })
                            }
                            className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
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
                        Observações
                        <input
                          value={session.notes}
                          maxLength={500}
                          onChange={(event) =>
                            updateSession(day, index, {
                              notes: event.target.value,
                            })
                          }
                          placeholder="Opcional"
                          className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
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
    </div>
  );
}
