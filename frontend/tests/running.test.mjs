import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/components/running/runningModel.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
const { workoutTotals, parseRunningRoute, blockToDraft, blockDraftToInput, activityToForm, activityDurationSeconds, formatFullDate } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const block = (values = {}) => ({ id: 1, sequence: 1, type: 1, distanceKm: null, durationSeconds: null, targetPaceSecondsPerKm: null, repetitions: 1, notes: null, ...values });

test('totais respeitam repetições e estimam apenas com pace disponível', () => {
  const result = workoutTotals({ blocks: [block({ distanceKm: 1, targetPaceSecondsPerKm: 300, repetitions: 4 }), block({ durationSeconds: 120, targetPaceSecondsPerKm: 600, type: 3, repetitions: 4 })] });
  assert.equal(result.duration, 1680);
  assert.equal(result.distance, 4.8);
  assert.deepEqual(result.paces, [300,600]);
});
test('totais incompletos não são apresentados como totais do treino', () => {
  assert.equal(workoutTotals({ blocks: [block({ durationSeconds: 60 }), block({ distanceKm: 2 })] }).duration, null);
  assert.equal(workoutTotals({ blocks: [block({ durationSeconds: 60 })] }).distance, null);
  assert.equal(workoutTotals({ blocks: [] }).duration, null);
  assert.equal(workoutTotals({ blocks: [] }).distance, null);
});
test('valores explícitos prevalecem sobre estimativas por pace', () => {
  const result = workoutTotals({ blocks: [block({ durationSeconds: 330, distanceKm: 1, targetPaceSecondsPerKm: 300 })] });
  assert.equal(result.duration, 330);
  assert.equal(result.distance, 1);
});
test('rotas preservam visão geral, links diretos, edição e histórico', () => {
  assert.deepEqual(parseRunningRoute('#/corrida'), { view: 'overview', id: null });
  assert.equal(parseRunningRoute('#/corrida/criar').view, 'workout-form');
  assert.equal(parseRunningRoute('#/corrida/registrar').view, 'activity-form');
  assert.equal(parseRunningRoute('#/corrida/historico').view, 'history');
  assert.deepEqual(parseRunningRoute('#/corrida/treino/12/editar'), { view: 'workout-form', id: 12 });
  assert.deepEqual(parseRunningRoute('#/corrida/atividade/3'), { view: 'activity', id: 3 });
  for (const route of ['#/corrida/treino/0', '#/corrida/treino/NaN', '#/corrida/atividade/2/outro']) assert.equal(parseRunningRoute(route).view, 'missing');
});
test('edição mantém prescrição, recuperação, observações e repetições', () => {
  const original = block({ type: 3, durationSeconds: 125, distanceKm: 0.4, targetPaceSecondsPerKm: 365, repetitions: 5, notes: 'Recuperar' });
  const { id, sequence, ...input } = original;
  assert.deepEqual(blockDraftToInput(blockToDraft(original)), input);
});
test('edição mantém duração longa e data civil sem deslocamento de fuso', () => {
  const draft = activityToForm({ activityDate: '2026-10-01T00:00:00Z', distanceKm: 21.1, durationSeconds: 7385, averageHeartRate: 150, rpe: 6, notes: 'Longão' });
  assert.equal(activityDurationSeconds(draft), 7385);
  assert.equal(draft.activityDate, '2026-10-01');
  assert.equal(formatFullDate('2026-10-01T00:00:00Z'), '01/10/2026');
});
