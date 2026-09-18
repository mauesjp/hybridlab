import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAction } from '../../hooks/useRemote'
import { dashboardService as service } from '../../services/dashboardService'
import type { DashboardData, PlanningAccess } from '../../types/dashboard'
import { Badge, Empty, ErrorNotice, Field, Panel } from './UI'
import { planStatus } from './format'

export default function PlansList({ data, access, onChanged }: { data: DashboardData; access: PlanningAccess | null; onChanged: () => void }) {
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('all')
  const action = useAction()
  const isCoach = data.profile.role === 'Coach'
  const students = [...new Map(data.links.filter(l => l.status === 1 && l.modality === 0).map(l => [l.studentId, l])).values()]
  const canCreate = isCoach ? students.length > 0 : access?.canManagePlanning === true
  const plans = data.plans.filter(p => filter === 'all' || (filter === 'draft' ? !p.isPublished : p.isActive))
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    if (!name) return
    void action.run(async () => { const plan = await service.createPlan(name, isCoach ? Number(form.get('studentId')) : undefined); onChanged(); window.location.hash = `/plano/${plan.id}` })
  }
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="dash-eyebrow">Planejamento</p><h1 className="dash-title">Musculação</h1><p className="mt-3 text-sm text-muted">Organize seus dias, exercícios e versões de treino.</p></div>{canCreate && <button className="dash-primary" onClick={() => setCreating(!creating)}>+ Novo plano</button>}</div>
    {creating && canCreate && <Panel title="Novo plano em rascunho"><form onSubmit={submit}><fieldset disabled={action.busy} className="space-y-4"><Field label="Nome do plano" name="name" required maxLength={100} placeholder="Ex.: Força · Setembro" />{isCoach && <label className="block text-sm font-medium">Aluno<select className="auth-input mt-2" name="studentId" required>{students.map(l => <option key={l.studentId} value={l.studentId}>{l.studentName}</option>)}</select></label>}<ErrorNotice message={action.error} /><div className="flex gap-2"><button className="dash-primary">{action.busy ? 'Criando…' : 'Criar plano'}</button><button type="button" className="dash-secondary" onClick={() => setCreating(false)}>Cancelar</button></div></fieldset></form></Panel>}
    {!canCreate && <p className="text-sm leading-6 text-muted">{isCoach ? 'Aceite um vínculo de musculação para começar a planejar os treinos do aluno.' : 'Seu professor de musculação gerencia o planejamento. Os planos disponíveis aparecem abaixo.'}</p>}
    <div className="flex flex-wrap gap-2" aria-label="Filtrar planos">{[['all', 'Todos'], ['active', 'Ativos'], ['draft', 'Rascunhos']].map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'dash-primary' : 'dash-secondary'} onClick={() => setFilter(value)}>{label}</button>)}</div>
    {!plans.length ? <Empty>Nenhum plano neste filtro.{canCreate ? ' Crie um plano para começar.' : ''}</Empty> : <div className="grid gap-4 xl:grid-cols-2">{plans.map(plan => <a key={plan.id} href={`#/plano/${plan.id}`} className="dash-panel block hover:border-foreground"><div className="flex flex-wrap gap-2"><Badge>{planStatus(plan)}</Badge><Badge>v{plan.versionNumber}</Badge></div><h2 className="mt-5 text-xl font-semibold">{plan.name}</h2>{isCoach && <p className="mt-2 text-sm text-muted">{students.find(s => s.studentId === plan.studentId)?.studentName ?? 'Aluno'}</p>}<p className="mt-6 text-sm font-medium">Abrir plano <span aria-hidden="true">→</span></p></a>)}</div>}
  </div>
}

