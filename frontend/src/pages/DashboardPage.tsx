import { useCallback } from 'react'
import { clearSession } from '../services/api'
import { dashboardService as service } from '../services/dashboardService'
import { useRemote } from '../hooks/useRemote'
import type { ActiveSession, CoachLink, DashboardData, PlanningAccess } from '../types/dashboard'
import PlansList from '../components/dashboard/PlansList'
import PlanView from '../components/dashboard/PlanView'
import LinksView from '../components/dashboard/LinksView'
import SessionView from '../components/dashboard/SessionView'
import { Badge, Empty, ErrorNotice, Loading, Panel } from '../components/dashboard/UI'
import { dateTime } from '../components/dashboard/format'

interface LoadedDashboard { dashboard: DashboardData; accesses: PlanningAccess[]; active: ActiveSession | null; pending: CoachLink[] }

function Overview({ data, active }: { data: DashboardData; active: ActiveSession | null }) {
  const isCoach = data.profile.role === 'Coach'
  const activePlans = data.plans.filter(p => p.isActive)
  const activeLinks = data.links.filter(l => l.status === 1)
  const pendingLinks = data.links.filter(l => l.status === 0)
  const stats = isCoach ? [
    ['Alunos vinculados', new Set(activeLinks.map(l => l.studentId)).size],
    ['Planos ativos', activePlans.length], ['Solicitações', pendingLinks.length],
  ] : [['Treinos concluídos', data.completedSessions], ['Planos ativos', activePlans.length], ['Professores', activeLinks.length]]
  return <div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="dash-eyebrow">{isCoach ? 'Seu espaço de acompanhamento' : 'Seu espaço de evolução'}</p><h1 className="dash-title">Olá, {data.profile.displayName.split(' ')[0]}.</h1><p className="mt-3 text-sm leading-6 text-muted">{isCoach ? 'Acompanhe seus alunos e prepare o próximo treino.' : 'Seu planejamento e seus treinos, em um só lugar.'}</p></div><p className="text-sm text-muted">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{stats.map(([label, value]) => <div className="dash-panel" key={label}><p className="text-sm text-muted">{label}</p><p className="mt-4 text-4xl font-medium tracking-tight">{value}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><Panel><p className="dash-eyebrow">{active?.hasActiveSession ? 'Continue de onde parou' : 'Musculação'}</p><h2 className="mt-3 text-2xl font-semibold tracking-tight">{active?.hasActiveSession ? 'Seu treino está em andamento.' : isCoach ? 'Planeje a próxima evolução.' : activePlans.length ? activePlans[0].name : 'Seu próximo treino começa aqui.'}</h2><p className="mt-4 text-sm leading-7 text-muted">{active?.hasActiveSession ? 'As séries salvas ficam disponíveis mesmo depois de fechar a página.' : isCoach ? 'Monte os dias, prescreva exercícios e publique uma nova versão quando estiver pronta.' : activePlans.length ? 'Consulte os dias do seu plano ativo e escolha o treino que vai executar.' : 'Crie seu planejamento ou conecte-se a um professor para receber um plano.'}</p><a className="dash-primary mt-6" href={active?.hasActiveSession ? '#/treino/' + active.sessionId : !isCoach && activePlans.length ? '#/plano/' + activePlans[0].id : '#/musculacao'}>{active?.hasActiveSession ? 'Retomar treino' : isCoach ? 'Gerenciar planos' : activePlans.length ? 'Abrir meu plano' : 'Ver planos'} →</a></Panel>
      <Panel title={isCoach ? 'Solicitações de alunos' : 'Acompanhamento'}><p className="text-sm leading-7 text-muted">{isCoach ? pendingLinks.length + ' solicitações aguardando sua resposta.' : activeLinks.length ? 'Seu acompanhamento está organizado por modalidade.' : 'Você pode treinar de forma independente ou solicitar acompanhamento.'}</p><div className="my-5 space-y-3">{(isCoach ? pendingLinks : activeLinks).slice(0, 3).map(link => <div key={link.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-3 text-sm"><span>{isCoach ? link.studentName : link.coachName}</span><Badge>{link.modality === 0 ? 'Musculação' : 'Corrida'}</Badge></div>)}</div><a href="#/vinculos" className="auth-link text-sm">{isCoach ? 'Gerenciar alunos' : 'Ver professores'} →</a></Panel>
    </div>
    {!isCoach && <History data={data} compact />}
  </div>
}

function History({ data, compact = false }: { data: DashboardData; compact?: boolean }) {
  const sessions = compact ? data.recentSessions.slice(0, 4) : data.recentSessions
  return <Panel title={compact ? 'Últimos treinos' : 'Histórico de treinos'} action={compact ? <a className="auth-link text-sm" href="#/historico">Ver histórico</a> : undefined}>{!compact && <p className="mb-5 text-sm text-muted">Suas 20 sessões mais recentes, com os registros de cada série.</p>}{!sessions.length ? <Empty>Seus treinos aparecerão aqui quando você iniciar a primeira sessão.</Empty> : <div className="divide-y divide-border">{sessions.map(session => <a key={session.id} href={'#/treino/' + session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg py-4 hover:bg-control"><div><p className="font-medium">{session.dayName}</p><p className="mt-1 text-sm text-muted">{dateTime(session.startedAt)}</p></div><Badge>{session.isCompleted ? 'Concluído' : 'Em andamento'} →</Badge></a>)}</div>}</Panel>
}

export default function DashboardPage({ route }: { route: string }) {
  const load = useCallback(async (): Promise<LoadedDashboard> => {
    const [, dashboard] = await Promise.all([service.me(), service.dashboard()])
    if (dashboard.profile.role === 'Student') {
      const [strength, running, active] = await Promise.all([service.access(0), service.access(1), service.activeSession()])
      return { dashboard, accesses: [strength, running], active, pending: [] }
    }
    return { dashboard, accesses: [], active: null, pending: await service.pending() }
  }, [])
  const remote = useRemote(load)
  const data = remote.data
  const isCoach = data?.dashboard.profile.role === 'Coach'
  const nav = [ ['#/dashboard', 'Visão geral', '01'], ['#/musculacao', 'Musculação', '02'], ['#/vinculos', isCoach ? 'Meus alunos' : 'Professores', '03'], ...(!isCoach ? [['#/historico', 'Histórico', '04']] : []) ]
  const planMatch = /^#\/plano\/(\d+)$/.exec(route)
  const sessionMatch = /^#\/treino\/(\d+)$/.exec(route)
  const currentNav = planMatch || sessionMatch ? '#/musculacao' : route
  let content
  if (!data && remote.loading) content = <Loading />
  else if (!data) content = <ErrorNotice message={remote.error} retry={remote.reload} />
  else if (planMatch) content = <PlanView key={planMatch[1]} id={Number(planMatch[1])} dashboard={data.dashboard} access={data.accesses[0] ?? null} active={data.active} onChanged={remote.reload} />
  else if (sessionMatch && !isCoach) content = <SessionView key={sessionMatch[1]} id={Number(sessionMatch[1])} onChanged={remote.reload} />
  else if (route === '#/musculacao') content = <PlansList data={data.dashboard} access={data.accesses[0] ?? null} onChanged={remote.reload} />
  else if (route === '#/vinculos') content = <LinksView data={data.dashboard} pending={data.pending} accesses={data.accesses} onChanged={remote.reload} />
  else if (route === '#/historico' && !isCoach) content = <History data={data.dashboard} />
  else content = <Overview data={data.dashboard} active={data.active} />

  return <div className="min-h-[calc(100svh-4rem)] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="border-b border-border bg-surface p-4 lg:border-r lg:border-b-0 lg:p-6"><a href="#/dashboard" aria-label="HybridLab — dashboard" className="mx-auto hidden w-fit lg:block"><img className="brand-logo h-28 w-28 object-contain" src="/hybridlab-logo.png" alt="HybridLab" width="112" height="112" /></a><p className="my-6 hidden text-center text-xs tracking-[0.16em] text-muted uppercase lg:block">{isCoach ? 'Área do professor' : 'Área do aluno'}</p><nav aria-label="Navegação principal" className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">{nav.map(([href, label, number]) => <a key={href} href={href} aria-current={currentNav === href || (href === '#/dashboard' && ['','#/login','#/registro'].includes(route)) ? 'page' : undefined} className="dash-nav"><span className="hidden text-xs opacity-50 lg:inline">{number}</span>{label}</a>)}</nav><div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4 lg:mt-12 lg:flex-col lg:items-start"><div className="min-w-0"><p className="truncate text-sm font-medium">{data?.dashboard.profile.displayName ?? 'Sua conta'}</p><p className="mt-1 text-xs text-muted">{data ? isCoach ? 'Professor' : 'Aluno' : 'Conectando…'}</p></div><button className="dash-secondary lg:mt-4" onClick={() => { clearSession(); window.location.hash = '/login' }}>Sair</button></div></aside>
    <main className="min-w-0 px-5 py-7 sm:p-8 xl:p-12"><div className="mx-auto max-w-6xl">{data && <div className="mb-5 flex justify-end"><button disabled={remote.loading} className="text-xs text-muted underline underline-offset-4" onClick={remote.reload}>{remote.loading ? 'Atualizando…' : 'Atualizar dados'}</button></div>}{data && remote.error && <ErrorNotice message={remote.error} retry={remote.reload} />}{content}</div></main>
  </div>
}

