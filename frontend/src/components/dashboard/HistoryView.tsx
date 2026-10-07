import { useCallback, useState } from 'react'
import type { DashboardData, SessionSummary } from '../../types/dashboard'
import { dashboardService } from '../../services/dashboardService'
import { useRemote } from '../../hooks/useRemote'
import { dateTime, sessionStatusLabel } from './format'
import { sessionMetrics } from './historyMetrics'
import { Badge, Empty, Panel } from './UI'

function SessionCard({ session }: { session: SessionSummary }) {
 const load = useCallback(()=>dashboardService.session(session.id),[session.id])
 const remote=useRemote(load)
 const metrics=sessionMetrics(remote.data ?? session)
 return <article className="dash-panel">
  <a className="history-card" href={`#/treino/${session.id}`}>
   <div><h3>{session.dayName}</h3><p className="progress-muted mt-2">{dateTime(session.startedAt)}</p>
    <dl>{metrics.exercises !== null && <div><dt>Exercícios</dt><dd>{metrics.exercises}</dd></div>}{metrics.sets !== null && <div><dt>Séries registradas</dt><dd>{metrics.sets}</dd></div>}{metrics.duration !== null && <div><dt>Duração</dt><dd>{metrics.duration} min</dd></div>}{metrics.volume !== null && <div><dt>Volume com carga</dt><dd>{metrics.volume.toLocaleString('pt-BR')} kg</dd></div>}</dl>
   </div><div><span className={session.status === 1 ? 'status-complete rounded-full inline-flex' : session.status === 2 ? 'status-partial rounded-full border border-border inline-flex' : ''}><Badge>{sessionStatusLabel(session.status)}</Badge></span><p className="progress-muted mt-4">Ver sessão →</p></div>
  </a>
  {remote.loading && <p className="progress-muted mt-3" role="status">Carregando métricas…</p>}
  {remote.error && <button className="dash-secondary mt-3" onClick={remote.reload}>Tentar carregar métricas novamente</button>}
 </article>
}
export default function HistoryView({data}:{data:DashboardData}) {
 const [status,setStatus]=useState('all')
 const [from,setFrom]=useState('')
 const sessions=data.recentSessions.filter(session=>{
  const stamp=/(?:Z|[+-]\d{2}:\d{2})$/i.test(session.startedAt)?session.startedAt:`${session.startedAt}Z`
  const date=new Date(stamp)
  const day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
  return (status==='all'||session.status===Number(status))&&(!from||day>=from)
 })
 return <div className="space-y-6">
  <section className="dash-panel" aria-label="Resumo das sessões"><div className="history-stats"><div><span>Recentes</span><strong>{data.recentSessions.length}</strong></div><div><span>Concluídas</span><strong>{data.completedSessions}</strong></div><div><span>Parciais</span><strong>{data.partialSessions}</strong></div></div><p className="progress-muted mt-3">Concluídas e parciais consideram todo o histórico.</p></section>
  <Panel title="Suas sessões"><p className="progress-muted">As 20 sessões mais recentes. Os filtros se aplicam a essa lista.</p><div className="progress-toolbar mt-5"><label className="text-sm">Status<select className="auth-input mt-2" value={status} onChange={event=>setStatus(event.target.value)}><option value="all">Todos</option><option value="1">Concluído</option><option value="2">Parcial</option><option value="0">Em andamento</option></select></label><label className="text-sm">A partir de<input className="auth-input mt-2" type="date" value={from} onChange={event=>setFrom(event.target.value)} /></label><button className="dash-secondary" onClick={()=>{setStatus('all');setFrom('')}}>Limpar filtros</button></div></Panel>
  {!sessions.length ? <Empty>{data.recentSessions.length?'Nenhuma sessão corresponde aos filtros.':'Seus treinos aparecerão aqui quando você iniciar a primeira sessão.'}</Empty> : sessions.map(session=><SessionCard key={session.id} session={session} />)}
 </div>
}
