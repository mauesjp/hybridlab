import { useCallback, useEffect, useRef } from "react";

import HistoryView from "../components/dashboard/HistoryView";
import "../components/dashboard/ProgressViews.css";
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
  ErrorNotice,
  Loading,
} from "../components/dashboard/UI";



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

  const moduleRoute = route.split("/")[1];

  if (route === "#/corrida" || route.startsWith("#/corrida/")) return <RunningPage key={route} route={route} />;

  const isOverview = !planMatch && !sessionMatch && !nav.slice(1).some(item => item.href.split("/")[1] === moduleRoute);
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
  } else if (moduleRoute === "semana") {
    content = <HybridWeekPage key={route} route={route} dashboard={data.dashboard} />;
  } else if (route === "#/musculacao") {
    content = <PlansList data={data.dashboard} onChanged={remote.reload} />;

  } else if (route === "#/historico") {
    content = <HistoryView data={data.dashboard} />;
  } else if (route === "#/peso") {
    content = <BodyWeightView />;
  } else if (moduleRoute === "avaliacao") {
    content = <PhysicalAssessmentPage key={route} route={route} />;
  } else {
    content = null;
  }

  if (route === "#/musculacao" || planMatch || sessionMatch) {
    return <DashboardShell title={sessionMatch ? "Sua sessão" : planMatch ? "Seu plano" : "Treinos"} subtitle={sessionMatch ? "Uma série de cada vez." : planMatch ? "Um treino de cada vez. Cada evolução conta." : "Seu planejamento, sua frequência e cada evolução."} displayName={data?.dashboard.profile.displayName} current="strength" loading={remote.loading} refresh={remote.reload} className={sessionMatch ? "training-page session-page" : planMatch ? "training-page plan-page" : "training-page"}>
      {data && remote.error && <ErrorNotice message={remote.error} retry={remote.reload} />}
      {content}
    </DashboardShell>;
  }

  const title = moduleRoute === "semana" ? "Minha Semana" : moduleRoute === "peso" ? "Peso corporal" : moduleRoute === "avaliacao" ? "Avaliação Física" : "Histórico de treinos";
  return <DashboardShell title={title} subtitle="Seu progresso, um passo de cada vez." displayName={data?.dashboard.profile.displayName} current="account" loading={remote.loading} refresh={remote.reload} className="training-page progress-page">
    <nav className="progress-nav" aria-label="Acompanhamento">{nav.filter(item => ["#/semana", "#/peso", "#/avaliacao", "#/historico"].includes(item.href)).map(item => <a key={item.href} href={item.href} aria-current={item.href.split("/")[1] === moduleRoute ? "page" : undefined}>{item.label}</a>)}</nav>
    {data && remote.error && <ErrorNotice message={remote.error} retry={remote.reload} />}
    {content}
  </DashboardShell>;
}
