import { useEffect, useRef, useState } from 'react';
import type { RunningActivity, RunningWorkout } from '../../types/running';
import { blockTypeLabels, formatBlock, formatDuration, formatFullDate, formatPace, workoutTotals } from './runningModel';
import PaceChart from './PaceChart';

const km = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`;

function WorkoutFacts({ workout }: { workout: RunningWorkout }) {
  const totals = workoutTotals(workout);
  return <dl className="running-facts">
    <div><dt>Etapas</dt><dd>{workout.blocks.length}</dd></div>
    {totals.duration !== null && <div><dt>Duração estimada</dt><dd>{formatDuration(totals.duration)}</dd></div>}
    {totals.distance !== null && <div><dt>Distância estimada</dt><dd>{km(totals.distance)}</dd></div>}
    {totals.paces.length > 0 && <div><dt>Pace alvo</dt><dd>{totals.paces.length === 1 ? formatPace(totals.paces[0]) : `${formatPace(Math.min(...totals.paces))} – ${formatPace(Math.max(...totals.paces))}`}</dd></div>}
  </dl>;
}

function ActivityFacts({ activity }: { activity: RunningActivity }) {
  return <dl className="running-facts running-activity-facts">
    <div><dt>Distância</dt><dd>{km(activity.distanceKm)}</dd></div>
    <div><dt>Tempo</dt><dd>{formatDuration(activity.durationSeconds)}</dd></div>
    <div><dt>Pace médio</dt><dd>{formatPace(activity.averagePaceSecondsPerKm)}</dd></div>
    {activity.averageHeartRate !== null && <div><dt>FC média</dt><dd>{activity.averageHeartRate} bpm</dd></div>}
    {activity.rpe !== null && <div><dt>RPE</dt><dd>{activity.rpe}/10</dd></div>}
  </dl>;
}

function WorkoutCarousel({ workouts }: { workouts: RunningWorkout[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => setEdges({ left: element.scrollLeft > 2, right: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener('scroll', update); };
  }, [workouts.length]);
  function scroll(direction: number) {
    const element = track.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  return <section aria-labelledby="running-workouts-heading">
    <div className="running-section-heading"><h2 id="running-workouts-heading">Seus treinos</h2>
      {(edges.left || edges.right) && <div className="running-carousel-controls"><button className="dash-secondary" aria-label="Treinos anteriores" aria-controls="running-workouts" disabled={!edges.left} onClick={() => scroll(-1)}>←</button><button className="dash-secondary" aria-label="Próximos treinos" aria-controls="running-workouts" disabled={!edges.right} onClick={() => scroll(1)}>→</button></div>}
    </div>
    {!workouts.length ? <div className="dash-panel text-sm text-muted">Você ainda não criou treinos de corrida. Comece em “Criar treino”.</div> : <div id="running-workouts" className="running-carousel" ref={track} tabIndex={0} role="region" aria-label="Treinos de corrida">
      {[...workouts].sort((a,b) => a.name.localeCompare(b.name)).map(workout => <article className="dash-panel running-workout-card" key={workout.id}>
        <p className="dash-eyebrow">Treino de corrida</p><h3>{workout.name}</h3>
        {workout.notes && <p className="running-description running-clamp">{workout.notes}</p>}
        <WorkoutFacts workout={workout} />
        <a className="dash-primary" href={`#/corrida/treino/${workout.id}`} aria-label={`Abrir ${workout.name}`}>Abrir <span aria-hidden="true">→</span></a>
      </article>)}
    </div>}
  </section>;
}

export function ActivityList({ activities }: { activities: RunningActivity[] }) {
  if (!activities.length) return <p className="running-description">Nenhuma corrida registrada.</p>;
  return <div className="running-activity-list">{activities.map(activity => <a key={activity.id} href={`#/corrida/atividade/${activity.id}`} className="running-activity-row" aria-label={`Ver corrida de ${formatFullDate(activity.activityDate)}, ${km(activity.distanceKm)}`}>
    <div><strong>{km(activity.distanceKm)}</strong><time dateTime={activity.activityDate.slice(0,10)}>{formatFullDate(activity.activityDate)}</time></div>
    <div><strong>{formatPace(activity.averagePaceSecondsPerKm)}</strong><span>{formatDuration(activity.durationSeconds)}</span></div><span aria-hidden="true">→</span>
  </a>)}</div>;
}

