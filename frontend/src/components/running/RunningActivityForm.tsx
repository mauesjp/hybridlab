import type { Dispatch, SetStateAction, FormEvent } from 'react';
import type { ActivityForm } from './runningModel';
import { todayKey } from './runningModel';
interface Props { activityForm: ActivityForm; setActivityForm: Dispatch<SetStateAction<ActivityForm>>; editingActivityId: number | null; savingActivity: boolean; handleActivitySubmit: (event: FormEvent) => void;  }
export default function RunningActivityForm({ activityForm, setActivityForm, editingActivityId, savingActivity, handleActivitySubmit }: Props) { return (<section className="dash-panel">
        <p className="dash-eyebrow">Atividade realizada</p>

        <h2 className="mt-2 text-xl font-semibold">
          {editingActivityId === null ? "Registrar corrida" : "Editar corrida"}
        </h2>

        <form onSubmit={handleActivitySubmit} className="mt-6"><fieldset disabled={savingActivity} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              Data
              <input
                type="date"
                max={todayKey()}
                value={activityForm.activityDate}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    activityDate: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>

            <label className="text-sm">
              Distância (km)
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={activityForm.distanceKm}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    distanceKm: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>

            <label className="text-sm">
              FC média
              <input
                type="number"
                value={activityForm.averageHeartRate}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    averageHeartRate: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>
          </div>

          <div>
            <p className="text-sm">Duração</p>

            <div className="mt-2 grid max-w-xl grid-cols-3 gap-2">
              <input
                type="number"
                min="0"
                aria-label="Horas" placeholder="Horas"
                value={activityForm.durationHours}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    durationHours: event.target.value,
                  }))
                }
                className="rounded-xl border border-border bg-background px-4 py-3"
              />

              <input
                type="number"
                min="0"
                max="59"
                aria-label="Minutos" placeholder="Min"
                value={activityForm.durationMinutes}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
                className="rounded-xl border border-border bg-background px-4 py-3"
              />

              <input
                type="number"
                min="0"
                max="59"
                aria-label="Segundos" placeholder="Seg"
                value={activityForm.durationSeconds}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    durationSeconds: event.target.value,
                  }))
                }
                className="rounded-xl border border-border bg-background px-4 py-3"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              RPE
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={activityForm.rpe}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    rpe: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>

            <label className="text-sm">
              Observações
              <input
                value={activityForm.notes}
                onChange={(event) =>
                  setActivityForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={savingActivity}
              className="dash-primary"
            >
              {savingActivity
                ? "Salvando..."
                : editingActivityId === null
                  ? "Registrar corrida"
                  : "Salvar alterações"}
            </button>

            <a className="dash-secondary" href="#/corrida">Cancelar</a>
          </div>
        </fieldset></form>
      </section>); }
