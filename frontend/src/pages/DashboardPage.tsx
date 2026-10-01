import { useCallback } from "react";

import { clearSession } from "../services/api";
import { dashboardService as service } from "../services/dashboardService";
import { useRemote } from "../hooks/useRemote";

import type {
  ActiveSession,
  BodyWeightEntry,
  DashboardData,
} from "../types/dashboard";

import PlansList from "../components/dashboard/PlansList";
import PlanView from "../components/dashboard/PlanView";
import SessionView from "../components/dashboard/SessionView";

import {
  Badge,
  Empty,
  ErrorNotice,
  Loading,
  Panel,
} from "../components/dashboard/UI";

import { dateTime, sessionStatusLabel } from "../components/dashboard/format";

import BodyWeightView from "../components/dashboard/BodyWeightView";
import TodayHybridTraining from "../components/TodayHybridTraining";

import RunningPage from "./RunningPage";
import HybridWeekPage from "./HybridWeekPage";

interface LoadedDashboard {
  dashboard: DashboardData;
  active: ActiveSession | null;
  weightEntries: BodyWeightEntry[];
  goalWeight: number | null;
}

interface WeightSummary {
  current: number | null;
  initial: number | null;
  average7Days: number | null;
  goal: number | null;
  variation: number | null;
}

function numberValue(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function dateTimestamp(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return Date.UTC(year, month - 1, day);
}

function getWeightSummary(
  entries: BodyWeightEntry[],
  goal: number | null,
): WeightSummary {
  if (!entries.length) {
    return {
      current: null,
      initial: null,
      average7Days: null,
      goal,
      variation: null,
    };
  }

  const ordered = [...entries].sort((a, b) =>
    b.recordedAt.localeCompare(a.recordedAt),
  );

  const current = ordered[0].weightKg;

  const initial = ordered.at(-1)?.weightKg ?? null;

  const latestTimestamp = dateTimestamp(ordered[0].recordedAt);

  const windowStart = latestTimestamp - 6 * 24 * 60 * 60 * 1000;

  const recentEntries = ordered.filter((entry) => {
    const timestamp = dateTimestamp(entry.recordedAt);

    return timestamp >= windowStart && timestamp <= latestTimestamp;
  });

  const average7Days =
    recentEntries.length > 0
      ? recentEntries.reduce((total, entry) => total + entry.weightKg, 0) /
        recentEntries.length
      : null;

  return {
    current,
    initial,
    average7Days,
    goal,
    variation: initial === null ? null : current - initial,
  };
}

function WeightMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>

      {description && (
        <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
      )}
    </div>
  );
}

function ModuleCard({
  title,
  description,
  href,
  available = false,
}: {
  title: string;
  description: string;
  href?: string;
  available?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>

        <Badge>{available ? "Disponível" : "Em breve"}</Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>

      {available && <p className="mt-5 text-sm font-medium">Abrir módulo →</p>}
    </>
  );

  if (!href) {
    return <div className="dash-panel opacity-70">{content}</div>;
  }

  return (
    <a href={href} className="dash-panel block transition hover:bg-control">
      {content}
    </a>
  );
}

