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
              Configure sua Semana Híbrida
            </h2>

            <p className="mt-2 text-sm text-muted">{formatToday()}</p>
          </div>

          <a
            href="#/semana"
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            Montar semana
          </a>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">
          Organize seus treinos de musculação e corrida para o HybridLab mostrar
          automaticamente o que está planejado para cada dia.
        </p>
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
            Aproveite o dia de recuperação.
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

          <p className="mt-2 text-sm text-muted">
            {formatToday()}
            {today.planName ? ` · ${today.planName}` : ""}
          </p>
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
