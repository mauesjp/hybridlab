import { useCallback, useEffect, useRef, useState } from 'react'

export function useRemote<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    let active = true
    // O resultado antigo não deve reaparecer depois de trocar de plano ou tela.
    Promise.resolve().then(() => {
      if (active) { setLoading(true); setError('') }
      return load()
    }).then(result => { if (active) setData(result) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os dados.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [load, revision])
  return { data, error, loading, reload }
}

export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  async function run(task: () => Promise<unknown>, onSuccess?: () => void) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try { await task(); onSuccess?.() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar.') }
    finally { lock.current = false; setBusy(false) }
  }
  return { busy, error, run }
}
