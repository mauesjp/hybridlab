import { useState } from 'react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import { login } from '../services/authService'
import './LoginPage.css'

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRecoveryHelp, setShowRecoveryHelp] = useState(false)

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
      <form onSubmit={handleSubmit} className="login-form" aria-busy={isLoading}>
        <div>
          <label className="auth-label" htmlFor="login">E-mail ou usuário</label>
          <input className="auth-input" id="login" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={loginValue} disabled={isLoading} onChange={(event) => setLoginValue(event.target.value)} placeholder="Seu e-mail ou nome de usuário" />
        </div>
        <div>
          <label className="auth-label" htmlFor="password">Senha</label>
          <div className="auth-password">
            <input className="auth-input" id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} disabled={isLoading} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" />
            {password && <button className="auth-password-toggle" type="button" disabled={isLoading} aria-controls="password" aria-pressed={showPassword} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>}
          </div>
          <button type="button" className="login-recovery" aria-expanded={showRecoveryHelp} aria-controls="login-recovery-help" onClick={() => setShowRecoveryHelp(!showRecoveryHelp)}>Esqueceu sua senha?</button>
          <p id="login-recovery-help" className="auth-notice" role="status" hidden={!showRecoveryHelp}>A recuperação de senha ainda não está disponível.</p>
        </div>
        {message && <p role="alert" className="auth-notice">{message}</p>}
        <button className="auth-primary" type="submit" disabled={isLoading}>{isLoading ? 'Entrando…' : 'Entrar'}</button>
        <p role="status" className="sr-only">{isLoading ? 'Verificando suas credenciais.' : ''}</p>
      </form>
      <p className="login-register">Ainda não tem uma conta? <a href="#/registro" className="auth-link">Criar conta</a></p>
    </AuthLayout>
  )
}


