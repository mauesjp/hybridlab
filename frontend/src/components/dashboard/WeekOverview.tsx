import { useCallback } from 'react'
import type { DashboardData } from '../../types/dashboard'
import type { HybridTrainingPlan } from '../../types/hybridWeek'
import { runningService } from '../../services/runningService'
import { useRemote } from '../../hooks/useRemote'
import { localDateKey, weeklyProgress } from './overviewMetrics'
import { Badge, Empty, ErrorNotice, Panel } from './UI'

const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const periods = ['Sem período definido', 'Manhã', 'Tarde', 'Noite']
const date = (value: string) => new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR', {day:'2-digit',month:'short'})
export default function WeekOverview({ plans, dashboard, route, onNew, onEdit }: { plans: HybridTrainingPlan[]; dashboard: DashboardData; route: string; onNew: () => void; onEdit: (plan: HybridTrainingPlan, week: number, configure?: boolean) => void }) {
 const load = useCallback(() => runningService.getActivities(), [])
 const running = useRemote(load)
 const match = /^#\/semana\/(\d+)\/(\d+)$/.exec(route)
 const plan = plans.find(item => item.id === Number(match?.[1]))
 const week = plan?.weeks.find(item => item.weekNumber === Number(match?.[2]))
 const today = localDateKey()
 if (match && (!plan || !week)) return <><a className="dash-secondary" href="#/semana">← Todas as semanas</a><Empty>Semana não encontrada.</Empty></>
 if (plan && week) return <div className="space-y-6">
   <div className="progress-toolbar"><a href="#/semana" className="dash-secondary">← Todas as semanas</a><button className="dash-primary" onClick={() => onEdit(plan,week.weekNumber)}>Editar semana</button></div>
   <Panel title={week.name || `Semana ${week.weekNumber}`}><p className="progress-muted">{plan.name} · {date(week.startDate)} — {date(week.endDate)}</p>{week.notes && <p className="mt-4">{week.notes}</p>}</Panel>
   <div className="progress-grid">{[1,2,3,4,5,6,0].map(day => <Panel key={day} title={days[day]}>{week.sessions.filter(slot => slot.dayOfWeek === day).sort((a,b) => a.sequence-b.sequence).map(slot => <div key={slot.id} className="metric-card mb-3"><Badge>{slot.sessionType === 0 ? 'Musculação' : 'Corrida'}</Badge><h3 className="mt-3">{slot.sessionName || 'Treino planejado'}</h3><p className="progress-muted">{periods[slot.period]}</p>{slot.notes && <p className="mt-2 text-sm">{slot.notes}</p>}</div>)}{!week.sessions.some(slot=>slot.dayOfWeek===day) && <p className="progress-muted">Descanso</p>}</Panel>)}</div>
 </div>
 return <div className="space-y-6">
  <div className="progress-toolbar"><p className="progress-muted">Seu planejamento completo. Abra uma semana para ver os dias.</p><button className="dash-primary" onClick={onNew}>Novo planejamento</button></div>
  {!plans.length && <Empty>Nenhum planejamento cadastrado. Crie o primeiro para organizar suas semanas.</Empty>}
  {running.error && <ErrorNotice message="Não foi possível consultar as corridas para calcular as conclusões." retry={running.reload} />}
  {[...plans].sort((a,b)=>Number(b.isActive)-Number(a.isActive)).map((item) => <section key={item.id}>
   <div className="progress-toolbar"><div><h2>{item.name}</h2><p className="progress-muted">{item.isActive ? 'Planejamento ativo' : 'Planejamento salvo'} · {item.weeks.length} semanas</p></div><button className="dash-secondary" onClick={()=>onEdit(item,1,true)}>Configurar planejamento</button></div>
   <div className="flex justify-end gap-2 mb-3"><button className="dash-secondary" aria-label={`Semanas anteriores de ${item.name}`} onClick={()=>document.getElementById(`weeks-${item.id}`)?.scrollBy({left:-380,behavior:'smooth'})}>←</button><button className="dash-secondary" aria-label={`Próximas semanas de ${item.name}`} onClick={()=>document.getElementById(`weeks-${item.id}`)?.scrollBy({left:380,behavior:'smooth'})}>→</button></div>
   <div id={`weeks-${item.id}`} className="week-rail" aria-label={`Semanas de ${item.name}`} tabIndex={0}>
    {[...item.weeks].sort((a,b)=>a.weekNumber-b.weekNumber).map(w=>{
     const current=today>=w.startDate.slice(0,10)&&today<=w.endDate.slice(0,10)
     const progress=weeklyProgress(w,dashboard.recentSessions,running.data ?? [])
     const known=!progress.limited&&!running.loading&&!running.error
     const state=current?'Atual':today<w.startDate.slice(0,10)?'Futura':known&&progress.total>0&&progress.completed===progress.total?'Concluída':'Encerrada'
     return <a key={w.id} className="dash-panel week-card" data-current={current} href={`#/semana/${item.id}/${w.weekNumber}`}>
      <div className="flex justify-between gap-2"><span className="dash-eyebrow">Semana {w.weekNumber}</span><Badge>{state}</Badge></div>
      <h3>{w.name || `Semana ${w.weekNumber}`}</h3><p className="progress-muted">{date(w.startDate)} — {date(w.endDate)}</p>
      <p>{w.sessions.length} {w.sessions.length === 1 ? "treino planejado" : "treinos planejados"}</p><p className="progress-muted">{known?`${progress.completed} concluídos`:'Conclusões indisponíveis no histórico recente'}</p>
      <p className="progress-muted">{w.sessions.filter(s=>s.sessionType===0).length} musculação · {w.sessions.filter(s=>s.sessionType===1).length} corrida<br/>{[1,2,3,4,5,6,0].filter(day=>w.sessions.some(s=>s.dayOfWeek===day)).map(day=>days[day].slice(0,3)).join(' · ') || 'Semana de descanso'}</p>
      <span className="dash-primary mt-auto">Ver semana →</span>
     </a>
    })}
   </div>
  </section>)}
  {!!plans.length && <p className="progress-muted">Conclusões de musculação usam o treino e a data. Corridas seguem a regra atual de correspondência pela data, sem vínculo com um treino específico. O histórico de musculação contém as 20 sessões mais recentes.</p>}
 </div>
}
