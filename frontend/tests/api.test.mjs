import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

// Executa os serviços reais com respostas controladas, sem gravar dados no backend.
const compile = (file) => ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const apiUrl = moduleUrl(compile('../src/services/api.ts'))
const { api, clearSession } = await import(apiUrl)
const { dashboardService: service } = await import(moduleUrl(compile('../src/services/dashboardService.ts').replace("'./api'", JSON.stringify(apiUrl))))
const originalFetch = globalThis.fetch
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
let storage
beforeEach(() => {
  storage = new Map([['accessToken', 'old-access'], ['refreshToken', 'old-refresh'], ['hybridlab-theme', 'light']])
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) }
  globalThis.window = new EventTarget()
})
afterEach(() => { globalThis.fetch = originalFetch })

test('401 concorrentes renovam a sessão uma única vez e repetem com o novo token', async () => {
  let rotations = 0
  globalThis.fetch = async (url, init) => {
    if (url.endsWith('/Auth/refresh')) { rotations++; await new Promise(resolve => setTimeout(resolve, 5)); return json({ accessToken: 'new-access', refreshToken: 'new-refresh' }) }
    return init.headers.Authorization === 'Bearer old-access' ? new Response(null, { status: 401 }) : json({ ok: true })
  }
  assert.deepEqual(await Promise.all([api('/one'), api('/two')]), [{ ok: true }, { ok: true }])
  assert.equal(rotations, 1)
  assert.equal(storage.get('refreshToken'), 'new-refresh')
})
test('refresh rejeitado encerra a sessão e preserva o tema', async () => {
  globalThis.fetch = async () => new Response(null, { status: 401 })
  await assert.rejects(api('/Dashboard'), error => error.status === 401)
  assert.equal(storage.has('accessToken'), false)
  assert.equal(storage.get('hybridlab-theme'), 'light')
})
test('falha de rede não apaga os tokens nem repete uma gravação', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new TypeError('network') }
  await assert.rejects(service.addSet(5, { reps: 8, weight: 20, rir: 2, rpe: null }), error => error.status === 0)
  assert.equal(calls, 1)
  assert.equal(storage.get('accessToken'), 'old-access')
})
test('403 não tenta renovar o token', async () => {
  let calls = 0
  globalThis.fetch = async () => { calls++; return new Response(null, { status: 403 }) }
  await assert.rejects(service.publish(4), error => error.status === 403)
  assert.equal(calls, 1)
})
test('mensagens de validação do ASP.NET são apresentadas', async () => {
  globalThis.fetch = async () => json({ errors: { Reps: ['Repetições inválidas.'], Rir: ['RIR inválido.'] } }, 400)
  await assert.rejects(api('/test', 'POST', {}), /Repetições inválidas\. RIR inválido\./)
})
test('respostas vazias e texto simples são aceitas', async () => {
  globalThis.fetch = async url => url.endsWith('/Auth/me') ? new Response('Authenticated') : new Response(null, { status: 204 })
  assert.equal(await service.me(), 'Authenticated')
  assert.equal(await service.deleteDay(3), undefined)
})
test('logout durante renovação não restaura a sessão', async () => {
  globalThis.fetch = async url => {
    if (url.endsWith('/Auth/refresh')) { clearSession(); return json({ accessToken: 'new', refreshToken: 'new' }) }
    return new Response(null, { status: 401 })
  }
  await assert.rejects(api('/Dashboard'), /Sessão encerrada/)
  assert.equal(storage.has('accessToken'), false)
})
test('ações enviam os métodos, rotas e campos esperados pelo backend', async () => {
  const calls = []
  globalThis.fetch = async (url, init) => { calls.push([url.replace(/^.*\/api/, ''), init.method, init.body ? JSON.parse(init.body) : undefined]); return json({ id: 1 }) }
  await service.createPlan('Plano A')
  await service.createPlan('Plano B', 7)
  await service.requestLink('COACH001', 0)
  await service.respondLink(2, false)
  await service.start(9)
  await service.addSet(3, { weight: 0, reps: 8, rir: 0, rpe: null })
  await service.finish(4)
  assert.deepEqual(calls, [
    ['/StrengthPlans', 'POST', { name: 'Plano A' }], ['/StrengthPlans/students/7', 'POST', { name: 'Plano B' }],
    ['/CoachLinks/request', 'POST', { coachCode: 'COACH001', modality: 0 }], ['/CoachLinks/2/respond', 'PUT', { accept: false }],
    ['/WorkoutSessions/days/9/start', 'POST', undefined], ['/WorkoutSessions/exercises/3/sets', 'POST', { weight: 0, reps: 8, rir: 0, rpe: null }],
    ['/WorkoutSessions/4/finish', 'PUT', undefined],
  ])
})
