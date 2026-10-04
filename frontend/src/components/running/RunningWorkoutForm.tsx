import type { Dispatch, SetStateAction, FormEvent } from 'react';
import type { WorkoutForm } from './runningModel';
import type { RunningWorkoutBlockType } from '../../types/running';
import { blockTypeLabels } from './runningModel';
import type { BlockDraft } from './runningModel';
interface Props { workoutForm: WorkoutForm; setWorkoutForm: Dispatch<SetStateAction<WorkoutForm>>; editingWorkoutId: number | null; savingWorkout: boolean; handleWorkoutSubmit: (event: FormEvent) => void; addBlock: () => void; removeBlock: (index: number) => void; moveBlock: (index: number, direction: -1 | 1) => void; updateBlock: (index: number, patch: Partial<BlockDraft>) => void; }
export default function RunningWorkoutForm({ workoutForm, setWorkoutForm, editingWorkoutId, savingWorkout, handleWorkoutSubmit, addBlock, removeBlock, moveBlock, updateBlock }: Props) { return (<section className="dash-panel">
        <p className="dash-eyebrow">Biblioteca</p>

        <h2 className="mt-2 text-xl font-semibold">
          {editingWorkoutId === null
            ? "Criar treino de corrida"
            : "Editar treino de corrida"}
        </h2>

        <form onSubmit={handleWorkoutSubmit} className="mt-6"><fieldset disabled={savingWorkout} className="space-y-5">
          <label className="block text-sm">
            <span className="font-medium">Nome</span>

            <input
              value={workoutForm.name}
              onChange={(event) =>
                setWorkoutForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Ex.: Intervalado 5x4 min"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium">Observações</span>

            <textarea
              rows={2}
              value={workoutForm.notes}
              onChange={(event) =>
                setWorkoutForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Blocos</h3>

            <button
              type="button"
              onClick={addBlock}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              + Bloco
            </button>
          </div>

          <div className="space-y-4">
            {workoutForm.blocks.map((block, index) => (
              <div key={index} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong>Bloco {index + 1}</strong>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      aria-label={`Mover bloco ${index + 1} para cima`} onClick={() => moveBlock(index, -1)}
                      className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-30"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      disabled={index === workoutForm.blocks.length - 1}
                      aria-label={`Mover bloco ${index + 1} para baixo`} onClick={() => moveBlock(index, 1)}
                      className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-30"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="text-sm">
                    Tipo
                    <select
                      value={block.type}
                      onChange={(event) =>
                        updateBlock(index, {
                          type: Number(
                            event.target.value,
                          ) as RunningWorkoutBlockType,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
                    >
                      {Object.entries(blockTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm">
                    Distância (km)
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={block.distanceKm}
                      onChange={(event) =>
                        updateBlock(index, {
                          distanceKm: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  </label>

                  <label className="text-sm">
                    Repetições
                    <input
                      type="number"
                      min="1"
                      value={block.repetitions}
                      onChange={(event) =>
                        updateBlock(index, {
                          repetitions: event.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm">Duração</p>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        aria-label="Minutos" placeholder="Min"
                        value={block.durationMinutes}
                        onChange={(event) =>
                          updateBlock(index, {
                            durationMinutes: event.target.value,
                          })
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3"
                      />

                      <input
                        type="number"
                        min="0"
                        max="59"
                        aria-label="Segundos" placeholder="Seg"
                        value={block.durationSeconds}
                        onChange={(event) =>
                          updateBlock(index, {
                            durationSeconds: event.target.value,
                          })
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm">Pace alvo</p>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        aria-label="Minutos" placeholder="Min"
                        value={block.paceMinutes}
                        onChange={(event) =>
                          updateBlock(index, {
                            paceMinutes: event.target.value,
                          })
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3"
                      />

                      <input
                        type="number"
                        min="0"
                        max="59"
                        aria-label="Segundos" placeholder="Seg"
                        value={block.paceSeconds}
                        onChange={(event) =>
                          updateBlock(index, {
                            paceSeconds: event.target.value,
                          })
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3"
                      />
                    </div>
                  </div>
                </div>

                <input
                  value={block.notes}
                  onChange={(event) =>
                    updateBlock(index, {
                      notes: event.target.value,
                    })
                  }
                  aria-label={`Observação do bloco ${index + 1}`} placeholder="Observação do bloco"
                  className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={savingWorkout}
              className="dash-primary"
            >
              {savingWorkout
                ? "Salvando..."
                : editingWorkoutId === null
                  ? "Criar treino"
                  : "Salvar alterações"}
            </button>

            <a className="dash-secondary" href="#/corrida">Cancelar</a>
          </div>
        </fieldset></form>
      </section>); }
