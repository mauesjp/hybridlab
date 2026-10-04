import RunningWorkoutForm from '../components/running/RunningWorkoutForm';
import RunningActivityForm from '../components/running/RunningActivityForm';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { runningService } from '../services/runningService';
import type { RunningWorkout, RunningActivity, RunningWorkoutInput, RunningActivityInput } from '../types/running';
import DashboardShell from '../components/dashboard/DashboardShell';
import { RunningOverview, WorkoutDetails, ActivityDetails, ActivityList } from '../components/running/RunningViews';
import { parseRunningRoute, emptyWorkoutForm, emptyActivityForm, blockToDraft, blockDraftToInput, emptyBlock, activityToForm, activityDurationSeconds, decimalValue, todayKey } from '../components/running/runningModel';
import type { WorkoutForm, ActivityForm, BlockDraft } from '../components/running/runningModel';
import '../components/dashboard/TrainingPage.css';
import '../components/running/RunningPage.css';
export default function RunningPage({ route }: { route: string }) {
  const page = parseRunningRoute(route);
  const [refreshKey, setRefreshKey] = useState(0);
  const [workouts, setWorkouts] = useState<RunningWorkout[]>([]);

  const [activities, setActivities] = useState<RunningActivity[]>([]);

  const [workoutForm, setWorkoutForm] =
    useState<WorkoutForm>(emptyWorkoutForm());

  const [activityForm, setActivityForm] =
    useState<ActivityForm>(emptyActivityForm());

  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);

  const [editingActivityId, setEditingActivityId] = useState<number | null>(
    null,
  );

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const [savingWorkout, setSavingWorkout] = useState(false);

  const [savingActivity, setSavingActivity] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [workoutData, activityData] = await Promise.all([
          runningService.getAll(),
          runningService.getActivities(),
        ]);

        setWorkouts(workoutData);

        setActivities(activityData);
        setLoaded(true);
        const target = parseRunningRoute(route);
        if (target.view === 'workout-form' && target.id !== null) {
          const workout = workoutData.find(item => item.id === target.id);
          if (workout) { setEditingWorkoutId(workout.id); setWorkoutForm({ name: workout.name, notes: workout.notes ?? '', blocks: [...workout.blocks].sort((a,b) => a.sequence-b.sequence).map(blockToDraft) }); }
        }
        if (target.view === 'activity-form' && target.id !== null) {
          const activity = activityData.find(item => item.id === target.id);
          if (activity?.source === 0) { setEditingActivityId(activity.id); setActivityForm(activityToForm(activity)); }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar corrida.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [route, refreshKey]);

  const activitySummary = useMemo(() => {
    const distance = activities.reduce(
      (total, item) => total + item.distanceKm,
      0,
    );

    const duration = activities.reduce(
      (total, item) => total + item.durationSeconds,
      0,
    );

    const averagePace = distance > 0 ? Math.round(duration / distance) : null;

    const bestPace = activities.length
      ? Math.min(...activities.map((item) => item.averagePaceSecondsPerKm))
      : null;

    return {
      count: activities.length,
      distance,
      averagePace,
      bestPace,
    };
  }, [activities]);

  const orderedActivities = useMemo(
    () =>
      [...activities].sort(
        (a, b) => b.activityDate.localeCompare(a.activityDate) || b.id - a.id,
      ),
    [activities],
  );

  function resetWorkoutForm() {
    setEditingWorkoutId(null);

    setWorkoutForm(emptyWorkoutForm());
  }

  function resetActivityForm() {
    setEditingActivityId(null);

    setActivityForm(emptyActivityForm());
  }

  function updateBlock(index: number, patch: Partial<BlockDraft>) {
    setWorkoutForm((current) => ({
      ...current,

      blocks: current.blocks.map((block, blockIndex) =>
        blockIndex === index
          ? {
              ...block,
              ...patch,
            }
          : block,
      ),
    }));
  }

  function addBlock() {
    setWorkoutForm((current) => ({
      ...current,

      blocks: [...current.blocks, emptyBlock()],
    }));
  }

  function removeBlock(index: number) {
    setWorkoutForm((current) => ({
      ...current,

      blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setWorkoutForm((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.blocks.length) {
        return current;
      }

      const blocks = [...current.blocks];

      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];

      return {
        ...current,
        blocks,
      };
    });
  }

  async function handleWorkoutSubmit(event: FormEvent) {
    event.preventDefault();

    setError(null);

    if (!workoutForm.name.trim()) {
      setError("Informe o nome do treino.");
      return;
    }

    if (workoutForm.blocks.length === 0) {
      setError("Adicione pelo menos um bloco.");
      return;
    }

    const blocks = workoutForm.blocks.map(blockDraftToInput);

    if (
      blocks.some(
        (block) => block.distanceKm === null && block.durationSeconds === null,
      )
    ) {
      setError("Cada bloco precisa ter distância ou duração.");
      return;
    }

    const input: RunningWorkoutInput = {
      name: workoutForm.name.trim(),

      notes: workoutForm.notes.trim() || null,

      blocks,
    };

    try {
      setSavingWorkout(true);

      if (editingWorkoutId === null) {
        const created = await runningService.create(input);

        setWorkouts((current) => [...current, created]);
      } else {
        const updated = await runningService.update(editingWorkoutId, input);

        setWorkouts((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }

      resetWorkoutForm();
      window.location.hash = "#/corrida";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o treino.",
      );
    } finally {
      setSavingWorkout(false);
    }
  }

  async function deleteWorkout(workout: RunningWorkout) {
    if (!window.confirm(`Excluir "${workout.name}"?`)) {
      return;
    }

    try {
      await runningService.remove(workout.id);

      setWorkouts((current) =>
        current.filter((item) => item.id !== workout.id),
      );

      window.location.hash = "#/corrida";
      if (editingWorkoutId === workout.id) {
        resetWorkoutForm();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir o treino.",
      );
    }
  }

  async function handleActivitySubmit(event: FormEvent) {
    event.preventDefault();

    setError(null);

    const distance = decimalValue(activityForm.distanceKm);

    const duration = activityDurationSeconds(activityForm);

    const heartRate = activityForm.averageHeartRate.trim()
      ? Number(activityForm.averageHeartRate)
      : null;

    const rpe = decimalValue(activityForm.rpe);

    if (!activityForm.activityDate) {
      setError("Informe a data.");
      return;
    }

    if (activityForm.activityDate > todayKey()) {
      setError("A data não pode estar no futuro.");
      return;
    }

    if (distance === null || distance <= 0) {
      setError("Informe uma distância válida.");
      return;
    }

    if (duration <= 0) {
      setError("Informe a duração.");
      return;
    }

    if (heartRate !== null && (heartRate < 30 || heartRate > 250)) {
      setError("FC média deve estar entre 30 e 250 bpm.");
      return;
    }

    if (rpe !== null && (rpe < 1 || rpe > 10)) {
      setError("RPE deve estar entre 1 e 10.");
      return;
    }

    const input: RunningActivityInput = {
      activityDate: activityForm.activityDate,

      distanceKm: distance,

      durationSeconds: duration,

      averageHeartRate: heartRate,

      rpe,

      notes: activityForm.notes.trim() || null,
    };

    try {
      setSavingActivity(true);

      if (editingActivityId === null) {
        const created = await runningService.createActivity(input);

        setActivities((current) => [created, ...current]);
      } else {
        const updated = await runningService.updateActivity(
          editingActivityId,
          input,
        );

        setActivities((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }

      resetActivityForm();
      window.location.hash = "#/corrida";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a corrida.",
      );
    } finally {
      setSavingActivity(false);
    }
  }

  async function deleteActivity(activity: RunningActivity) {
    if (activity.source !== 0 || !window.confirm("Excluir esta corrida?")) {
      return;
    }

    try {
      await runningService.removeActivity(activity.id);

      setActivities((current) =>
        current.filter((item) => item.id !== activity.id),
      );
      window.location.hash = "#/corrida";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir a corrida.",
      );
    }
  }


  const workout = workouts.find(item => item.id === page.id);
  const activity = activities.find(item => item.id === page.id);
  const missing = page.view === 'missing' || (page.id !== null && (page.view.startsWith('workout') ? !workout : !activity));
  const readOnly = page.view === 'activity-form' && activity && activity.source !== 0;
  return <DashboardShell title="Corrida" subtitle="Seu ritmo, seus treinos e cada evolução." current="running" loading={loading} refresh={() => setRefreshKey(key => key + 1)} className="training-page running-page">
    <div className="running-content">
      {page.view !== 'overview' && <a href="#/corrida" className="running-back">← Voltar para Corrida</a>}
      {error && <div className="dash-panel" role="alert">{error} <button className="dash-secondary" onClick={() => setRefreshKey(key => key + 1)}>Tentar novamente</button></div>}
      {loading ? <div className="dash-panel" role="status">Carregando corrida…</div> : !loaded ? null : missing ? <div className="dash-panel">Não encontramos este treino ou corrida.</div> : readOnly ? <div className="dash-panel">Atividades importadas não podem ser editadas manualmente.</div> : <>
        {page.view === 'overview' && <RunningOverview workouts={workouts} activities={orderedActivities} summary={activitySummary} />}
        {page.view === 'history' && <section className="dash-panel"><h2>Histórico de corridas</h2><ActivityList activities={orderedActivities} /></section>}
        {page.view === 'workout' && workout && <WorkoutDetails workout={workout} onDelete={() => void deleteWorkout(workout)} />}
        {page.view === 'activity' && activity && <ActivityDetails activity={activity} onDelete={() => void deleteActivity(activity)} />}
        {page.view === 'workout-form' && <RunningWorkoutForm workoutForm={workoutForm} setWorkoutForm={setWorkoutForm} editingWorkoutId={editingWorkoutId} savingWorkout={savingWorkout} handleWorkoutSubmit={handleWorkoutSubmit} addBlock={addBlock} removeBlock={removeBlock} moveBlock={moveBlock} updateBlock={updateBlock} />}
{page.view === 'activity-form' && <RunningActivityForm activityForm={activityForm} setActivityForm={setActivityForm} editingActivityId={editingActivityId} savingActivity={savingActivity} handleActivitySubmit={handleActivitySubmit} />}
      </>}
    </div>
  </DashboardShell>;
}
