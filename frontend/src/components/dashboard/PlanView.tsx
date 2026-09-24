import { useCallback, useState } from 'react'
import { dashboardService as service } from '../../services/dashboardService'
import { useAction, useRemote } from '../../hooks/useRemote'
import type { ActiveSession, DashboardData, PlanningAccess } from '../../types/dashboard'
import { Badge, ConfirmButton, Empty, ErrorNotice, Loading, Panel } from './UI'
import { dateTime, planStatus } from './format'
import { DayCard, DayForm } from './PlanEditor'

export default function PlanView({ id, dashboard, access, active, onChanged }: { id: number; dashboard: DashboardData; access: PlanningAccess | null; active: ActiveSession | null; onChanged: () => void }) {
  const load = useCallback(async () => {
    const [summary, full, versions] = await Promise.all([service.plan(id), service.fullPlan(id), service.versions(id)])
    return { plan: { ...full, ...summary }, versions }
  }, [id])
  const remote = useRemote(load)
  const action = useAction()
  const [addDay, setAddDay] = useState(false)
  if (remote.loading) return <Loading />
  if (remote.error || !remote.data) return <ErrorNotice message={remote.error} retry={remote.reload} />
  const { plan, versions } = remote.data
  const isStudent = dashboard.profile.role === 'Student'
  const canManage = isStudent ? access?.canManagePlanning === true : dashboard.links.some(link => link.studentId === plan.studentId && link.modality === 0 && link.status === 1)
  const editable = canManage && !plan.isPublished
  const saved = () => { remote.reload(); onChanged() }
  function start(dayId: number) { void action.run(async () => { const session = await service.start(dayId); onChanged(); window.location.hash = `/treino/${session.id}` }) }
  return <div className="space-y-6">
    <a className="auth-link text-sm" href="#/musculacao">← Voltar aos planos</a>
    <Panel><div className="flex flex-wrap gap-2"><Badge>{planStatus(plan)}</Badge><Badge>Versão {plan.versionNumber}</Badge></div><h1 className="mt-4 text-3xl font-semibold tracking-tight">{plan.name}</h1><p className="mt-2 text-sm text-muted">Criado em {dateTime(plan.createdAt)}</p>
      {plan.isPublished && <p className="mt-4 text-sm text-muted">Esta versão está preservada. Alterações são feitas em um novo rascunho.</p>}
      {!canManage && <p className="mt-4 text-sm text-muted">O planejamento é gerenciado pelo professor de musculação. Você pode consultar e executar seu plano ativo.</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        {editable && (
          <>
            <button 
              className="dash-secondary" 
              onClick={() => setAddDay(!addDay)}
            >
              + Adicionar dia
            </button>
            
            <ConfirmButton 
              label="Publicar plano" 
              message="Publicar esta versão? Ela ficará ativa e não poderá mais ser editada. O plano ativo anterior será preservado como histórico." 
              disabled={action.busy} 
              onConfirm={() => 
                void action.run(
                  () => service.publish(id), 
                  saved
                )
              } 
            /> 
            
            <ConfirmButton 
              label="Excluir plano" 
              message={`Excluir o plano "${plan.name}"? Todos os dias e exercícios deste rascunho serão removidos permanentemente.`}
              disabled = {action.busy}
              onConfirm={() => 
                void action.run(
                  () => service.deletePlan(id),
                  () => {
                    onChanged()
                    window.location.hash = '/musculacao'
                  }
                )
              }
            />
          </>
        )}
        {canManage && plan.isPublished && <button className="dash-primary" disabled={action.busy || versions.some(v => v.previousVersionId === id && !v.isPublished)} onClick={() => void action.run(async () => { const draft = await service.newVersion(id); onChanged(); window.location.hash = `/plano/${draft.id}` })}>Criar nova versão</button>}
      </div><ErrorNotice message={action.error} />
    </Panel>
    {active?.hasActiveSession && isStudent && <Panel><p className="mb-3 text-sm">Você já tem um treino em andamento.</p><a href={`#/treino/${active.sessionId}`} className="dash-primary">Retomar treino →</a></Panel>}
    {addDay && editable && <Panel><DayForm planId={id} nextOrder={Math.max(0, ...plan.days.map(d => d.order)) + 1} onCancel={() => setAddDay(false)} onSaved={() => { setAddDay(false); saved() }} /></Panel>}
    {!plan.days.length && <Empty>Este plano ainda não tem dias de treino.{editable ? ' Adicione o primeiro dia para montar sua rotina.' : ''}</Empty>}
    {[...plan.days].sort((a, b) => a.order - b.order).map(day => <DayCard key={day.id} day={day} planId={id} editable={editable} canStart={isStudent && plan.isActive && plan.isPublished && active?.hasActiveSession === false} starting={action.busy} onStart={() => start(day.id)} onSaved={saved} />)}
    <Panel title="Histórico de versões"><div className="space-y-3">{versions.map(version => <a key={version.id} href={`#/plano/${version.id}`} aria-current={version.id === id ? 'page' : undefined} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 hover:bg-control"><span>Versão {version.versionNumber}{version.id === id ? ' · visualizando' : ''}</span><Badge>{planStatus(version)}</Badge></a>)}</div></Panel>
  </div>
}

