// Helpers de exibição das faturas de cartão (mês = mês de VENCIMENTO).

export const STATEMENT_STATUS = {
  paid: { label: 'Paga', cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  partial: { label: 'Parcial', cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  open: { label: 'Em aberto', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  overdue: { label: 'Vencida', cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
  open_cycle: { label: 'Ciclo atual', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  pending_review: { label: 'Em revisão', cls: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  missing: { label: 'Não importada', cls: 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300' },
  forecast: { label: 'Prevista', cls: 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400' },
}

export const statusInfo = (s) => STATEMENT_STATUS[s] ?? { label: s, cls: STATEMENT_STATUS.forecast.cls }

const asDate = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`) : null)

/** "Nov/2026" */
export const monthShort = (iso) => {
  const d = asDate(iso)
  if (!d) return ''
  const m = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${m.charAt(0).toUpperCase()}${m.slice(1)}/${d.getFullYear()}`
}

/** "novembro de 2026" */
export const monthLong = (iso) => asDate(iso)?.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) ?? ''

/** "06/10" */
export const dayMonth = (iso) => asDate(iso)?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) ?? ''

/** "06/10/2026" */
export const fullDate = (iso) => asDate(iso)?.toLocaleDateString('pt-BR') ?? ''

/** "Compras 06/10 – 05/11 · Fecha 05/11 · Vence 12/11" */
export const cycleLabel = (c) => {
  if (!c?.due_date) return ''
  const parts = []
  if (c.period_start && c.closing_date) parts.push(`Compras ${dayMonth(c.period_start)} – ${dayMonth(c.closing_date)}`)
  if (c.closing_date) parts.push(`Fecha ${dayMonth(c.closing_date)}`)
  parts.push(`Vence ${dayMonth(c.due_date)}`)
  return parts.join(' · ')
}

/** Faturas com saldo a pagar, da mais antiga para a mais nova. */
export const payableMonths = (timeline) =>
  (timeline?.months ?? []).filter(m => m.statement && m.statement.outstanding > 0)
