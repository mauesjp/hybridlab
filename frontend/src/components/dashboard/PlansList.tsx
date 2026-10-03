import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useAction, useRemote } from '../../hooks/useRemote'
import { dashboardService as service } from '../../services/dashboardService'
import { hybridWeekService } from '../../services/hybridWeekService'
import { ApiError } from '../../services/api'
import type { DashboardData, PlanSummary } from '../../types/dashboard'
import { Badge, Empty, ErrorNotice, Field, Panel } from './UI'
import { planStatus } from './format'
import { planSchedule } from './planSchedule'
import StrengthAnalyticsView from './StrengthAnalyticsView'

function PlanCard({ plan, calendar }: { plan: PlanSummary; calendar: ReturnType<typeof useCalendar> }) {
  const load = useCallback(() => service.fullPlan(plan.id), [plan.id])
  const details = useRemote(load)
  const schedule = details.data ? planSchedule(details.data, calendar.data) : null
  const loading = details.loading || calendar.loading
  const failed = Boolean(details.error || calendar.error)
  return <article className="dash-panel training-plan">
    <div className="flex flex-wrap gap-2"><Badge>{planStatus(plan)}</Badge><Badge>v{plan.versionNumber}</Badge></div>
    <h3 className="mt-5 text-xl font-semibold">{plan.name}</h3>
    <dl className="training-plan-facts">
      <div><dt>Duração</dt><dd>{loading ? 'Carregando…' : failed ? 'Indisponível' : schedule?.duration ?? 'Não definida'}</dd></div>
      <div><dt>Frequência semanal</dt><dd>{loading ? 'Carregando…' : failed ? 'Indisponível' : schedule?.frequency ?? 'Não definida'}</dd></div>
    </dl>
    {!loading && !failed && <p className="text-xs leading-5 text-muted">{schedule ? `No planejamento ${schedule.calendarName}.` : 'Defina a duração e a frequência em Minha semana.'}</p>}
    {failed && <p className="text-xs text-muted" role="alert">Não foi possível carregar a programação. <button className="underline" onClick={() => { details.reload(); calendar.reload() }}>Tentar novamente</button></p>}
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><a className="text-xs text-muted underline underline-offset-4" href="#/semana">Ver minha semana</a><a href={`#/plano/${plan.id}`} className="dash-primary">Abrir plano <span aria-hidden="true">→</span></a></div>
  </article>
}

function useCalendar(data: DashboardData) {
  const load = useCallback(() => {
    if (!data.plans.length) return Promise.resolve(null)
    return hybridWeekService.getActive().catch(error => {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
    })
  }, [data])
  return useRemote(load)
}

export default function PlansList({ data, onChanged }: { data: DashboardData; onChanged: () => void }) {
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('active')
  const action = useAction()
  const calendar = useCalendar(data)
  const plans = data.plans.filter(p => filter === 'all' || (filter === 'draft' ? !p.isPublished : p.isActive))
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    if (!name) return
    void action.run(async () => { const plan = await service.createPlan(name); onChanged(); window.location.hash = `/plano/${plan.id}` })
  }
  return <div className="training-content space-y-8">
    <div className="training-toolbar"><a href="#/historico" className="text-sm text-muted underline underline-offset-4">Histórico de treinos</a><button className="dash-primary" aria-expanded={creating} aria-controls="new-training-plan" onClick={() => setCreating(!creating)}>+ Novo plano</button></div>
    {creating && <div id="new-training-plan"><Panel title="Novo plano em rascunho"><form onSubmit={submit}><fieldset disabled={action.busy} className="space-y-4"><Field label="Nome do plano" name="name" required maxLength={100} placeholder="Ex.: Força · Outubro" autoFocus /><ErrorNotice message={action.error} /><div className="flex flex-wrap gap-2"><button className="dash-primary">{action.busy ? 'Criando…' : 'Criar plano'}</button><button type="button" className="dash-secondary" onClick={() => setCreating(false)}>Cancelar</button></div></fieldset></form></Panel></div>}
    <section aria-labelledby="plans-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 id="plans-heading" className="text-xl font-semibold">{filter === 'active' ? 'Planos ativos' : filter === 'draft' ? 'Rascunhos' : 'Todos os planos'}</h2><div className="training-filters flex flex-wrap gap-2" role="group" aria-label="Filtrar planos">{[['active', 'Ativos'], ['all', 'Todos'], ['draft', 'Rascunhos']].map(([value, label]) => <button key={value} aria-pressed={filter === value} className="dash-secondary" onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      {!plans.length ? <Empty>{filter === 'active' ? 'Você ainda não tem planos ativos. Crie um plano ou publique um dos seus rascunhos.' : 'Nenhum plano neste filtro.'}</Empty> : <div className={`grid gap-5 ${plans.length > 1 ? 'lg:grid-cols-2' : ''}`}>{plans.map(plan => <PlanCard key={plan.id} plan={plan} calendar={calendar} />)}</div>}
    </section>
    <StrengthAnalyticsView refreshKey={data} />
  </div>
}