function Overview({
  data,
  active,
  weightEntries,
  goalWeight,
}: {
  data: DashboardData;
  active: ActiveSession | null;
  weightEntries: BodyWeightEntry[];
  goalWeight: number | null;
}) {
  const activePlans = data.plans.filter((plan) => plan.isActive);

  const weight = getWeightSummary(weightEntries, goalWeight);

  const currentPlan = activePlans[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="dash-eyebrow">Seu espaço de evolução</p>

          <h1 className="dash-title">
            Olá, {data.profile.displayName.split(" ")[0]}.
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Treinos, alimentação e métricas em um só lugar.
          </p>
        </div>

        <p className="text-sm text-muted">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <TodayHybridTraining />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Panel>
          <p className="dash-eyebrow">
            {active?.hasActiveSession ? "Treino em andamento" : "Musculação"}
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {active?.hasActiveSession
              ? "Continue de onde parou."
              : currentPlan
                ? currentPlan.name
                : "Seu próximo treino começa aqui."}
          </h2>

          <p className="mt-4 text-sm leading-7 text-muted">
            {active?.hasActiveSession
              ? "Sua sessão continua salva. Retome o treino e siga registrando suas séries."
              : currentPlan
                ? "Seu plano está ativo e pronto para consulta e execução."
                : "Crie seu primeiro planejamento de musculação e organize seus treinos."}
          </p>

          <a
            className="dash-primary mt-6"
            href={
              active?.hasActiveSession
                ? `#/treino/${active.sessionId}`
                : currentPlan
                  ? `#/plano/${currentPlan.id}`
                  : "#/musculacao"
            }
          >
            {active?.hasActiveSession
              ? "Retomar treino"
              : currentPlan
                ? "Abrir meu plano"
                : "Criar planejamento"}{" "}
            →
          </a>
        </Panel>

        <Panel title="Musculação em números">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted">Concluídos</p>

              <p className="mt-2 text-2xl font-semibold">
                {data.completedSessions}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted">Parciais</p>

              <p className="mt-2 text-2xl font-semibold">
                {data.partialSessions}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted">Planos ativos</p>

              <p className="mt-2 text-2xl font-semibold">
                {activePlans.length}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Peso e evolução"
        action={
          <a href="#/peso" className="auth-link text-sm">
            Ver detalhes
          </a>
        }
      >
        {!weightEntries.length ? (
          <div>
            <p className="text-sm leading-6 text-muted">
              Você ainda não registrou nenhuma pesagem.
            </p>

            <a href="#/peso" className="dash-primary mt-5">
              Registrar peso →
            </a>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <WeightMetric
              label="Peso atual"
              value={
                weight.current === null
                  ? "—"
                  : `${numberValue(weight.current)} kg`
              }
            />

            <WeightMetric
              label="Média 7 dias"
              value={
                weight.average7Days === null
                  ? "—"
                  : `${numberValue(weight.average7Days)} kg`
              }
              description="Média das pesagens disponíveis nos últimos 7 dias."
            />

            <WeightMetric
              label="Meta"
              value={
                weight.goal === null ? "—" : `${numberValue(weight.goal)} kg`
              }
              description={
                weight.goal === null
                  ? "Defina uma meta no módulo de peso."
                  : undefined
              }
            />

            <WeightMetric
              label="Variação"
              value={
                weight.variation === null
                  ? "—"
                  : `${weight.variation > 0 ? "+" : ""}${numberValue(
                      weight.variation,
                    )} kg`
              }
              description="Desde a primeira pesagem registrada."
            />
          </div>
        )}
      </Panel>

      <div>
        <div className="mb-4">
          <p className="dash-eyebrow">Sua central</p>

          <h2 className="mt-2 text-xl font-semibold">Tudo em um só lugar</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ModuleCard
            title="Minha Semana"
            description="Combine musculação e corrida em uma única rotina semanal."
            href="#/semana"
            available
          />

          <ModuleCard
            title="Musculação"
            description="Planejamento, execução, histórico e evolução dos seus treinos."
            href="#/musculacao"
            available
          />

          <ModuleCard
            title="Corrida"
            description="Treinos reutilizáveis, registro de corridas, histórico e evolução."
            href="#/corrida"
            available
          />

          <ModuleCard
            title="Peso corporal"
            description="Pesagens, meta, média de 7 dias e tendência."
            href="#/peso"
            available
          />

          <ModuleCard
            title="Alimentação"
            description="Refeições, calorias, proteínas, carboidratos e gorduras."
          />

          <ModuleCard
            title="Hidratação"
            description="Acompanhe sua ingestão diária de água."
          />

          <ModuleCard
            title="Sono"
            description="Registre seu sono e acompanhe sua recuperação."
          />
        </div>
      </div>

      <History data={data} compact />
    </div>
  );
}

