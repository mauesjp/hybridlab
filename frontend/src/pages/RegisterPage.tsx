import { useState } from 'react'
import AuthLayout from '../components/AuthLayout'
import { register } from '../services/authService'

type AccountType = 'Student' | 'Coach'

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [accountType, setAccountType] = useState<AccountType>('Student')

  const [birthDate, setBirthDate] = useState('')

  const [canCoachStrength, setCanCoachStrength] = useState(false)
  const [canCoachRunning, setCanCoachRunning] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (accountType === 'Student' && !birthDate) {
      setError('Informe sua data de nascimento.')
      return
    }

    if (
      accountType === 'Coach' &&
      !canCoachStrength &&
      !canCoachRunning
    ) {
      setError('Selecione pelo menos uma modalidade.')
      return
    }

    try {
      setIsLoading(true)

      const response = await register({
        displayName,
        username,
        email,
        password,
        accountType,

        birthDate:
          accountType === 'Student'
            ? birthDate
            : null,

        canCoachStrength:
          accountType === 'Coach'
            ? canCoachStrength
            : false,

        canCoachRunning:
          accountType === 'Coach'
            ? canCoachRunning
            : false
      })

      setSuccess(response.message)

      setTimeout(() => {
        window.location.hash = '#/login'
      }, 1200)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Não foi possível criar sua conta.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout page="registro">
      <p className="auth-eyebrow">
        Comece sua jornada
      </p>

      <h2 className="auth-heading">
        Evoluir começa
        <br />
        com um passo.
      </h2>

      <p className="auth-description">
        Seu espaço para treinar com mais propósito.
      </p>

      <form
        className="mt-7 space-y-5"
        onSubmit={handleSubmit}
      >
        <div>
          <label
            htmlFor="register-name"
            className="auth-label"
          >
            Nome
          </label>

          <input
            id="register-name"
            className="auth-input"
            value={displayName}
            onChange={(event) =>
              setDisplayName(event.target.value)
            }
            autoComplete="name"
            placeholder="Seu nome"
            required
          />
        </div>

        <div>
          <label
            htmlFor="register-username"
            className="auth-label"
          >
            Nome de usuário
          </label>

          <input
            id="register-username"
            className="auth-input"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            autoComplete="username"
            placeholder="Seu nome de usuário"
            required
          />
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="auth-label"
          >
            E-mail
          </label>

          <input
            id="register-email"
            className="auth-input"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
            placeholder="voce@exemplo.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="auth-label"
          >
            Senha
          </label>

          <input
            id="register-password"
            className="auth-input"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="new-password"
            placeholder="Crie uma senha"
            required
          />
        </div>

        <div>
          <p className="auth-label">
            Tipo de conta
          </p>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setAccountType('Student')
              }
              className={
                accountType === 'Student'
                  ? 'auth-primary'
                  : 'auth-secondary'
              }
            >
              Aluno
            </button>

            <button
              type="button"
              onClick={() =>
                setAccountType('Coach')
              }
              className={
                accountType === 'Coach'
                  ? 'auth-primary'
                  : 'auth-secondary'
              }
            >
              Treinador
            </button>
          </div>
        </div>

        {accountType === 'Student' && (
          <div>
            <label
              htmlFor="register-birth-date"
              className="auth-label"
            >
              Data de nascimento
            </label>

            <input
              id="register-birth-date"
              className="auth-input"
              type="date"
              value={birthDate}
              onChange={(event) =>
                setBirthDate(event.target.value)
              }
              required
            />
          </div>
        )}

        {accountType === 'Coach' && (
          <div>
            <p className="auth-label">
              Modalidades
            </p>

            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={canCoachStrength}
                  onChange={(event) =>
                    setCanCoachStrength(
                      event.target.checked
                    )
                  }
                />

                Musculação
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={canCoachRunning}
                  onChange={(event) =>
                    setCanCoachRunning(
                      event.target.checked
                    )
                  }
                />

                Corrida
              </label>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-border bg-surface p-4"
          >
            <p className="text-sm">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-border bg-surface p-4"
          >
            <p className="text-sm">
              {success}
            </p>
          </div>
        )}

        <button
          className="auth-primary"
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? 'Criando conta...'
            : 'Criar conta'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Já tem uma conta?{' '}
        <a
          href="#/login"
          className="auth-link"
        >
          Entrar na minha conta
        </a>
      </p>
    </AuthLayout>
  )
}
