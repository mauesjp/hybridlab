import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AuthLayout from '../components/AuthLayout'
import { register } from '../services/authService'
import './RegisterPage.css'

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const disabled = isLoading || Boolean(success)
  const today = new Date()
  const latestBirthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    if (!success) return
    const timeout = window.setTimeout(() => {
      window.location.hash = '#/login'
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [success])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled) return
    setError('')
    if (!displayName.trim() || !username.trim()) {
      setError('Informe seu nome e nome de usuário.')
      return
    }

    setIsLoading(true)
    try {
      const response = await register({
        displayName: displayName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        accountType: 'Student',
        birthDate,
      })
      setSuccess(response.message || 'Conta criada com sucesso. Você será direcionado para entrar.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível criar sua conta.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout page="registro">
      <form className="register-form" onSubmit={handleSubmit} aria-busy={isLoading}>
        <div>
          <label htmlFor="register-name" className="auth-label">Nome</label>
          <input id="register-name" name="name" className="auth-input" value={displayName} onChange={event => setDisplayName(event.target.value)} autoComplete="name" placeholder="Insira seu nome" maxLength={100} disabled={disabled} required />
        </div>
        <div>
          <label htmlFor="register-username" className="auth-label">Nome de usuário</label>
          <input id="register-username" name="username" className="auth-input" value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Crie seu nome de usuário" minLength={3} maxLength={50} disabled={disabled} required />
        </div>
        <div>
          <label htmlFor="register-email" className="auth-label">E-mail</label>
          <input id="register-email" name="email" className="auth-input" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="voce@email.com" disabled={disabled} required />
        </div>
        <div>
          <label htmlFor="register-password" className="auth-label">Senha</label>
          <div className="auth-password">
            <input id="register-password" name="password" className="auth-input" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" placeholder="Crie sua senha" minLength={6} disabled={disabled} required />
            {password && <button className="auth-password-toggle" type="button" disabled={disabled} aria-controls="register-password" aria-pressed={showPassword} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button>}
          </div>
        </div>
        <div>
          <label htmlFor="register-birth-date" className="auth-label">Data de nascimento</label>
          <div className="register-date" data-empty={!birthDate}>
            <input id="register-birth-date" name="birthDate" className="auth-input" type="date" lang="pt-BR" value={birthDate} onChange={event => setBirthDate(event.target.value)} autoComplete="bday" max={latestBirthDate} disabled={disabled} required />
            {!birthDate && <span className="register-date-placeholder" aria-hidden="true">dd/mm/aaaa</span>}
          </div>
        </div>
        {error && <p role="alert" className="auth-notice">{error}</p>}
        {success && <p role="status" className="auth-notice">{success}</p>}
        <button className="auth-primary" type="submit" disabled={disabled}>{isLoading ? 'Criando conta…' : success ? 'Conta criada' : 'Criar conta'}</button>
        <p role="status" className="sr-only">{isLoading ? 'Criando sua conta. Aguarde.' : ''}</p>
      </form>
      <p className="register-login">Já possui uma conta? <a href="#/login" className="auth-link">Entrar</a></p>
    </AuthLayout>
  )
}
