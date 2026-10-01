import { useEffect, useState } from "react";

import { hybridWeekService } from "../services/hybridWeekService";

import type { TodayHybridPlan, TrainingPeriod } from "../types/hybridWeek";

const periodLabels: Record<TrainingPeriod, string> = {
  0: "Período não definido",
  1: "Manhã",
  2: "Tarde",
  3: "Noite",
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function localDateKey() {
  const date = new Date();

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
}

function formatToday() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

export default function TodayHybridTraining() {
  const [today, setToday] = useState<TodayHybridPlan | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await hybridWeekService.getToday(localDateKey());

        setToday(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os treinos de hoje.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <section className="dash-panel">
        <p className="dash-eyebrow">Hoje</p>

        <p className="mt-4 text-sm text-muted">
          Carregando seu planejamento...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dash-panel">
        <p className="dash-eyebrow">Hoje</p>

        <p className="mt-4 text-sm text-muted">
          Não foi possível carregar seu planejamento de hoje.
        </p>
      </section>
    );
  }

  if (!today || !today.hasActivePlan) {
    return (
      <section className="dash-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dash-eyebrow">Hoje</p>

            <h2 className="mt-2 text-xl font-semibold">
              Crie seu planejamento híbrido
            </h2>

            <p className="mt-2 text-sm text-muted">{formatToday()}</p>
          </div>

          <a
            href="#/semana"
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            Criar planejamento
          </a>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">
          Organize musculação e corrida em um ciclo de uma ou mais semanas para
          o HybridLab mostrar automaticamente o treino correspondente a cada
          dia.
        </p>
      </section>
    );
  }

  if (today.isBeforePlan) {
    return (
      <section className="dash-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dash-eyebrow">Próximo planejamento</p>

            <h2 className="mt-2 text-xl font-semibold">{today.planName}</h2>

            <p className="mt-2 text-sm text-muted">
              Começa em {formatDate(today.planStartDate)}
            </p>
          </div>

          <a
            href="#/semana"
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            Ver planejamento
          </a>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border p-5">
          <p className="font-medium">O ciclo ainda não começou.</p>

          <p className="mt-1 text-sm text-muted">
            Hoje não será tratado como dia de descanso porque o planejamento
            começa em uma data futura.
          </p>
        </div>
      </section>
    );
  }

  if (today.isAfterPlan) {
    return (
      <section className="dash-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dash-eyebrow">Planejamento concluído</p>

            <h2 className="mt-2 text-xl font-semibold">{today.planName}</h2>

            <p className="mt-2 text-sm text-muted">
              {today.totalWeeks} {today.totalWeeks === 1 ? "semana" : "semanas"}
              {" · "}
              término em {formatDate(today.planEndDate)}
            </p>
          </div>

          <a
            href="#/semana"
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            Ver planejamento
          </a>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border p-5">
          <p className="font-medium">Este ciclo chegou ao fim.</p>

          <p className="mt-1 text-sm text-muted">
            Você pode editar o planejamento, prolongar o ciclo ou criar um novo.
          </p>
        </div>
      </section>
    );
  }

  if (today.isRestDay) {
    return (
      <section className="dash-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dash-eyebrow">Hoje</p>

            <h2 className="mt-2 text-xl font-semibold">Dia de descanso</h2>

            <p className="mt-2 text-sm text-muted">{formatToday()}</p>

            {today.weekNumber !== null && (
              <p className="mt-1 text-xs text-muted">
                Semana {today.weekNumber} de {today.totalWeeks}
                {today.planName ? ` · ${today.planName}` : ""}
              </p>
            )}
          </div>

          <a
            href="#/semana"
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            Ver semana
          </a>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border p-5">
          <p className="font-medium">Nenhum treino planejado para hoje.</p>

          <p className="mt-1 text-sm text-muted">
            Aproveite o dia para recuperação.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="dash-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="dash-eyebrow">Hoje</p>

          <h2 className="mt-2 text-xl font-semibold">Seu treino de hoje</h2>

          <p className="mt-2 text-sm text-muted">{formatToday()}</p>

          {today.weekNumber !== null && (
            <p className="mt-1 text-xs text-muted">
              Semana {today.weekNumber} de {today.totalWeeks}
              {today.planName ? ` · ${today.planName}` : ""}
            </p>
          )}
        </div>

        <a
          href="#/semana"
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          Ver semana
        </a>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {today.sessions.map((session) => {
          const isStrength = session.sessionType === 0;

          return (
            <a
              key={session.id}
              href={isStrength ? "#/musculacao" : "#/corrida"}
              className="rounded-xl border border-border p-4 transition hover:border-muted"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                  {isStrength ? "Musculação" : "Corrida"}
                </span>

                <span className="text-xs text-muted">
                  {periodLabels[session.period]}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                {session.sessionName ?? "Treino"}
              </h3>

              {session.notes && (
                <p className="mt-2 text-sm leading-6 text-muted">
                  {session.notes}
                </p>
              )}

              <p className="mt-4 text-xs text-muted">
                Abrir {isStrength ? "musculação" : "corrida"} →
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
