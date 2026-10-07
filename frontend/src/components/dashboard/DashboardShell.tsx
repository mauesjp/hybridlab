import { useRef } from 'react'
import type { ReactNode } from 'react'
import { clearSession } from '../../services/api'
import '../AuthLayout.css'
import './DashboardOverview.css'
const asset = (name: string) => `/dashboard/${name}`
const links = [{ href: '#/semana', label: 'Minha semana' }, { href: '#/peso', label: 'Peso corporal' }, { href: '#/avaliacao', label: 'Avaliação física' }, { href: '#/historico', label: 'Histórico de treinos' }]
interface Props { children: ReactNode; title: string; subtitle: string; displayName?: string; current: 'dashboard' | 'strength' | 'running' | 'account'; loading: boolean; refresh: () => void; className?: string }
export default function DashboardShell({ children, title, subtitle, displayName, current, loading, refresh, className = '' }: Props) {
 const account = useRef<HTMLDialogElement>(null)
 return <div className={`overview-page ${className}`}><div className="overview-container">
        <header className="overview-header">
          <a href="#/dashboard" aria-label="HybridLab — dashboard" className="overview-brand"><img src="/hybridlab-logo-color.png" alt="HybridLab" width="130" height="130" /></a>
          <div className="overview-greeting"><h1>{title}</h1><p>{subtitle}</p></div>
          <div className="overview-tools">
            <details className="overview-notifications"><summary aria-label="Notificações"><img src={asset('notification.png')} alt="" width="27" height="27" /></summary><p>As notificações ainda não estão disponíveis.</p></details>
            <button type="button" aria-label="Abrir minha conta" onClick={() => account.current?.showModal()}><img className="overview-avatar" src={asset('avatar.png')} alt="" width="60" height="60" /></button>
          </div>
        </header>
<main>{children}</main></div>
      <nav className="overview-navigation" aria-label="Navegação principal">
        <a href="#/dashboard" aria-label="Dashboard" aria-current={current === 'dashboard' ? 'page' : undefined} className={current === 'dashboard' ? 'overview-nav-active' : undefined}><img className="overview-nav-background" src={asset(current === 'dashboard' ? 'nav-active.svg' : 'nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('home.png')} alt="" width="46" height="46" /></a>
        <a href="#/musculacao" aria-label="Treinos" aria-current={current === 'strength' ? 'page' : undefined} className={current === 'strength' ? 'overview-nav-active' : undefined}><img className="overview-nav-background" src={asset(current === 'strength' ? 'nav-active.svg' : 'nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('strength.png')} alt="" width="40" height="40" /></a>
        <a href="#/corrida" aria-label="Corrida" aria-current={current === 'running' ? 'page' : undefined} className={current === 'running' ? 'overview-nav-active' : undefined}><img className="overview-nav-background" src={asset(current === 'running' ? 'nav-active.svg' : 'nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('running.png')} alt="" width="40" height="40" /></a>
        <button type="button" disabled aria-label="Nutrição — em breve"><img className="overview-nav-background" src={asset('nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('nutrition.png')} alt="" width="40" height="40" /></button>
        <button type="button" aria-label="Minha conta e módulos" onClick={() => account.current?.showModal()}><img className="overview-nav-background" src={asset('nav-default.svg')} alt="" /><img className="overview-nav-icon" src={asset('profile.png')} alt="" width="40" height="40" /></button>
      </nav>
      <dialog ref={account} className="overview-account" aria-labelledby="account-heading"><div><h2 id="account-heading">{displayName || 'Minha conta'}</h2><button type="button" onClick={() => account.current?.close()} aria-label="Fechar minha conta">×</button></div><p>Conta pessoal</p><nav aria-label="Módulos da conta">{links.map(link => <a key={link.href} href={link.href} onClick={() => account.current?.close()}>{link.label} →</a>)}</nav><button className="overview-action" disabled={loading} onClick={refresh}>{loading ? 'Atualizando…' : 'Atualizar dados'}</button><button className="overview-logout" onClick={() => { clearSession(); window.location.hash = '#/login' }}>Sair da conta</button></dialog>
</div>
}
