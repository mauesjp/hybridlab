import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  page: 'login' | 'registro'
}

export default function AuthLayout({ children, page }: AuthLayoutProps) {
  return (
    <div className="min-h-[calc(100svh-4rem)] bg-background text-foreground lg:grid lg:grid-cols-2">
      <aside className="flex flex-col items-center justify-between bg-background px-6 pt-4 pb-2 sm:px-12 lg:items-start lg:border-border lg:bg-surface lg:min-h-[calc(100svh-4rem)] lg:border-r lg:border-b-0 lg:p-16">
        <a href="#/login" aria-label="HybridLab — início" className="block w-fit"><img src="/hybridlab-logo.png" alt="HybridLab" width="144" height="144" className="brand-logo h-28 w-28 object-contain sm:h-36 sm:w-36" /></a>
        <div className="hidden max-w-lg lg:my-20 lg:block">
          <p className="mb-6 text-xs tracking-[0.25em] text-muted uppercase">Seu espaço de evolução</p>
          <h1 className="text-4xl leading-[1.08] font-medium tracking-tight sm:text-5xl xl:text-7xl">Organize.<br />Execute.<br /><span className="text-muted">Evolua.</span></h1>
          <p className="mt-7 max-w-sm text-sm leading-7 text-muted">Força e resistência. Método e constância. Sua jornada de treinamento começa aqui.</p>
        </div>
        <div className="hidden justify-between border-t border-border pt-6 text-[11px] tracking-[0.18em] text-muted uppercase lg:flex"><span>Performance com propósito</span><span>HybridLab</span></div>
      </aside>
      <main className="flex flex-col px-6 pt-4 pb-8 sm:px-12 lg:px-16 lg:py-10">
        <nav aria-label="Acesso à conta" className="mx-auto mb-6 flex w-full lg:mb-12 max-w-md border-b border-border text-sm">
          <a href="#/login" aria-current={page === 'login' ? 'page' : undefined} className={page === 'login' ? 'auth-tab auth-tab-active' : 'auth-tab'}>Entrar</a>
          <a href="#/registro" aria-current={page === 'registro' ? 'page' : undefined} className={page === 'registro' ? 'auth-tab auth-tab-active' : 'auth-tab'}>Criar conta</a>
        </nav>
        <div className="mx-auto w-full max-w-md lg:my-auto">{children}</div>
        <p className="mt-12 hidden text-center text-xs text-muted lg:block">HYBRIDLAB · Um passo melhor, todos os dias.</p>
      </main>
    </div>
  )
}


