import type { FormEvent } from 'react'
import { useAction } from '../../hooks/useRemote'
import { dashboardService as service } from '../../services/dashboardService'
import type { CoachLink, DashboardData, Modality, PlanningAccess } from '../../types/dashboard'
import { Badge, ConfirmButton, Empty, ErrorNotice, Field, Panel } from './UI'
import { dateTime } from './format'

const statuses = ['Pendente', 'Ativo', 'Recusado', 'Encerrado']
export default function LinksView({ data, pending, accesses, onChanged }: { data: DashboardData; pending: CoachLink[]; accesses: PlanningAccess[]; onChanged: () => void }) {
  const action = useAction()
  const isCoach = data.profile.role === 'Coach'
  const available = ([0, 1] as Modality[]).filter(modality => !data.links.some(l => l.modality === modality && (l.status === 0 || l.status === 1)))
  function request(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const code = String(form.get('code')).trim()
    if (!code) return
    void action.run(() => service.requestLink(code, Number(form.get('modality')) as Modality), onChanged)
  }
  const pendingIds = new Set(pending.map(l => l.id))
  return <div className="space-y-6"><div><p className="dash-eyebrow">Acompanhamento</p><h1 className="dash-title">{isCoach ? 'Meus alunos' : 'Meus professores'}</h1><p className="mt-3 text-sm text-muted">Vínculos e permissões por modalidade.</p></div>
    <ErrorNotice message={action.error} />
    {isCoach ? <Panel title="Seu código de professor"><p className="break-all font-mono text-2xl tracking-widest">{data.profile.coachCode}</p><p className="mt-3 text-sm leading-6 text-muted">Compartilhe este código com seus alunos para receber solicitações.</p><div className="mt-4 flex gap-2">{data.profile.canCoachStrength && <Badge>Musculação</Badge>}{data.profile.canCoachRunning && <Badge>Corrida</Badge>}</div></Panel> : <>
      <Panel title="Controle do planejamento"><div className="grid gap-3 sm:grid-cols-2">{accesses.map(a => <div key={a.modality} className="rounded-xl border border-border p-4"><p className="font-medium">{a.modality === 0 ? 'Musculação' : 'Corrida'}</p><p className="mt-2 text-sm text-muted">{a.canManagePlanning ? 'Você gerencia seu planejamento.' : 'Seu professor gerencia o planejamento.'}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-muted">O vínculo de corrida já está disponível. O planejamento e a execução de corrida ainda não fazem parte desta versão.</p></Panel>
      {available.length > 0 && <Panel title="Conectar com um professor"><form onSubmit={request}><fieldset disabled={action.busy} className="space-y-4"><Field label="Código do professor" name="code" required placeholder="Ex.: COACH001" /><label className="block text-sm font-medium">Modalidade<select className="auth-input mt-2" name="modality">{available.map(m => <option key={m} value={m}>{m === 0 ? 'Musculação' : 'Corrida'}</option>)}</select></label><button className="dash-primary">{action.busy ? 'Enviando…' : 'Solicitar vínculo'}</button></fieldset></form></Panel>}
    </>}
    <Panel title={isCoach ? 'Solicitações e vínculos' : 'Seus vínculos'}>{!data.links.length ? <Empty>{isCoach ? 'Nenhuma solicitação recebida. Compartilhe seu código para começar.' : 'Você ainda não possui vínculos com professores.'}</Empty> : <div className="space-y-4">{data.links.map(link => <div key={link.id} className="rounded-xl border border-border p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{isCoach ? link.studentName : link.coachName}</h3><p className="mt-2 text-sm text-muted">{link.modality === 0 ? 'Musculação' : 'Corrida'} · {dateTime(link.requestedAt)}</p></div><Badge>{statuses[link.status]}</Badge></div>
      {isCoach && link.status === 0 && pendingIds.has(link.id) && <div className="mt-4 flex flex-wrap gap-2"><button className="dash-primary" disabled={action.busy} onClick={() => void action.run(() => service.respondLink(link.id, true), onChanged)}>Aceitar</button><button className="dash-secondary" disabled={action.busy} onClick={() => void action.run(() => service.respondLink(link.id, false), onChanged)}>Recusar</button></div>}
      {link.status === 1 && <div className="mt-4"><ConfirmButton label="Encerrar vínculo" message="Encerrar este vínculo? O controle do planejamento desta modalidade voltará para o aluno." disabled={action.busy} onConfirm={() => void action.run(() => service.unlink(link.id), onChanged)} /></div>}
    </div>)}</div>}</Panel>
  </div>
}

