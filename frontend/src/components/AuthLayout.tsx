import type { ReactNode } from 'react'
import './AuthLayout.css'

interface AuthLayoutProps {
  children: ReactNode
  page: 'login' | 'registro'
}

export default function AuthLayout({ children, page }: AuthLayoutProps) {
  const isLogin = page === 'login'

  return (
    <main className={`auth-page ${isLogin ? 'login-page' : 'register-page'}`}>
      <a href="#/login" aria-label="HybridLab — início" className="auth-brand">
        <img src="/hybridlab-logo-color.png" alt="HybridLab" width="200" height="200" />
      </a>
      <header className="auth-header">
        <h1>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h1>
        <p>{isLogin ? 'Entre para continuar no HybridLab' : 'Comece sua jornada no HybridLab'}</p>
      </header>
      <div className="auth-content">{children}</div>
    </main>
  )
}
