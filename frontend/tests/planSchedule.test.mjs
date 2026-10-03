import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const source = ts.transpileModule(readFileSync(new URL('../src/components/dashboard/planSchedule.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const { planSchedule } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const plan = { days: [{ id: 1 }, { id: 2 }] }
const slot = (id, day, type = 0) => ({ strengthWorkoutDayId: id, dayOfWeek: day, sessionType: type })
test('programação considera apenas semanas vinculadas e dias distintos do plano', () => {
  const calendar = { name: 'Ciclo', weeks: [
    { sessions: [slot(1,1),slot(2,1),slot(1,3),slot(99,4),slot(1,5,1)] },
    { sessions: [slot(2,2)] },
    { sessions: [slot(99,2)] },
  ] }
  assert.deepEqual(planSchedule(plan, calendar), {duration:'2 semanas programadas', frequency:'1–2 dias/semana', calendarName:'Ciclo'})
})
test('sem calendário ou sem vínculos não inventa duração ou frequência', () => {
  assert.equal(planSchedule(plan, null), null)
  assert.equal(planSchedule(plan, { weeks: [{ sessions: [slot(99,1)] }] }), null)
})
