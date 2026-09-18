export function planStatus(plan: { isActive: boolean; isPublished: boolean }) { return plan.isActive ? 'Ativo' : plan.isPublished ? 'Publicado · inativo' : 'Rascunho' }
export function dateTime(value: string) {
  // O banco guarda UTC; alguns DateTime do .NET chegam sem o sufixo Z.
  const utcValue = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`
  return new Date(utcValue).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
export function numberValue(form: FormData, name: string) { return Number(form.get(name)) }
export function optionalNumber(form: FormData, name: string) { const value = String(form.get(name) ?? '').trim(); return value === '' ? null : Number(value) }

