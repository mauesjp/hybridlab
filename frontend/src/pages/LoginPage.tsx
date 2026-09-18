import { useState } from 'react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import { login } from '../services/authService'

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    setMessage('')
    setIsLoading(true)
    try {
      const response = await login({ login: loginValue, password })
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      localStorage.setItem('userName', response.userName)
      localStorage.setItem('role', response.role)
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout page="login">
      <p className="auth-eyebrow hidden lg:block">Bem-vindo de volta</p>
      <h2 className="auth-heading hidden lg:block">Seu próximo passo<br />começa aqui.</h2>
      <p className="auth-description hidden lg:block">Entre na sua conta para continuar sua jornada.</p>
      <form onSubmit={handleSubmit} className="space-y-6 lg:mt-9" aria-busy={isLoading}>
        <div>
          <label className="auth-label" htmlFor="login">E-mail ou usuário</label>
          <input className="auth-input" id="login" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={loginValue} disabled={isLoading} onChange={(event) => setLoginValue(event.target.value)} placeholder="Seu e-mail ou nome de usuário" />
        </div>
        <div>
          <label className="auth-label" htmlFor="password">Senha</label>
          <div className="relative">
            <input className="auth-input pr-24" id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} disabled={isLoading} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" />
            <button className="absolute inset-y-0 right-4 text-xs text-muted hover:text-foreground" type="button" aria-controls="password" aria-pressed={showPassword} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>
          </div>
        </div>
        {message && <p role="alert" className="rounded-lg border border-foreground/40 bg-surface p-4 text-sm leading-6">{message}</p>}
        <button className="auth-primary" type="submit" disabled={isLoading}>{isLoading ? 'Entrando…' : 'Entrar'}<span aria-hidden="true">→</span></button>
        <p role="status" className="sr-only">{isLoading ? 'Verificando suas credenciais.' : ''}</p>
      </form>
      <p className="mt-8 text-center text-sm text-muted">Ainda não tem acesso? <a href="#/registro" className="auth-link">Veja como começar</a></p>
    </AuthLayout>
  )
}


