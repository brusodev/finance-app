import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, AlertCircle, CalendarClock, Check, ChevronRight, Clock,
  FileText, Plus, Receipt, Wallet,
} from 'lucide-react'
import { accountsAPI, creditCardsAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import StatementPaymentModal from '../components/StatementPaymentModal'
import {
  statusInfo, monthShort, monthLong, dayMonth, fullDate, cycleLabel, payableMonths,
} from '../utils/statements'

const card = 'rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03]'

function StatusBadge({ status }) {
  const { label, cls } = statusInfo(status)
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${cls}`}>{label}</span>
}

function MonthCard({ m, selected, onClick, currency }) {
  const stmt = m.statement
  const amount = stmt ? stmt.total_amount : m.projected_total
  return (
    <button
      onClick={onClick}
      data-month={m.reference_month}
      aria-pressed={selected}
      className={`shrink-0 w-44 text-left rounded-xl border p-3 transition-colors ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/60 dark:bg-blue-900/20'
          : 'border-zinc-200 dark:border-white/[0.08] hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-white/[0.02]'
      } ${m.phase === 'future' ? 'border-dashed' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-semibold text-zinc-800 dark:text-white">{monthShort(m.reference_month)}</span>
        {m.phase === 'current' && <span className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">Atual</span>}
      </div>
      <StatusBadge status={m.status} />
      <p className={`mt-2 text-base font-bold ${stmt ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
        {amount > 0 || stmt ? formatCurrency(amount, currency) : '—'}
      </p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        {stmt ? (stmt.paid_on ? `Paga em ${dayMonth(stmt.paid_on)}` : stmt.outstanding > 0 ? `Falta ${formatCurrency(stmt.outstanding, currency)}` : '')
          : m.projected_total > 0 ? 'em parcelas já assumidas' : ''}
      </p>
      {m.due_date && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Vence {dayMonth(m.due_date)}</p>}
    </button>
  )
}

function InstallmentBars({ schedule, currency }) {
  const months = schedule?.months ?? []
  if (!months.length) return null
  const max = Math.max(...months.map(m => m.total))
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-2">Comprometido por fatura</p>
      <ul className="space-y-1.5" aria-label="Total de parcelas por mês de vencimento">
        {months.map(m => (
          <li key={m.due_month} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">{monthShort(m.due_month)}</span>
            <span className="h-3 rounded bg-zinc-100 dark:bg-white/[0.05] overflow-hidden">
              <span className="block h-full rounded bg-amber-500/80" style={{ width: `${Math.max((m.total / max) * 100, 3)}%` }} />
            </span>
            <span className="font-medium text-zinc-700 dark:text-zinc-200 tabular-nums">{formatCurrency(m.total, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CreditCardStatements() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const currency = user?.currency

  const [account, setAccount] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [timeline, setTimeline] = useState(null)
  const [installments, setInstallments] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payMonth, setPayMonth] = useState(null)
  const stripRef = useRef(null)

  const load = async ({ keepSelection = false } = {}) => {
    try {
      setError('')
      const [all, tl, inst, sched] = await Promise.all([
        accountsAPI.getAll(),
        creditCardsAPI.getStatements(accountId, { monthsBack: 12, monthsAhead: 6 }),
        creditCardsAPI.listInstallments(accountId).catch(() => null),
        creditCardsAPI.getInstallmentSchedule(accountId, 12).catch(() => null),
      ])
      setAccounts(all)
      setAccount(all.find(a => String(a.id) === String(accountId)) ?? null)
      setTimeline(tl)
      setInstallments(inst)
      setSchedule(sched)
      if (!keepSelection) {
        const payable = payableMonths(tl)
        setSelected(payable[0]?.reference_month ?? tl.current_month)
      }
    } catch {
      setError('Erro ao carregar as faturas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [accountId])

  const month = useMemo(
    () => timeline?.months.find(m => m.reference_month === selected) ?? null,
    [timeline, selected],
  )

  // Rola a faixa até o mês selecionado.
  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-month="${selected}"]`)
    el?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [selected, timeline])

  useEffect(() => {
    const id = month?.statement?.id
    if (!id) { setDetail(null); return }
    let alive = true
    setDetailLoading(true)
    creditCardsAPI.getStatement(accountId, id)
      .then(d => { if (alive) setDetail(d) })
      .catch(() => { if (alive) setDetail(null) })
      .finally(() => { if (alive) setDetailLoading(false) })
    return () => { alive = false }
  }, [accountId, month?.statement?.id, month?.statement?.paid_amount])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  const stmt = month?.statement
  const payable = payableMonths(timeline)
  const totalOpen = payable.reduce((s, m) => s + m.statement.outstanding, 0)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/cartoes')} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/[0.06]" aria-label="Voltar">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white truncate">Faturas · {account?.name}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Cada fatura leva o nome do mês em que vence.</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/cartoes/${accountId}/importar`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
        >
          <Plus size={16} /> Importar fatura
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {timeline && !timeline.configured && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle size={16} />
          Configure o dia de fechamento e de vencimento do cartão para ver o ciclo de cada fatura.
        </div>
      )}

      {payable.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-700 dark:text-red-300">
          <Wallet size={16} />
          {payable.length === 1
            ? <>Fatura {monthShort(payable[0].reference_month)} com {formatCurrency(totalOpen, currency)} em aberto.</>
            : <>{payable.length} faturas com {formatCurrency(totalOpen, currency)} em aberto.</>}
        </div>
      )}

      {/* Faixa de meses */}
      {timeline && (
        <div ref={stripRef} className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x" role="list" aria-label="Faturas por mês">
          {timeline.months.map(m => (
            <MonthCard
              key={m.reference_month}
              m={m}
              currency={currency}
              selected={m.reference_month === selected}
              onClick={() => setSelected(m.reference_month)}
            />
          ))}
        </div>
      )}

      {month && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Detalhe do mês */}
          <section className={`${card} p-5 xl:col-span-2 space-y-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Fatura de {monthLong(month.reference_month)}</h2>
                  <StatusBadge status={month.status} />
                </div>
                {month.due_date && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                    <CalendarClock size={14} /> {cycleLabel(month)}
                  </p>
                )}
              </div>
              {stmt && stmt.outstanding > 0 && (
                <button
                  onClick={() => setPayMonth(month)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Pagar fatura <ChevronRight size={15} />
                </button>
              )}
            </div>

            {stmt ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Total', stmt.total_amount, 'text-zinc-900 dark:text-white'],
                  ['Pago', stmt.paid_amount, 'text-green-600 dark:text-green-400'],
                  ['Em aberto', stmt.outstanding, stmt.outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'],
                ].map(([label, v, cls]) => (
                  <div key={label} className="rounded-lg bg-zinc-50 dark:bg-[#1a1a1a] p-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
                    <p className={`font-semibold tabular-nums ${cls}`}>{formatCurrency(v, currency)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-zinc-50 dark:bg-[#1a1a1a] p-4 text-sm text-zinc-600 dark:text-zinc-300">
                {month.status === 'missing' && 'Esta fatura ainda não foi importada.'}
                {month.status === 'pending_review' && 'Há um lote desta fatura aguardando revisão.'}
                {month.status === 'open_cycle' && (month.closed ? 'O ciclo fechou; importe a fatura quando o banco liberar.' : 'Ciclo em andamento: as compras ainda estão entrando nesta fatura.')}
                {month.status === 'forecast' && 'Fatura futura.'}
                {month.projected_total > 0 && (
                  <> Já comprometido em parcelas: <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(month.projected_total, currency)}</strong>.</>
                )}
              </div>
            )}

            {month.pending_batch_ids.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {month.pending_batch_ids.map(id => (
                  <button key={id} onClick={() => navigate(`/cartoes/${accountId}/importar`, { state: { batchId: id } })}
                    className="text-sm px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                    Revisar lote #{id}
                  </button>
                ))}
              </div>
            )}

            {stmt?.payments?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2">Pagamentos</h3>
                <ul className="space-y-1.5">
                  {stmt.payments.map(p => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                        <Check size={14} className="text-green-500" />
                        Pago em {fullDate(p.date)}{p.from_account_name ? ` · ${p.from_account_name}` : ''}
                        {month.due_date && p.date > month.due_date && (
                          <span className="text-[11px] text-red-600 dark:text-red-400">após o vencimento</span>
                        )}
                      </span>
                      <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-100">{formatCurrency(p.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {month.projected_installments.length > 0 && !stmt && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-500" /> Parcelas previstas nesta fatura
                </h3>
                <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
                  {month.projected_installments.map((p, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 flex items-center gap-2">
                        <span className="truncate text-zinc-700 dark:text-zinc-200">{p.description}</span>
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          {p.number}/{p.total}{p.number === p.total ? ' · última' : ` · até ${monthShort(p.end_month)}`}
                        </span>
                      </span>
                      <span className="tabular-nums text-zinc-700 dark:text-zinc-200">{formatCurrency(p.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stmt && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-2 flex items-center gap-1.5">
                  <Receipt size={14} /> Lançamentos
                  {detail?.batches?.length > 1 && (
                    <span className="text-xs font-normal text-zinc-500">· {detail.batches.length} importações somadas</span>
                  )}
                </h3>
                {detailLoading && !detail ? (
                  <div className="py-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
                ) : (
                  <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/[0.06]">
                          <th className="py-2 pr-3 font-medium">Data da compra</th>
                          <th className="py-2 pr-3 font-medium">Descrição</th>
                          <th className="py-2 pr-3 font-medium hidden md:table-cell">Categoria</th>
                          <th className="py-2 pr-3 font-medium">Parcela</th>
                          <th className="py-2 font-medium text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                        {(detail?.items ?? []).map(i => (
                          <tr key={i.id}>
                            <td className="py-2 pr-3 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                              {fullDate(i.date)}
                              {i.out_of_cycle && (
                                <span title="Data fora do período de compras desta fatura" className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] text-zinc-500">
                                  fora do ciclo
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-100 max-w-[16rem] truncate">{i.description}</td>
                            <td className="py-2 pr-3 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{i.category_name ?? '—'}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {i.installment_total ? (
                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                  {i.installment_current}/{i.installment_total}
                                  {i.installment_end_month && i.installment_current < i.installment_total && ` · termina ${monthShort(i.installment_end_month)}`}
                                </span>
                              ) : <span className="text-zinc-400">à vista</span>}
                            </td>
                            <td className="py-2 text-right tabular-nums text-zinc-800 dark:text-zinc-100">{formatCurrency(i.amount, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {detail?.batches?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {detail.batches.map(b => (
                      <button key={b.id} onClick={() => navigate(`/cartoes/${accountId}/importar`, { state: { batchId: b.id } })}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.06]">
                        <FileText size={12} /> {b.file_name || `Lote #${b.id}`} · {b.item_count} itens
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Parcelamentos */}
          <aside className={`${card} p-5 space-y-5`}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Parcelamentos em aberto
              </h2>
              {installments?.count > 0 && (
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(installments.total_remaining, currency)}</span>
              )}
            </div>
            {!installments?.count ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma compra parcelada com parcelas por vir.</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {installments.items.map((p, idx) => (
                    <li key={idx} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-zinc-700 dark:text-zinc-200">{p.description}</span>
                        <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-300">{formatCurrency(p.per_installment, currency)}/mês</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-zinc-100 dark:bg-white/[0.06] overflow-hidden"
                        role="progressbar" aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.current}
                        aria-label={`${p.description}: parcela ${p.current} de ${p.total}`}>
                        <div className="h-full bg-amber-500" style={{ width: `${(p.current / p.total) * 100}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {p.current}/{p.total} · faltam {p.remaining}× ({formatCurrency(p.remaining_amount, currency)}) · última em {monthShort(p.end_month)}
                      </p>
                    </li>
                  ))}
                </ul>
                <InstallmentBars schedule={schedule} currency={currency} />
              </>
            )}
          </aside>
        </div>
      )}

      {payMonth && account && (
        <StatementPaymentModal
          account={account}
          month={payMonth}
          accounts={accounts}
          currency={currency}
          onClose={() => setPayMonth(null)}
          onPaid={() => load({ keepSelection: true })}
        />
      )}
    </div>
  )
}
