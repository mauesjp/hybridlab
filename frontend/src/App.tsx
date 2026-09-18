import './App.css'
import ThemeToggle from './components/ThemeToggle'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const [hash, setHash] = useState(window.location.hash)
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem('accessToken')))
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    const handleSession = () => setAuthenticated(Boolean(localStorage.getItem('accessToken')))
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('hybridlab:session-changed', handleSession)
    window.addEventListener('storage', handleSession)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('hybridlab:session-changed', handleSession)
      window.removeEventListener('storage', handleSession)
    }
  }, [])

  return (
    <>
      <header className="flex h-16 items-center justify-end border-b border-border bg-background px-6 sm:px-12"><ThemeToggle /></header>
      {authenticated ? <DashboardPage route={hash} /> : hash === '#/registro' ? <RegisterPage /> : <LoginPage />}
    </>
  )
}

export default App