function History({
  data,
  compact = false,
}: {
  data: DashboardData;
  compact?: boolean;
}) {
  const sessions = compact
    ? data.recentSessions.slice(0, 4)
    : data.recentSessions;

  return (
    <Panel
      title={compact ? "Últimos treinos" : "Histórico de treinos"}
      action={
        compact ? (
          <a className="auth-link text-sm" href="#/historico">
            Ver histórico
          </a>
        ) : undefined
      }
    >
      {!compact && (
        <p className="mb-5 text-sm text-muted">
          Suas 20 sessões mais recentes, com os registros de cada série.
        </p>
      )}

      {!sessions.length ? (
        <Empty>
          Seus treinos aparecerão aqui quando você iniciar a primeira sessão.
        </Empty>
      ) : (
        <div className="divide-y divide-border">
          {sessions.map((session) => (
            <a
              key={session.id}
              href={`#/treino/${session.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg py-4 hover:bg-control"
            >
              <div>
                <p className="font-medium">{session.dayName}</p>

                <p className="mt-1 text-sm text-muted">
                  {dateTime(session.startedAt)}
                </p>
              </div>

              <Badge>{sessionStatusLabel(session.status)} →</Badge>
            </a>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default function DashboardPage({ route }: { route: string }) {
  const load = useCallback(async (): Promise<LoadedDashboard> => {
    const [dashboard, active, weightEntries, goal] = await Promise.all([
      service.dashboard(),
      service.activeSession(),
      service.bodyWeight(),
      service.bodyWeightGoal(),
    ]);

    return {
      dashboard,
      active,
      weightEntries,
      goalWeight: goal.goalWeightKg,
    };
  }, []);

  const remote = useRemote(load);

  const data = remote.data;

  const nav = [
    ["#/dashboard", "Visão geral", "01"],
    ["#/semana", "Minha Semana", "02"],
    ["#/musculacao", "Musculação", "03"],
    ["#/corrida", "Corrida", "04"],
    ["#/peso", "Peso corporal", "05"],
    ["#/historico", "Histórico", "06"],
  ];

  const planMatch = /^#\/plano\/(\d+)$/.exec(route);

  const sessionMatch = /^#\/treino\/(\d+)$/.exec(route);

  const currentNav = planMatch || sessionMatch ? "#/musculacao" : route;

  let content;

  if (!data && remote.loading) {
    content = <Loading />;
  } else if (!data) {
    content = <ErrorNotice message={remote.error} retry={remote.reload} />;
  } else if (planMatch) {
    content = (
      <PlanView
        key={planMatch[1]}
        id={Number(planMatch[1])}
        dashboard={data.dashboard}
        active={data.active}
        onChanged={remote.reload}
      />
    );
  } else if (sessionMatch) {
    content = (
      <SessionView
        key={sessionMatch[1]}
        id={Number(sessionMatch[1])}
        onChanged={remote.reload}
      />
    );
  } else if (route === "#/semana") {
    content = <HybridWeekPage />;
  } else if (route === "#/musculacao") {
    content = <PlansList data={data.dashboard} onChanged={remote.reload} />;
  } else if (route === "#/corrida") {
    content = <RunningPage />;
  } else if (route === "#/historico") {
    content = <History data={data.dashboard} />;
  } else if (route === "#/peso") {
    content = <BodyWeightView />;
  } else {
    content = (
      <Overview
        data={data.dashboard}
        active={data.active}
        weightEntries={data.weightEntries}
        goalWeight={data.goalWeight}
      />
    );
  }

  return (
    <div className="min-h-[calc(100svh-4rem)] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-surface p-4 lg:border-r lg:border-b-0 lg:p-6">
        <a
          href="#/dashboard"
          aria-label="HybridLab — dashboard"
          className="mx-auto hidden w-fit lg:block"
        >
          <img
            className="brand-logo h-28 w-28 object-contain"
            src="/hybridlab-logo.png"
            alt="HybridLab"
            width="112"
            height="112"
          />
        </a>

        <p className="my-6 hidden text-center text-xs tracking-[0.16em] text-muted uppercase lg:block">
          Seu espaço
        </p>

        <nav
          aria-label="Navegação principal"
          className="grid grid-cols-2 gap-2 sm:grid-cols-6 lg:grid-cols-1"
        >
          {nav.map(([href, label, number]) => (
            <a
              key={href}
              href={href}
              aria-current={
                currentNav === href ||
                (href === "#/dashboard" &&
                  ["", "#/login", "#/registro"].includes(route))
                  ? "page"
                  : undefined
              }
              className="dash-nav"
            >
              <span className="hidden text-xs opacity-50 lg:inline">
                {number}
              </span>

              {label}
            </a>
          ))}
        </nav>

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4 lg:mt-12 lg:flex-col lg:items-start">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {data?.dashboard.profile.displayName ?? "Sua conta"}
            </p>

            <p className="mt-1 text-xs text-muted">
              {data ? "Conta pessoal" : "Conectando…"}
            </p>
          </div>

          <button
            className="dash-secondary lg:mt-4"
            onClick={() => {
              clearSession();

              window.location.hash = "/login";
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-7 sm:p-8 xl:p-12">
        <div className="mx-auto max-w-6xl">
          {data && (
            <div className="mb-5 flex justify-end">
              <button
                disabled={remote.loading}
                className="text-xs text-muted underline underline-offset-4"
                onClick={remote.reload}
              >
                {remote.loading ? "Atualizando…" : "Atualizar dados"}
              </button>
            </div>
          )}

          {data && remote.error && (
            <ErrorNotice message={remote.error} retry={remote.reload} />
          )}

          {content}
        </div>
      </main>
    </div>
  );
}
