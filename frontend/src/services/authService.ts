import type { LoginRequest, LoginResponse } from '../types/auth'
import { API_BASE } from './api'
import type { RegisterRequest, RegisterResponse } from '../types/auth'

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(15000),
  }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('O servidor demorou para responder. Tente novamente.')
    }
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  })

  if (!response.ok) {
    throw new Error(response.status === 401
      ? 'E-mail, usuário ou senha incorretos. Confira os dados e tente novamente.'
      : 'Não foi possível entrar agora. Tente novamente em instantes.')
  }
  const result: LoginResponse = await response.json()
  return result
}

export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const response = await fetch(
    `${API_BASE}/Auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message ||
      error ||
      "Não foi possível criar a conta."
    );
  }

  return response.json();
}
