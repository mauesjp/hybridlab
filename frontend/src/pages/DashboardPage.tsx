import { useCallback, useEffect, useRef } from "react";

import { clearSession } from "../services/api";
import { dashboardService as service } from "../services/dashboardService";
import { useRemote } from "../hooks/useRemote";

import type {
  ActiveSession,
  BodyWeightEntry,
  DashboardData,
} from "../types/dashboard";

import DashboardShell from "../components/dashboard/DashboardShell";
import "../components/dashboard/TrainingPage.css";
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
import DashboardOverview from "../components/dashboard/DashboardOverview";

import RunningPage from "./RunningPage";
import HybridWeekPage from "./HybridWeekPage";
import PhysicalAssessmentPage from "./PhysicalAssessmentPage";

interface LoadedDashboard {
  dashboard: DashboardData;
  active: ActiveSession | null;
  weightEntries: BodyWeightEntry[];
  goalWeight: number | null;
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
  const { reload } = remote;
  const previousRoute = useRef(route);
  useEffect(() => {
    const changed = previousRoute.current !== route;
    previousRoute.current = route;
    if (changed && ["", "#/dashboard", "#/login", "#/registro", "#/musculacao"].includes(route)) reload();
  }, [route, reload]);

  const data = remote.data;

  const nav = [
    {
      href: "#/dashboard",
      label: "Visão geral",
      number: "01",
    },
    {
      href: "#/semana",
      label: "Minha Semana",
      number: "02",
    },
    {
      href: "#/musculacao",
      label: "Musculação",
      number: "03",
    },
    {
      href: "#/corrida",
      label: "Corrida",
      number: "04",
    },
    {
      href: "#/peso",
      label: "Peso corporal",
      number: "05",
    },
    {
      href: "#/avaliacao",
      label: "Avaliação Física",
      number: "06",
    },
    {
      href: "#/historico",
      label: "Histórico",
      number: "07",
    },
  ];

  const planMatch = /^#\/plano\/(\d+)$/.exec(route);

  const sessionMatch = /^#\/treino\/(\d+)$/.exec(route);

  const currentNav = planMatch || sessionMatch ? "#/musculacao" : route;

  if (route === "#/corrida" || route.startsWith("#/corrida/")) return <RunningPage key={route} route={route} />;

  const isOverview = !planMatch && !sessionMatch && !nav.slice(1).some(item => item.href === route);
  if (isOverview) {
    return <DashboardOverview data={data?.dashboard ?? null} active={data?.active ?? null} weightEntries={data?.weightEntries ?? []} goalWeight={data?.goalWeight ?? null} loading={remote.loading} error={remote.error} reload={remote.reload} />;
  }

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

  } else if (route === "#/historico") {
    content = <History data={data.dashboard} />;
  } else if (route === "#/peso") {
    content = <BodyWeightView />;
  } else if (route === "#/avaliacao") {
    content = <PhysicalAssessmentPage />;
  } else {
    content = null;
  }

  if (route === "#/musculacao" || planMatch || sessionMatch) {
    return <DashboardShell title={sessionMatch ? "Sua sessão" : planMatch ? "Seu plano" : "Treinos"} subtitle={sessionMatch ? "Uma série de cada vez." : planMatch ? "Um treino de cada vez. Cada evolução conta." : "Seu planejamento, sua frequência e cada evolução."} displayName={data?.dashboard.profile.displayName} current="strength" loading={remote.loading} refresh={remote.reload} className={sessionMatch ? "training-page session-page" : planMatch ? "training-page plan-page" : "training-page"}>
      {data && remote.error && <ErrorNotice message={remote.error} retry={remote.reload} />}
      {content}
    </DashboardShell>;
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
          className="grid grid-cols-2 gap-2 sm:grid-cols-7 lg:grid-cols-1"
        >
          {nav.map(({ href, label, number }) => (
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
