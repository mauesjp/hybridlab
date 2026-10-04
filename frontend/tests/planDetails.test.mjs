import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

process.env.TZ = 'America/Sao_Paulo'
const compile = name => ts.transpileModule(readFileSync(new URL(`../src/components/dashboard/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const { planDetails } = await import(url(compile('planDetails').replace("'./overviewMetrics'", JSON.stringify(url(compile('overviewMetrics'))))))
const plan = { id: 1, days: [{ id: 20, order: 2 }, { id: 10, order: 1 }, { id: 30, order: 3 }] }
const slot = (id, day, type = 0) => ({ strengthWorkoutDayId: id, dayOfWeek: day, sessionType: type, sequence: 1 })
const calendar = { weeks: [{ startDate: '2026-09-28', endDate: '2026-10-04', weekNumber: 1, sessions: [slot(10, 1), slot(20, 3), slot(20, 5), slot(99, 2), slot(30, 4, 1)] }] }
const session = (id, dayId, startedAt, status = 1) => ({ id, strengthPlanId: 1, strengthWorkoutDayId: dayId, startedAt, status })

test('sem calendário mantém ordem e não inventa dias da semana ou estados', () => {
  const result = planDetails(plan, null, [], '2026-09-28')
  assert.deepEqual(result.days.map(item => [item.day.id, item.label, item.status]), [[10, 'Dia 1', null], [20, 'Dia 2', null], [30, 'Dia 3', null]])
  assert.equal(result.progress, null)
  assert.equal(plan.days[0].id, 20)
})

test('dias repetidos usam todos os vínculos reais e excluem outros planos e corrida', () => {
  const result = planDetails(plan, calendar, [], '2026-09-28')
  assert.deepEqual(result.days.map(item => [item.label, item.status]), [['SEG', 'Hoje'], ['QUA / SEX', 'Próximo'], ['Dia 3', null]])
  assert.equal(result.progress.total, 3)
})

test('conclusão respeita data local e requer todas as ocorrências do treino na semana', () => {
  const history = [session(2, 20, '2026-09-30T15:00:00Z'), session(1, 10, '2026-09-29T01:00:00')]
  const result = planDetails(plan, calendar, history, '2026-10-02')
  assert.equal(result.days[0].status, 'Concluído na semana')
  assert.equal(result.days[1].status, 'Hoje')
  assert.equal(result.progress.completed, 2)
})

test('última execução inclui parcial real e ignora sessão aberta e outra versão', () => {
  const history = [session(1, 10, '2026-09-28T12:00:00Z'), session(2, 10, '2026-09-29T12:00:00Z', 2), session(3, 10, '2026-09-30T12:00:00Z', 0), { ...session(4, 10, '2026-10-01T12:00:00Z'), strengthPlanId: 2 }]
  assert.equal(planDetails(plan, calendar, history, '2026-10-02').days[0].lastSession.id, 2)
})

test('histórico truncado não determina conclusão nem marca ausência como treino perdido', () => {
  const history = Array.from({ length: 20 }, (_, index) => session(index, 20, '2026-10-02T15:00:00Z'))
  const result = planDetails(plan, calendar, history, '2026-10-04')
  assert.equal(result.progress.limited, true)
  assert.equal(result.days[0].status, null)
  assert.equal(result.days[1].status, null)
})
