import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  UserRound,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'

type Situacao = 'agendado' | 'enviado' | 'erro' | 'nao_automatico' | 'pendente_envio' | 'sem_envio'

interface MonitoramentoCobranca {
  lancamento_id: number
  data_lancamento: string | null
  vencimento: string | null
  valor: number | null
  forma_pgt: string | null
  status_pagamento: string | null
  cliente: string | null
  canais: string | null
  cobranca_automatica: boolean | null
  ultimo_status_envio: string | null
  ultimo_canal_envio: string | null
  ultimo_envio_em: string | null
  ultimas_tentativas: number | null
  ultimo_codigo_http: number | null
  ultimo_erro: string | null
  entregue_em: string | null
  situacao_monitoramento: Situacao
  ultimo_origem_envio: 'automatico' | 'manual' | null
  ultima_observacao: string | null
}

const PAGE_SIZE = 25
const REMOTE_PAGE_SIZE = 1000

const situacaoConfig: Record<Situacao, { label: string; className: string }> = {
  agendado: { label: 'Agendado', className: 'bg-slate-100 text-slate-700' },
  enviado: { label: 'Enviado', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  erro: { label: 'Erro', className: 'bg-red-50 text-red-700 border border-red-200' },
  nao_automatico: { label: 'Manual', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  pendente_envio: { label: 'Pendente de envio', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  sem_envio: { label: 'Sem envio necessário', className: 'bg-gray-100 text-gray-600' },
}

function formatDateTime(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function getSituacao(row: MonitoramentoCobranca) {
  return situacaoConfig[row.situacao_monitoramento] || situacaoConfig.agendado
}

export default function Monitoramento() {
  const [rows, setRows] = useState<MonitoramentoCobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [situacao, setSituacao] = useState<Situacao | 'todos'>('todos')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result: MonitoramentoCobranca[] = []

    for (let from = 0; ; from += REMOTE_PAGE_SIZE) {
      const { data, error: queryError } = await supabase
        .from('monitoramento_cobrancas')
        .select('*')
        .order('vencimento', { ascending: false, nullsFirst: false })
        .order('lancamento_id', { ascending: false })
        .range(from, from + REMOTE_PAGE_SIZE - 1)

      if (queryError) {
        setError(queryError.message)
        setRows([])
        setLoading(false)
        return
      }

      const batch = (data || []) as MonitoramentoCobranca[]
      result.push(...batch)
      if (batch.length < REMOTE_PAGE_SIZE) break
    }

    setRows(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')

    return rows.filter((row) => {
      const matchesSituation = situacao === 'todos' || row.situacao_monitoramento === situacao
      const haystack = [row.cliente, row.forma_pgt, row.ultimo_canal_envio, row.ultima_observacao]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')

      return matchesSituation && (!term || haystack.includes(term))
    })
  }, [rows, search, situacao])

  useEffect(() => {
    setPage(1)
  }, [search, situacao])

  const totals = useMemo(() => ({
    total: rows.length,
    enviados: rows.filter((row) => row.situacao_monitoramento === 'enviado').length,
    erros: rows.filter((row) => row.situacao_monitoramento === 'erro').length,
    manuais: rows.filter((row) => row.ultimo_origem_envio === 'manual' || row.situacao_monitoramento === 'nao_automatico').length,
  }), [rows])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visibleRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6 font-body">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <ShieldAlert size={19} />
            <span className="text-xs font-bold uppercase tracking-widest">Operação financeira</span>
          </div>
          <h2 className="text-2xl font-bold text-brand-950">Monitoramento de cobranças</h2>
          <p className="mt-1 text-sm text-gray-500">Acompanhe cada lançamento, o último evento de envio e qualquer falha registrada.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Clock3} label="Lançamentos" value={totals.total} tone="brand" />
        <Metric icon={CheckCircle2} label="Enviados" value={totals.enviados} tone="emerald" />
        <Metric icon={XCircle} label="Com erro" value={totals.erros} tone="red" />
        <Metric icon={UserRound} label="Manuais" value={totals.manuais} tone="blue" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-brand-100/70 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-brand-100/70 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente, canal ou lançamento..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Filter size={15} className="text-brand-600" />
            <span className="sr-only">Filtrar por situação</span>
            <select
              value={situacao}
              onChange={(event) => setSituacao(event.target.value as Situacao | 'todos')}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="todos">Todas as situações</option>
              {Object.entries(situacaoConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-sm text-gray-500">
            <Loader2 size={25} className="animate-spin text-brand-600" />
            Carregando lançamentos e eventos…
          </div>
        ) : error ? (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Não foi possível carregar o monitoramento.</p>
              <p className="mt-1 break-words text-red-700">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1160px] text-left text-sm">
                <thead className="bg-brand-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Lançamento</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Vencimento</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Último evento</th>
                    <th className="px-4 py-3">Canal / origem</th>
                    <th className="px-4 py-3">Situação</th>
                    <th className="px-4 py-3">Detalhe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100/60">
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-gray-400">Nenhum lançamento encontrado com esses filtros.</td>
                    </tr>
                  ) : visibleRows.map((row) => {
                    const situation = getSituacao(row)
                    const isManual = row.ultimo_origem_envio === 'manual'
                    const detail = row.ultimo_erro || row.ultima_observacao || (row.ultimo_status_envio ? `Status da API: ${row.ultimo_status_envio}` : 'Aguardando evento de envio')

                    return (
                      <tr key={row.lancamento_id} className="align-top transition-colors hover:bg-brand-50/30">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-brand-950">#{row.lancamento_id} · {row.forma_pgt || 'Cobrança'}</p>
                          <p className="mt-0.5 text-xs text-gray-500">Lançado em {formatDate(row.data_lancamento)}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800">{row.cliente || 'Cliente não informado'}</p>
                          <p className="mt-0.5 text-xs text-gray-500">Pagamento: {row.status_pagamento || '—'}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-700">{formatDate(row.vencimento)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-brand-700">{formatCurrency(row.valor || 0)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="font-medium text-gray-800">{formatDateTime(row.ultimo_envio_em)}</p>
                          {row.ultimas_tentativas ? <p className="mt-0.5 text-xs text-gray-500">{row.ultimas_tentativas} tentativa{row.ultimas_tentativas === 1 ? '' : 's'}</p> : null}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {row.ultimo_canal_envio ? <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">{row.ultimo_canal_envio}</span> : <span className="text-xs text-gray-400">Sem canal</span>}
                            {isManual ? <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Manual</span> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${situation.className}`}>{situation.label}</span></td>
                        <td className="max-w-xs px-4 py-3.5 text-xs leading-relaxed text-gray-600">
                          <p className={row.ultimo_erro ? 'font-medium text-red-700' : ''}>{detail}</p>
                          {row.ultimo_codigo_http ? <p className="mt-1 text-gray-400">HTTP {row.ultimo_codigo_http}</p> : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-brand-100/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">Mostrando {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} lançamento{filtered.length === 1 ? '' : 's'}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
                <span className="text-xs font-medium text-gray-500">Página {page} de {totalPages}</span>
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40">Próxima</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Send; label: string; value: number; tone: 'brand' | 'emerald' | 'red' | 'blue' }) {
  const toneClasses = {
    brand: 'bg-brand-50 text-brand-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="rounded-2xl border border-brand-100/70 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`rounded-xl p-2 ${toneClasses[tone]}`}><Icon size={17} /></div>
      </div>
      <p className="mt-4 text-2xl font-bold text-brand-950">{value}</p>
    </div>
  )
}
