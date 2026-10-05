import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

process.env.TZ = 'America/Sao_Paulo'
const source = ts.transpileModule(readFileSync(new URL('../src/components/dashboard/overviewMetrics.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const { dailyWorkoutCompletion } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const slot = (id, workout = 10, sequence = id) => ({ id, strengthWorkoutDayId: workout, sessionType: 0, sequence })
const today = (sessions = [slot(1)]) => ({ date: '2026-10-05', hasActivePlan: true, isBeforePlan: false, isAfterPlan: false, sessions })
const session = (id, overrides = {}) => ({ id, strengthWorkoutDayId: 10, status: 1, startedAt: '2026-10-05T12:00:00Z', finishedAt: '2026-10-05T13:00:00Z', ...overrides })

test('treino realizado exige conclusão, vínculo com o treino e data local', () => {
  const result = dailyWorkoutCompletion(today(), [
    session(1, { status: 0, finishedAt: null }), session(2, { status: 2 }),
    session(3, { strengthWorkoutDayId: 11 }), session(4, { startedAt: '2026-10-04T12:00:00Z' }),
    session(5, { finishedAt: null }), session(6),
  ])
  assert.deepEqual([...result.matches], [[1, 6]])
})

test('UTC sem sufixo e com offset são convertidos para a data local de início', () => {
  assert.equal(dailyWorkoutCompletion(today(), [session(1, { startedAt: '2026-10-05T02:59:59Z' })]).matches.size, 0)
  assert.equal(dailyWorkoutCompletion(today(), [session(2, { startedAt: '2026-10-06T02:59:59' })]).matches.get(1), 2)
  assert.equal(dailyWorkoutCompletion(today(), [session(3, { startedAt: '2026-10-06T03:00:00Z' })]).matches.size, 0)
  assert.equal(dailyWorkoutCompletion(today(), [session(4, { startedAt: '2026-10-05T23:50:00-03:00' })]).matches.get(1), 4)
})

test('dois treinos no dia são avaliados separadamente', () => {
  const result = dailyWorkoutCompletion(today([slot(1, 10), slot(2, 20)]), [session(1)])
  assert.deepEqual([...result.matches], [[1, 1]])
})

test('um registro não conclui duas ocorrências; atribuição segue a sequência', () => {
  const plan = today([slot(1, 10, 2), slot(2, 10, 1)])
  assert.deepEqual([...dailyWorkoutCompletion(plan, [session(7)]).matches], [[2, 7]])
  assert.equal(dailyWorkoutCompletion(plan, [session(7), session(8)]).matches.size, 2)
  assert.equal(plan.sessions[0].id, 1)
})

test('dia de descanso, ciclo inativo e corrida não são marcados por musculação', () => {
  for (const plan of [today([]), { ...today(), hasActivePlan: false }, { ...today(), isBeforePlan: true }, { ...today(), isAfterPlan: true }, today([{ ...slot(1), sessionType: 1 }]), today([slot(1, null)])]) {
    assert.equal(dailyWorkoutCompletion(plan, [session(1)]).matches.size, 0)
  }
})

test('consulta diária não tem limite de 20; fallback antigo sinaliza histórico insuficiente', () => {
  const records = Array.from({ length: 25 }, (_, i) => session(i, { strengthWorkoutDayId: i === 24 ? 10 : 20 }))
  assert.equal(dailyWorkoutCompletion(today(), records).matches.get(1), 24)
  assert.equal(dailyWorkoutCompletion(today(), records).limited, false)
  assert.equal(dailyWorkoutCompletion(today(), records.slice(0, 20), false).limited, true)
  assert.equal(dailyWorkoutCompletion(today(), [session(1, { startedAt: '2026-10-04T12:00:00Z' })], false).limited, false)
})
