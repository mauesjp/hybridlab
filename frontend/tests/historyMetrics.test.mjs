import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'
const source=ts.transpileModule(readFileSync(new URL('../src/components/dashboard/historyMetrics.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText
const {sessionMetrics}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
test('duração aceita UTC sem sufixo e offsets equivalentes',()=>{
 assert.equal(sessionMetrics({startedAt:'2026-10-07T12:00:00',finishedAt:'2026-10-07T09:45:00-03:00'}).duration,45)
})
test('sessão aberta ou datas inválidas não inventam duração',()=>{
 for(const finishedAt of [null,'invalid','2026-10-07T11:00:00Z']) assert.equal(sessionMetrics({startedAt:'2026-10-07T12:00:00Z',finishedAt}).duration,null)
})
test('resumo sem exercícios mantém métricas ausentes em vez de zero',()=>{
 const result=sessionMetrics({startedAt:'2026-10-07T12:00:00Z',finishedAt:null})
 assert.equal(result.sets,null);assert.equal(result.exercises,null);assert.equal(result.volume,null)
})
test('volume considera somente séries registradas com carga e preserva zero explícito',()=>{
 const result=sessionMetrics({startedAt:'2026-10-07T12:00:00Z',finishedAt:null,exercises:[{sets:[{weight:null,reps:10},{weight:0,reps:10},{weight:20,reps:8}]},{sets:[]}]})
 assert.equal(result.exercises,2);assert.equal(result.sets,3);assert.equal(result.volume,160)
 assert.equal(sessionMetrics({exercises:[{sets:[{weight:null,reps:10}]}],finishedAt:null}).volume,null)
 assert.equal(sessionMetrics({exercises:[{sets:[{weight:0,reps:10}]}],finishedAt:null}).volume,0)
})
