import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

export function Panel({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="dash-panel">{title && <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold tracking-tight">{title}</h2>{action}</div>}{children}</section>
}
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  if (!message) return null
  return <div role="alert" className="my-4 rounded-xl border border-foreground/40 bg-surface p-4 text-sm leading-6"><p>{message}</p>{retry && <button className="dash-secondary mt-3" onClick={retry}>Tentar novamente</button>}</div>
}
export function Empty({ children }: { children: ReactNode }) { return <p className="rounded-xl border border-dashed border-border p-6 text-sm leading-6 text-muted">{children}</p> }
export function Loading() { return <div role="status" className="dash-panel text-sm text-muted">Carregando seus dados…</div> }
export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId()
  return <div><label className="auth-label" htmlFor={id}>{label}</label><input id={id} className="auth-input" {...props} /></div>
}
export function ConfirmButton({ label, message, onConfirm, disabled = false }: { label: string; message: string; onConfirm: () => void; disabled?: boolean }) {
  const [confirming, setConfirming] = useState(false)
  return confirming ? <div className="rounded-xl border border-border p-4"><p className="mb-3 text-sm leading-6">{message}</p><div className="flex flex-wrap gap-2"><button disabled={disabled} className="dash-primary" onClick={() => { setConfirming(false); onConfirm() }}>Confirmar</button><button disabled={disabled} className="dash-secondary" onClick={() => setConfirming(false)}>Cancelar</button></div></div> : <button disabled={disabled} className="dash-secondary" onClick={() => setConfirming(true)}>{label}</button>
}
export function Badge({ children }: { children: ReactNode }) { return <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted">{children}</span> }