export function RunningOverview({ workouts, activities, summary }: { workouts: RunningWorkout[]; activities: RunningActivity[]; summary: { count: number; distance: number; averagePace: number | null; bestPace: number | null } }) {
  const latest = activities[0];
  return <>
    <div className="running-toolbar"><a className="dash-primary" href="#/corrida/criar">+ Criar treino</a><a className="dash-secondary" href="#/corrida/registrar">Registrar corrida</a></div>
    <section className="dash-panel running-latest" aria-labelledby="latest-running-heading">
      <div className="running-section-heading"><div><p className="dash-eyebrow">Sua última atividade</p><h2 id="latest-running-heading">Última corrida</h2></div>{latest && <time dateTime={latest.activityDate.slice(0,10)}>{formatFullDate(latest.activityDate)}</time>}</div>
      {latest ? <><ActivityFacts activity={latest} /><a className="dash-secondary" href={`#/corrida/atividade/${latest.id}`}>Ver detalhes →</a></> : <p className="running-description">Registre sua primeira corrida para acompanhar sua evolução.</p>}
    </section>
    <WorkoutCarousel workouts={workouts} />
    <section aria-labelledby="running-summary-heading"><h2 id="running-summary-heading" className="mb-5">Resumo</h2><div className="training-analytics-grid">{[
      ['Corridas', String(summary.count)], ['Distância total', km(summary.distance)], ['Pace médio', formatPace(summary.averagePace)], ['Melhor pace', formatPace(summary.bestPace)],
    ].map(([label,value]) => <div className="dash-panel" key={label}><p className="text-sm text-muted">{label}</p><p className="training-number mt-3 font-semibold">{value}</p></div>)}</div></section>
    <div className="running-bottom-grid"><section className="dash-panel"><p className="dash-eyebrow">Evolução</p><h2>Evolução do pace</h2><div className="training-chart mt-5"><PaceChart activities={activities} /></div></section>
    <section className="dash-panel"><div className="running-section-heading"><h2>Corridas recentes</h2>{activities.length > 5 && <a className="running-back" href="#/corrida/historico">Ver todas</a>}</div><ActivityList activities={activities.slice(0,5)} /></section></div>
  </>;
}

export function WorkoutDetails({ workout, onDelete }: { workout: RunningWorkout; onDelete: () => void }) {
  const totals = workoutTotals(workout);
  return <>
    <section className="dash-panel"><p className="dash-eyebrow">Treino de corrida</p><h2>{workout.name}</h2>{workout.notes && <p className="running-description">{workout.notes}</p>}<WorkoutFacts workout={workout} />
      {(totals.duration === null || totals.distance === null) && <p className="running-description">Os totais dependem de duração, distância ou pace definidos em todas as etapas.</p>}
      <div className="running-toolbar mt-5"><a className="dash-primary" href={`#/corrida/treino/${workout.id}/editar`}>Editar treino</a><button className="dash-secondary" onClick={onDelete}>Excluir treino</button></div>
    </section>
    <section className="dash-panel"><h2>Etapas do treino</h2><ol className="running-blocks">{[...workout.blocks].sort((a,b) => a.sequence-b.sequence).map((block,index) => <li key={block.id}><span className="running-step">{String(index+1).padStart(2,'0')}</span><div><h3>{blockTypeLabels[block.type]}</h3><p>{formatBlock(block)}</p>{block.notes && <p className="running-description">{block.notes}</p>}</div></li>)}</ol></section>
  </>;
}

export function ActivityDetails({ activity, onDelete }: { activity: RunningActivity; onDelete: () => void }) {
  return <section className="dash-panel"><p className="dash-eyebrow">{activity.source === 0 ? 'Registro manual' : 'Strava'}</p><h2>Corrida de {formatFullDate(activity.activityDate)}</h2><ActivityFacts activity={activity} />
    {activity.notes && <div className="mt-5"><h3>Observações</h3><p className="running-description">{activity.notes}</p></div>}
    <p className="running-description">Registrada em {new Date(activity.createdAt).toLocaleString('pt-BR')}</p>
    {activity.source === 0 && <div className="running-toolbar mt-5"><a className="dash-primary" href={`#/corrida/atividade/${activity.id}/editar`}>Editar corrida</a><button className="dash-secondary" onClick={onDelete}>Excluir corrida</button></div>}
  </section>;
}
