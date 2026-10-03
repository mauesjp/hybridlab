import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const source = ts.transpileModule(readFileSync(new URL('../src/services/authService.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText
const { register } = await import(moduleUrl(source.replace("'./api'", JSON.stringify(moduleUrl("export const API_BASE = 'https://example.test/api'")))))
const originalFetch = globalThis.fetch
const data = { displayName: 'João', username: 'joao', email: 'joao@example.test', password: 'Example!123', accountType: 'Student', birthDate: '2000-01-01' }
const json = (body, status) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
afterEach(() => { globalThis.fetch = originalFetch })

test('cadastro envia os campos atuais e aceita a confirmação da API', async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://example.test/api/Auth/register')
    assert.equal(init.method, 'POST')
    assert.deepEqual(JSON.parse(init.body), data)
    assert.ok(init.signal instanceof AbortSignal)
    return json({ message: 'Conta criada com sucesso.', accountType: 'Student' }, 201)
  }
  assert.deepEqual(await register(data), { message: 'Conta criada com sucesso.', accountType: 'Student' })
})

test('conflitos de cadastro exibem mensagens JSON e texto simples', async () => {
  globalThis.fetch = async () => json('Este e-mail já está cadastrado.', 409)
  await assert.rejects(register(data), /Este e-mail já está cadastrado/)
  globalThis.fetch = async () => new Response('Este nome de usuário já está em uso.', { status: 409 })
  await assert.rejects(register(data), /Este nome de usuário já está em uso/)
})

test('validações do ASP.NET e da senha exibem os detalhes', async () => {
  globalThis.fetch = async () => json({ errors: { Username: ['O usuário deve ter entre 3 e 50 caracteres.'], Email: ['Informe um e-mail válido.'] } }, 400)
  await assert.rejects(register(data), /O usuário deve ter entre 3 e 50 caracteres\. Informe um e-mail válido\./)
  globalThis.fetch = async () => json({ message: 'Não foi possível criar a conta.', errors: ['A senha precisa de um número.'] }, 400)
  await assert.rejects(register(data), /A senha precisa de um número\./)
})

test('falha de rede e timeout fornecem mensagens úteis sem repetir o cadastro', async () => {
  let requests = 0
  globalThis.fetch = async () => { requests++; throw new TypeError('fetch failed') }
  await assert.rejects(register(data), /Não foi possível conectar ao servidor/)
  assert.equal(requests, 1)
  globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError') }
  await assert.rejects(register(data), /O servidor demorou para responder/)
})

test('respostas inesperadas e falhas do servidor não exibem objetos ou HTML', async () => {
  globalThis.fetch = async () => json({ title: 'Bad Request' }, 400)
  await assert.rejects(register(data), /Não foi possível criar a conta/)
  globalThis.fetch = async () => new Response('<html>Server error</html>', { status: 500 })
  await assert.rejects(register(data), /Não foi possível criar a conta/)
})
