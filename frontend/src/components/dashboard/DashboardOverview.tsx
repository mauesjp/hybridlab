import { useCallback, useRef } from 'react'
import { useAction, useRemote } from '../../hooks/useRemote'
import { dashboardService } from '../../services/dashboardService'
import { clearSession, ApiError } from '../../services/api'
import { hybridWeekService } from '../../services/hybridWeekService'
import { runningService } from '../../services/runningService'
import { physicalAssessmentService } from '../../services/physicalAssessmentService'
import { bodyCompositionService } from '../../services/bodyCompositionService'
import type { ActiveSession, BodyWeightEntry, DashboardData } from '../../types/dashboard'
import { localDateKey, weeklyProgress, weightSummary } from './overviewMetrics'
import '../AuthLayout.css'
import './DashboardOverview.css'

const asset = (name: string) => `/dashboard/${name}`
const number = (value: number | null | undefined, unit = '') => value == null ? '—' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}${unit}`
const periods = ['Sem período', 'Manhã', 'Tarde', 'Noite']
const links = [{ href: '#/semana', label: 'Minha semana' }, { href: '#/peso', label: 'Peso corporal' }, { href: '#/avaliacao', label: 'Avaliação física' }, { href: '#/historico', label: 'Histórico de treinos' }]

interface Props {
  data: DashboardData | null
  active: ActiveSession | null
  weightEntries: BodyWeightEntry[]
  goalWeight: number | null
  loading: boolean
  error: string
  reload: () => void
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="overview-metric"><dt>{label}</dt><dd>{value}</dd></div>
}

export default function DashboardOverview({ data, active, weightEntries, goalWeight, loading, error, reload }: Props) {
  const account = useRef<HTMLDialogElement>(null)
  const start = useAction()
  const load = useCallback(async () => {
    if (!data) return null
    const results = await Promise.allSettled([
      hybridWeekService.getToday(localDateKey()),
      hybridWeekService.getActive().catch(error => { if (error instanceof ApiError && error.status === 404) return null; throw error }),
      runningService.getActivities(),
      physicalAssessmentService.getAll().then(async assessments => {
        const latest = [...assessments].sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate) || b.id - a.id)[0]
        return latest ? bodyCompositionService.getAssessmentComposition(latest.id) : null
      }),
    ])
    const [today, plan, activities, assessment] = results
    return {
      today: today.status === 'fulfilled' ? today.value : null,
      plan: plan.status === 'fulfilled' ? plan.value : null,
      activities: activities.status === 'fulfilled' ? activities.value : [],
      assessment: assessment.status === 'fulfilled' ? assessment.value : null,
      trainingError: today.status === 'rejected',
      progressError: plan.status === 'rejected' || activities.status === 'rejected',
      assessmentError: assessment.status === 'rejected',
    }
  }, [data])
  const extra = useRemote(load)
  const today = extra.data?.today
  const week = extra.data?.plan?.weeks.find(week => week.id === today?.weekId || week.weekNumber === today?.weekNumber)
  const progress = week && data ? weeklyProgress(week, data.recentSessions, extra.data?.activities ?? []) : null
  const assessment = extra.data?.assessment
  const weight = weightSummary(weightEntries)
  const name = data?.profile.displayName.trim().split(/\s+/)[0]
  const refresh = () => { reload(); extra.reload() }
  const loadingExtra = extra.loading || !extra.data

  return (
    <div className="overview-page">
      <div className="overview-container">
        <header className="overview-header">
          <a href="#/dashboard" aria-label="HybridLab — dashboard" className="overview-brand"><img src="/hybridlab-logo-color.png" alt="HybridLab" width="130" height="130" /></a>
          <div className="overview-greeting"><h1>Bem-vindo de volta{name ? `, ${name}` : ''}</h1><p>Pronto para evoluir hoje?</p></div>
          <div className="overview-tools">
            <details className="overview-notifications"><summary aria-label="Notificações"><img src={asset('notification.png')} alt="" width="27" height="27" /></summary><p>As notificações ainda não estão disponíveis.</p></details>
            <button type="button" aria-label="Abrir minha conta" onClick={() => account.current?.showModal()}><img className="overview-avatar" src={asset('avatar.png')} alt="" width="60" height="60" /></button>
          </div>
        </header>
        <main>
          <p className="overview-date">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          {!data ? <section className="overview-card overview-status" role={loading ? 'status' : 'alert'}>{loading ? 'Carregando seu Dashboard…' : <><p>{error || 'Não foi possível carregar seus dados.'}</p><button className="overview-action" onClick={reload}>Tentar novamente</button></>}</section> : <>
            {error && <p className="overview-error" role="alert">{error} <button onClick={reload}>Tentar novamente</button></p>}
            <div className="overview-hero">
              <section className="overview-card overview-training" aria-labelledby="today-heading">
                <div className="overview-training-heading"><h2 id="today-heading">Treino de hoje</h2>{today?.weekNumber && <a href="#/semana">Semana {today.weekNumber} de {today.totalWeeks} · {today.planName}</a>}</div>
                {loadingExtra ? <p className="overview-empty" role="status">Carregando os treinos de hoje…</p> : extra.data?.trainingError ? <div className="overview-empty" role="alert"><p>Não foi possível carregar seus treinos.</p><button onClick={extra.reload} className="overview-action">Tentar novamente</button></div> : today?.sessions.length && !today.isBeforePlan && !today.isAfterPlan ? <div className="overview-sessions">
                  {today.sessions.map(session => <article className="overview-session" key={session.id}>
                    <div><p>{session.sessionType === 0 ? 'Musculação' : 'Corrida'}</p><span>{periods[session.period]}</span></div>
                    <h3>{session.sessionName || 'Treino planejado'}</h3>
                    {session.sessionType === 0 && !active?.hasActiveSession && session.strengthWorkoutDayId !== null ? <button className="overview-action" disabled={start.busy} onClick={() => start.run(async () => { const response = await dashboardService.start(session.strengthWorkoutDayId!); window.location.hash = `#/treino/${response.id}`; reload() })}>{start.busy ? 'Iniciando…' : 'Começar treino'}</button> : <a className="overview-action" href={session.sessionType === 0 ? active?.hasActiveSession ? `#/treino/${active.sessionId}` : '#/musculacao' : '#/corrida'}>{session.sessionType === 0 && active?.hasActiveSession ? 'Retomar treino' : session.sessionType === 1 ? 'Abrir corrida' : 'Abrir musculação'}</a>}
                  </article>)}
                </div> : <div className="overview-empty"><h3>{!today?.hasActivePlan ? 'Organize sua semana' : today.isBeforePlan ? 'Seu ciclo começa em breve' : today.isAfterPlan ? 'Ciclo concluído' : 'Dia de descanso'}</h3><p>{!today?.hasActivePlan ? 'Combine musculação e corrida no seu planejamento.' : today.isBeforePlan ? 'Confira a data de início do seu planejamento.' : today.isAfterPlan ? 'Prepare seu próximo planejamento.' : 'Aproveite o dia para recuperar e evoluir.'}</p><a href="#/semana" className="overview-action">{!today?.hasActivePlan ? 'Criar planejamento' : 'Ver minha semana'}</a></div>}
                {start.error && <p role="alert" className="overview-error">{start.error}</p>}
                {active?.hasActiveSession && !today?.sessions.some(session => session.sessionType === 0) && <a href={`#/treino/${active.sessionId}`} className="overview-resume">Retomar treino em andamento →</a>}
              </section>
              <section className="overview-card overview-progress" aria-labelledby="progress-heading">
                <h2 id="progress-heading">Progresso semanal</h2>
                {loadingExtra ? <p className="overview-empty" role="status">Carregando progresso…</p> : extra.data?.progressError || progress?.limited ? <div className="overview-empty"><p>{progress?.limited ? 'Histórico insuficiente para calcular esta semana.' : 'Não foi possível carregar o progresso.'}</p><button onClick={refresh} className="overview-action">Atualizar</button></div> : progress?.total ? <><p className="overview-progress-number">{progress.completed}/{progress.total}</p><p className="overview-progress-percent">{progress.percent}%</p><div className="overview-dots" aria-label={`${progress.completed} de ${progress.total} sessões registradas`} title="Musculação concluída e corridas registradas no dia planejado.">{progress.slots.map((complete, index) => <img key={index} src={asset(complete ? 'progress-complete.svg' : 'progress-pending.svg')} alt="" />)}</div><span className="sr-only">Corridas são contabilizadas pela data do registro.</span></> : <div className="overview-empty"><p>{today?.isBeforePlan ? 'Seu planejamento ainda não começou.' : today?.isAfterPlan ? 'Seu ciclo chegou ao fim.' : 'Nenhum treino planejado nesta semana.'}</p><a href="#/semana" className="overview-text-link">Ver planejamento</a></div>}
              </section>
            </div>
            <div className="overview-metrics">
              <section className="overview-card overview-weight" aria-labelledby="weight-heading"><h2 id="weight-heading">Peso e evolução</h2>{weightEntries.length ? <dl className="overview-metric-grid"><Metric label="Meta" value={number(goalWeight, ' kg')} /><Metric label="Peso atual" value={number(weight.current, ' kg')} /><Metric label="Média 7 dias" value={number(weight.average, ' kg')} /><Metric label="Variação" value={`${weight.variation != null && weight.variation > 0 ? '+' : ''}${number(weight.variation, ' kg')}`} /></dl> : <div className="overview-empty"><p>Registre sua primeira pesagem para acompanhar sua evolução.</p><a href="#/peso" className="overview-action">Registrar peso</a></div>}<a className="overview-detail" href="#/peso">Ver detalhes</a></section>
              <section className="overview-card overview-assessment" aria-labelledby="assessment-heading"><h2 id="assessment-heading">Avaliação física</h2>{loadingExtra ? <p className="overview-empty" role="status">Carregando avaliação…</p> : extra.data?.assessmentError ? <div className="overview-empty" role="alert"><p>Não foi possível carregar sua avaliação.</p><button onClick={extra.reload} className="overview-action">Tentar novamente</button></div> : assessment ? <><div className="overview-last-assessment"><p>Última avaliação</p><time dateTime={assessment.assessmentDate}>{new Date(`${assessment.assessmentDate.slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR')}</time></div><dl className="overview-metric-grid"><Metric label="Peso" value={number(assessment.weightKg, ' kg')} /><Metric label="% de gordura" value={number(assessment.bodyFatPercentage, '%')} /><Metric label="IMC" value={number(assessment.bmi)} /><Metric label="Massa magra" value={number(assessment.leanMassKg, ' kg')} /></dl></> : <div className="overview-empty"><p>Sua primeira avaliação aparecerá aqui.</p><a href="#/avaliacao" className="overview-action">Adicionar avaliação</a></div>}<a className="overview-detail" href="#/avaliacao">Ver detalhes</a></section>
              <section className="overview-coming"><h2>Sono</h2><p>Em breve</p></section>
              <section className="overview-coming"><h2>Nutrição</h2><p>Em breve</p></section>
            </div>
          </>}
        </main>
      </div>
      <nav className="overview-navigation" aria-label="Navegação principal">
        <a href="#/dashboard" aria-label="Dashboard" aria-current="page" className="overview-nav-active"><img className="overview-nav-background" src={asset('nav-active.svg')} alt="" /><img className="overview-nav-icon" src={asset('home.png')} alt="" width="46" height="46" /></a>
        <a href="#/musculacao" aria-label="Musculação"><img className="overview-nav-background" src={asset('nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('strength.png')} alt="" width="40" height="40" /></a>
        <a href="#/corrida" aria-label="Corrida"><img className="overview-nav-background" src={asset('nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('running.png')} alt="" width="40" height="40" /></a>
        <button type="button" disabled aria-label="Nutrição — em breve"><img className="overview-nav-background" src={asset('nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('nutrition.png')} alt="" width="40" height="40" /></button>
        <button type="button" aria-label="Minha conta e módulos" onClick={() => account.current?.showModal()}><img className="overview-nav-background" src={asset('nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('profile.png')} alt="" width="40" height="40" /></button>
      </nav>
      <dialog ref={account} className="overview-account" aria-labelledby="account-heading"><div><h2 id="account-heading">{data?.profile.displayName || 'Minha conta'}</h2><button type="button" onClick={() => account.current?.close()} aria-label="Fechar minha conta">×</button></div><p>Conta pessoal</p><nav aria-label="Módulos da conta">{links.map(link => <a key={link.href} href={link.href} onClick={() => account.current?.close()}>{link.label} →</a>)}</nav><button className="overview-action" disabled={loading || extra.loading} onClick={refresh}>{loading || extra.loading ? 'Atualizando…' : 'Atualizar dados'}</button><button className="overview-logout" onClick={() => { clearSession(); window.location.hash = '#/login' }}>Sair da conta</button></dialog>
    </div>
  )
}
