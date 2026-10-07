import { useCallback, useEffect, useRef, useState } from 'react'
import { dashboardService as service } from '../../services/dashboardService'
import { hybridWeekService } from '../../services/hybridWeekService'
import { ApiError } from '../../services/api'
import { useAction, useRemote } from '../../hooks/useRemote'
import type { ActiveSession, DashboardData } from '../../types/dashboard'
import { Badge, ConfirmButton, Empty, ErrorNotice, Loading, Panel } from './UI'
import { dateTime, planStatus } from './format'
import { DayCard, DayForm } from './PlanEditor'
import { planSchedule } from './planSchedule'
import { planDetails } from './planDetails'
import './PlanView.css'

export default function PlanView({ id, dashboard, active, onChanged }: { id: number; dashboard: DashboardData; active: ActiveSession | null; onChanged: () => void }) {
  const load = useCallback(async () => {
    const [summary, full, versions] = await Promise.all([service.plan(id), service.fullPlan(id), service.versions(id)])
    return { plan: { ...full, ...summary }, versions }
  }, [id])
  const loadCalendar = useCallback(() => hybridWeekService.getActive().catch(error => {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }), [])
  const remote = useRemote(load)
  const calendar = useRemote(loadCalendar)
  const { reload } = remote
  const { reload: reloadCalendar } = calendar
  const previousDashboard = useRef(dashboard)
  useEffect(() => {
    if (previousDashboard.current !== dashboard) {
      previousDashboard.current = dashboard
      reload()
      reloadCalendar()
    }
  }, [dashboard, reload, reloadCalendar])
  const action = useAction()
  const [addDay, setAddDay] = useState(false)
  const [mobileActions, setMobileActions] = useState(() => window.matchMedia("(max-width: 767px)").matches)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const update = () => setMobileActions(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const tabs = useRef<HTMLDivElement>(null)
  if (remote.loading) return <Loading />
  if (remote.error || !remote.data) return <ErrorNotice message={remote.error} retry={remote.reload} />
  const { plan, versions } = remote.data
  const canManage = dashboard.profile.id === plan.studentId
  const editable = canManage && !plan.isPublished
  const currentCalendar = calendar.error || calendar.loading ? null : calendar.data
  const schedule = planSchedule(plan, currentCalendar)
  const details = planDetails(plan, currentCalendar, dashboard.recentSessions)
  const selected = details.days.find(item => item.day.id === selectedId) ?? details.days.find(item => item.status === 'Hoje') ?? details.days.find(item => item.status === 'Próximo') ?? details.days[0]
  const selectedIndex = details.days.findIndex(item => item === selected)
  const saved = () => { remote.reload(); onChanged() }
  const selectDay = (index: number, focus = false) => {
    const item = details.days[index]
    if (!item) return
    setSelectedId(item.day.id)
    const button = tabs.current?.querySelector<HTMLButtonElement>(`#plan-day-${item.day.id}`)
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    if (focus) button?.focus({ preventScroll: true })
  }
  function start(dayId: number) { void action.run(async () => { const session = await service.start(dayId); onChanged(); window.location.hash = `/treino/${session.id}` }) }

  return <div className="plan-content">
    <div className="plan-toolbar"><a className="auth-link text-sm" href="#/musculacao">← Voltar aos planos</a></div>
    <Panel>
      <div className="plan-summary-heading">
        <div className="plan-summary-title"><Badge>{planStatus(plan)}</Badge><h2>{plan.name}</h2><p className="text-xs text-muted">Criado em {dateTime(plan.createdAt)}</p></div>
        <div className="plan-controls">
          <label className="plan-version">Histórico de versões<select value={id} onChange={event => { window.location.hash = `/plano/${event.target.value}` }}>
            {(!versions.some(version => version.id === id) ? [plan, ...versions] : versions).slice().sort((a, b) => b.versionNumber - a.versionNumber).map(version => <option key={version.id} value={version.id}>Versão {version.versionNumber} · {planStatus(version)}</option>)}
          </select></label>
          {canManage && <details className="plan-actions" open={mobileActions || undefined}><summary className="dash-secondary" aria-label="Ações do plano">•••</summary><div className="plan-actions-menu">
            {editable ? <>
              <button className="dash-secondary" aria-expanded={addDay} onClick={() => setAddDay(!addDay)}>+ Adicionar dia</button>
              <ConfirmButton label="Publicar plano" message="Publicar esta versão? Ela ficará ativa e não poderá mais ser editada. O plano ativo anterior será preservado como histórico." disabled={action.busy} onConfirm={() => void action.run(() => service.publish(id), saved)} />
              <ConfirmButton label="Excluir plano" message={`Excluir o plano “${plan.name}”? Todos os dias e exercícios deste rascunho serão removidos permanentemente.`} disabled={action.busy} onConfirm={() => void action.run(() => service.deletePlan(id), () => { onChanged(); window.location.hash = '/musculacao' })} />
            </> : <button className="dash-secondary" disabled={action.busy || versions.some(v => v.previousVersionId === id && !v.isPublished)} onClick={() => void action.run(async () => { const draft = await service.newVersion(id); onChanged(); window.location.hash = `/plano/${draft.id}` })}>Criar nova versão</button>}
          </div></details>}
        </div>
      </div>
      {schedule && <dl className="plan-facts"><div><dt>Duração programada</dt><dd>{schedule.duration}</dd></div><div><dt>Frequência</dt><dd>{schedule.frequency}</dd></div>{details.week && <div><dt>No calendário {schedule.calendarName}</dt><dd>Semana {details.week.weekNumber} de {calendar.data?.totalWeeks}</dd></div>}{details.progress && !details.progress.limited && <div><dt>Concluídos nesta semana</dt><dd>{details.progress.completed} / {details.progress.total} treinos</dd></div>}</dl>}
      {calendar.loading ? <p className="plan-caption" role="status">Carregando programação…</p> : calendar.error ? <ErrorNotice message="Não foi possível carregar a programação do plano." retry={calendar.reload} /> : !schedule && <p className="plan-caption">Dias da semana, duração e frequência podem ser definidos em <a className="auth-link" href="#/semana">Minha semana</a>.</p>}
      {details.progress?.limited && <p className="plan-caption">O histórico recente é insuficiente para calcular o progresso desta semana.</p>}
      {plan.isPublished && <p className="plan-caption">Versão preservada. Para editar os treinos, crie uma nova versão.</p>}
      <ErrorNotice message={action.error} />
    </Panel>
    {active?.hasActiveSession && canManage && <div className="plan-resume"><p>Você tem um treino em andamento.</p><a href={`#/treino/${active.sessionId}`} className="dash-primary">Retomar treino →</a></div>}
    {addDay && editable && <Panel><DayForm planId={id} nextOrder={Math.max(0, ...plan.days.map(d => d.order)) + 1} onCancel={() => setAddDay(false)} onSaved={() => { setAddDay(false); saved() }} /></Panel>}
    {!selected ? <Empty>Este plano ainda não tem dias de treino.{editable ? ' Use Adicionar dia para criar o primeiro treino.' : ''}</Empty> : <>
      <div className="plan-day-heading"><h2>Treinos do plano</h2><span>{selectedIndex + 1} de {details.days.length}</span></div>
      <div className="plan-day-navigation">
        <button className="dash-secondary plan-day-arrow" aria-label="Treino anterior" disabled={selectedIndex <= 0} onClick={() => selectDay(selectedIndex - 1)}>←</button>
        <div ref={tabs} className="plan-day-tabs" role="tablist" aria-label="Dias e treinos do plano" onKeyDown={event => {
          const index = event.key === 'ArrowRight' ? (selectedIndex + 1) % details.days.length : event.key === 'ArrowLeft' ? (selectedIndex - 1 + details.days.length) % details.days.length : event.key === 'Home' ? 0 : event.key === 'End' ? details.days.length - 1 : null
          if (index !== null) { event.preventDefault(); selectDay(index, true) }
        }}>
          {details.days.map((item, index) => <button key={item.day.id} id={`plan-day-${item.day.id}`} role="tab" aria-selected={selected.day.id === item.day.id} aria-controls="plan-selected-day" tabIndex={selected.day.id === item.day.id ? 0 : -1} className="plan-day-tab" onClick={() => selectDay(index)} ref={node => {
            if (node && selected.day.id === item.day.id) {
              const rail = node.parentElement
              if (rail && (node.offsetLeft < rail.scrollLeft || node.offsetLeft + node.offsetWidth > rail.scrollLeft + rail.clientWidth)) rail.scrollLeft = node.offsetLeft
            }
          }}>
            <span className="plan-day-label">{item.label}</span><span className="plan-day-name" title={item.day.name}>{item.day.name}</span>{item.status && <span className="plan-day-status">{item.status}</span>}
          </button>)}
        </div>
        <button className="dash-secondary plan-day-arrow" aria-label="Próximo treino" disabled={selectedIndex === details.days.length - 1} onClick={() => selectDay(selectedIndex + 1)}>→</button>
      </div>
      <div id="plan-selected-day" role="tabpanel" aria-labelledby={`plan-day-${selected.day.id}`} tabIndex={0}>
        <DayCard key={selected.day.id} day={selected.day} planId={id} editable={editable} canStart={canManage && plan.isActive && plan.isPublished && active?.hasActiveSession === false} starting={action.busy} onStart={() => start(selected.day.id)} onSaved={saved} dayLabel={selected.label} lastSession={selected.lastSession} />
      </div>
    </>}
  </div>
}
