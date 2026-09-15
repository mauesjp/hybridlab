function DashboardPage() {
  const userName = localStorage.getItem('userName')
  const role = localStorage.getItem('role')

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userName')
    localStorage.removeItem('role')

    window.location.reload()
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Usuário: {userName}</p>
      <p>Perfil: {role}</p>

      <button onClick={handleLogout}>
        Sair
      </button>
    </div>
  )
}

export default DashboardPage