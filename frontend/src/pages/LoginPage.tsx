import { useState } from 'react'
import { login } from '../services/authService'

function LoginPage() {
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const response = await login({
        login: loginValue,
        password: password,
      })

      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      localStorage.setItem('userName', response.userName)
      localStorage.setItem('role', response.role)

      window.location.reload()

      setMessage(`Bem-vindo, ${response.userName}`)
    } catch (error) {
        console.error(error)
      setMessage('erro, veja o console')
    }
  }

  return (
    <div>
      <h1>HybridLab</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login">Email ou usuário</label>
          <input
            id="login"
            type="text"
            value={loginValue}
            onChange={(event) => setLoginValue(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button type="submit">
          Entrar
        </button>
      </form>

      <p>{message}</p>
    </div>
  )
}

export default LoginPage