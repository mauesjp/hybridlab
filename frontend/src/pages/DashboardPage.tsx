import { useCallback } from 'react'
import { clearSession } from '../services/api'
import { dashboardService as service } from '../services/dashboardService'
import { useRemote } from '../hooks/useRemote'
import type { ActiveSession, DashboardData } from '../types/dashboard'
import PlansList from '../components/dashboard/PlansList'
import PlanView from '../components/dashboard/PlanView'
import SessionView from '../components/dashboard/SessionView'
import { Badge, Empty, ErrorNotice, Loading, Panel } from '../components/dashboard/UI'
import { dateTime, sessionStatusLabel } from '../components/dashboard/format'
import BodyWeightView from '../components/dashboard/BodyWeightView'

interface LoadedDashboard { dashboard: DashboardData; active: ActiveSession | null; }

function Overview({ data, active }: { data: DashboardData; active: ActiveSession | null }) {
  const activePlans = data.plans.filter(p => p.isActive)
  const stats = [['Treinos concluídos', data.completedSessions], ['Planos ativos', activePlans.length], ['Treinos parciais', data.partialSessions]]
  return <div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="dash-eyebrow">Seu espaço de evolução</p><h1 className="dash-title">Olá, {data.profile.displayName.split(' ')[0]}.</h1><p className="mt-3 text-sm leading-6 text-muted">Seu planejamento e seus treinos, em um só lugar.</p></div><p className="text-sm text-muted">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{stats.map(([label, value]) => <div className="dash-panel" key={label}><p className="text-sm text-muted">{label}</p><p className="mt-4 text-4xl font-medium tracking-tight">{value}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><Panel><p className="dash-eyebrow">{active?.hasActiveSession ? 'Continue de onde parou' : 'Musculação'}</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">{active?.hasActiveSession ? 'Seu treino está em andamento.' : activePlans.length ? activePlans[0].name : 'Seu próximo treino começa aqui.'}</h2><p className="mt-4 text-sm leading-7 text-muted">{active?.hasActiveSession ? 'As séries salvas ficam disponíveis mesmo depois de fechar a página.' : activePlans.length ? 'Consulte os dias do seu plano ativo e escolha o treino que vai executar.' : 'Crie seu planejamento e organize seus próximos treinos.'}</p><a className="dash-primary mt-6" href={active?.hasActiveSession ? '#/treino/' + active.sessionId : activePlans.length ? '#/plano/' + activePlans[0].id : '#/musculacao'}>{active?.hasActiveSession ? 'Retomar treino' : activePlans.length ? 'Abrir meu plano' : 'Ver planos'} →</a></Panel>
      <Panel title="Sua evolução"><p className="text-sm leading-7 text-muted">Registre seu peso e acompanhe sua meta, seu histórico e sua tendência.</p><a href="#/peso" className="auth-link mt-5 inline-block text-sm">Ver peso corporal →</a></Panel>
    </div>
    <History data={data} compact />
  </div>
}

function History({ data, compact = false }: { data: DashboardData; compact?: boolean }) {
  const sessions = compact ? data.recentSessions.slice(0, 4) : data.recentSessions
  return <Panel title={compact ? 'Últimos treinos' : 'Histórico de treinos'} action={compact ? <a className="auth-link text-sm" href="#/historico">Ver histórico</a> : undefined}>{!compact && <p className="mb-5 text-sm text-muted">Suas 20 sessões mais recentes, com os registros de cada série.</p>}{!sessions.length ? <Empty>Seus treinos aparecerão aqui quando você iniciar a primeira sessão.</Empty> : <div className="divide-y divide-border">{sessions.map(session => <a key={session.id} href={'#/treino/' + session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg py-4 hover:bg-control"><div><p className="font-medium">{session.dayName}</p><p className="mt-1 text-sm text-muted">{dateTime(session.startedAt)}</p></div><Badge>{sessionStatusLabel(session.status)} →</Badge></a>)}</div>}</Panel>
}

export default function DashboardPage({ route }: { route: string }) {
  const load = useCallback(async (): Promise<LoadedDashboard> => {
    const [dashboard, active] = await Promise.all([service.dashboard(), service.activeSession()])
    return { dashboard, active }
  }, [])
  const remote = useRemote(load)
  const data = remote.data
  const nav = [['#/dashboard', 'Visão geral', '01'], ['#/musculacao', 'Musculação', '02'], ['#/peso', 'Peso corporal', '03'], ['#/historico', 'Histórico', '04']]
  const planMatch = /^#\/plano\/(\d+)$/.exec(route)
  const sessionMatch = /^#\/treino\/(\d+)$/.exec(route)
  const currentNav = planMatch || sessionMatch ? '#/musculacao' : route
  let content
  if (!data && remote.loading) content = <Loading />
  else if (!data) content = <ErrorNotice message={remote.error} retry={remote.reload} />
  else if (planMatch) content = <PlanView key={planMatch[1]} id={Number(planMatch[1])} dashboard={data.dashboard} active={data.active} onChanged={remote.reload} />
  else if (sessionMatch) content = <SessionView key={sessionMatch[1]} id={Number(sessionMatch[1])} onChanged={remote.reload} />
  else if (route === '#/musculacao') content = <PlansList data={data.dashboard} onChanged={remote.reload} />
  else if (route === '#/historico') content = <History data={data.dashboard} />
  else if (route === '#/peso') content = <BodyWeightView />
  else content = <Overview data={data.dashboard} active={data.active} />

  return <div className="min-h-[calc(100svh-4rem)] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="border-b border-border bg-surface p-4 lg:border-r lg:border-b-0 lg:p-6"><a href="#/dashboard" aria-label="HybridLab — dashboard" className="mx-auto hidden w-fit lg:block"><img className="brand-logo h-28 w-28 object-contain" src="/hybridlab-logo.png" alt="HybridLab" width="112" height="112" /></a><p className="my-6 hidden text-center text-xs tracking-[0.16em] text-muted uppercase lg:block">Seu espaço</p><nav aria-label="Navegação principal" className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">{nav.map(([href, label, number]) => <a key={href} href={href} aria-current={currentNav === href || (href === '#/dashboard' && ['','#/login','#/registro'].includes(route)) ? 'page' : undefined} className="dash-nav"><span className="hidden text-xs opacity-50 lg:inline">{number}</span>{label}</a>)}</nav><div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4 lg:mt-12 lg:flex-col lg:items-start"><div className="min-w-0"><p className="truncate text-sm font-medium">{data?.dashboard.profile.displayName ?? 'Sua conta'}</p><p className="mt-1 text-xs text-muted">{data ? 'Conta pessoal' : 'Conectando…'}</p></div><button className="dash-secondary lg:mt-4" onClick={() => { clearSession(); window.location.hash = '/login' }}>Sair</button></div></aside>
    <main className="min-w-0 px-5 py-7 sm:p-8 xl:p-12"><div className="mx-auto max-w-6xl">{data && <div className="mb-5 flex justify-end"><button disabled={remote.loading} className="text-xs text-muted underline underline-offset-4" onClick={remote.reload}>{remote.loading ? 'Atualizando…' : 'Atualizar dados'}</button></div>}{data && remote.error && <ErrorNotice message={remote.error} retry={remote.reload} />}{content}</div></main>
  </div>
}

