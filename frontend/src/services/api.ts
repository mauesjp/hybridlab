// Um único lugar cuida do token, renovação de sessão e mensagens da API.
export const API_BASE = (import.meta.env.VITE_API_URL || 'https://localhost:7086/api').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function clearSession() {
  for (const key of ['accessToken', 'refreshToken', 'userName', 'role']) localStorage.removeItem(key)
  window.dispatchEvent(new Event('hybridlab:session-changed'))
}

let refreshing: Promise<void> | null = null

async function transport(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, { ...init, signal: AbortSignal.timeout(15000) })
  } catch {
    throw new ApiError('Não foi possível conectar à API. Confira se o servidor está ativo e tente novamente.', 0)
  }
}

async function responseError(response: Response): Promise<ApiError> {
  let message = response.status === 403 ? 'Você não tem permissão para realizar esta ação.'
    : response.status === 401 ? 'Sua sessão expirou. Entre novamente.'
    : response.status >= 500 ? 'O servidor encontrou um erro. Tente novamente em instantes.'
    : 'Não foi possível concluir a operação.'
  const text = await response.text()
  if (text && response.status < 500) {
    try {
      const body = JSON.parse(text)
      if (body.errors) message = Object.values(body.errors).flat().join(' ')
      else if (typeof body === 'string') message = body
      else if (body.detail) message = body.detail
    } catch {
      if (!text.includes('<')) message = text
    }
  }
  return new ApiError(message, response.status)
}

async function renewSession() {
  const token = localStorage.getItem('refreshToken')
  if (!token) { clearSession(); throw new ApiError('Sua sessão expirou. Entre novamente.', 401) }
  const response = await transport('/Auth/refresh', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: token }),
  })
  if (!response.ok) {
    if (response.status === 401) clearSession()
    throw await responseError(response)
  }
  const data: { accessToken: string; refreshToken: string } = await response.json()
  // Não restaura uma sessão se o usuário saiu enquanto a renovação estava em andamento.
  if (localStorage.getItem('refreshToken') !== token) throw new ApiError('Sessão encerrada.', 401)
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
}

export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const initialToken = localStorage.getItem('accessToken')
  const send = () => transport(path, {
    method,
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  let response = await send()
  if (response.status === 401) {
    // Requisições simultâneas compartilham uma única rotação de refresh token.
    if (localStorage.getItem('accessToken') === initialToken) {
      refreshing ??= renewSession().finally(() => { refreshing = null })
      await refreshing
    }
    response = await send()
  }
  if (!response.ok) {
    if (response.status === 401) clearSession()
    throw await responseError(response)
  }
  const text = await response.text()
  if (!text) return undefined as T
  return (response.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text) as T
}
