import { useState } from 'react'

type Theme = 'dark' | 'light'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  )

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', nextTheme === 'dark' ? '#000000' : '#ffffff',
    )
    setTheme(nextTheme)
    try {
      localStorage.setItem('hybridlab-theme', nextTheme)
    } catch {
      // O tema continua funcionando se o navegador bloquear o armazenamento.
    }
  }

  return (
    <button type="button" onClick={toggleTheme} className="flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm text-foreground hover:bg-control" aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {theme === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z" />}
      </svg>
      {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
    </button>
  )
}
