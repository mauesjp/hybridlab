import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

process.env.TZ = 'America/Sao_Paulo'
const source = ts.transpileModule(readFileSync(new URL('../src/components/dashboard/overviewMetrics.ts',import.meta.url),'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText
const { weightSummary, weeklyProgress } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const weight = (id, recordedAt, weightKg) => ({id,recordedAt,weightKg,createdAt:recordedAt})
const slot = (id,type,day,workout=10) => ({id,sessionType:type,dayOfWeek:day,sequence:id,strengthWorkoutDayId:type===0?workout:null,runningWorkoutId:type===1?20:null})
const week = sessions => ({id:1,weekNumber:1,startDate:'2026-09-28',endDate:'2026-10-04',sessions})
const workout = (id,date,status=1,dayId=10) => ({id,startedAt:date,strengthWorkoutDayId:dayId,status})

test('peso usa os sete dias atuais e mantém a variação desde o primeiro registro',()=>{
  const entries=[weight(1,'2026-09-01',100),weight(2,'2026-09-26',95),weight(3,'2026-09-27',92),weight(4,'2026-10-03',90),weight(5,'2026-10-04',80)]
  assert.deepEqual(weightSummary(entries,'2026-10-03'),{current:90,average:91,variation:-10})
  assert.equal(entries[0].weightKg,100)
})
test('pesagens antigas e dados vazios não fabricam a média atual',()=>{
  assert.deepEqual(weightSummary([],'2026-10-03'),{current:null,average:null,variation:null})
  assert.equal(weightSummary([weight(1,'2026-09-01',90)],'2026-10-03').average,null)
})
test('progresso não reutiliza um registro para dois treinos nem conta sessões parciais',()=>{
  const plan=week([slot(1,0,1),slot(2,0,1),slot(3,0,2),slot(4,1,3),slot(5,1,3)])
  const result=weeklyProgress(plan,[workout(1,'2026-09-28T15:00:00Z'),workout(2,'2026-09-29T15:00:00Z',2)],[{id:3,activityDate:'2026-09-30'}])
  assert.deepEqual(result.slots,[true,false,false,true,false])
  assert.equal(result.completed,2)
  assert.equal(result.percent,40)
})
test('musculação respeita o treino planejado e converte os horários UTC da API',()=>{
  const result=weeklyProgress(week([slot(1,0,1)]),[workout(1,'2026-09-29T01:00:00',1,10),workout(2,'2026-09-28T15:00:00Z',1,11)],[])
  assert.equal(result.completed,1)
})
test('progresso sinaliza o histórico truncado em vez de apresentar uma porcentagem incompleta',()=>{
  const result=weeklyProgress(week([slot(1,0,1)]),Array.from({length:20},(_,i)=>workout(i,'2026-10-01T15:00:00Z')),[])
  assert.equal(result.limited,true)
})
