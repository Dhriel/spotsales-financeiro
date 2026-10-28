import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Send, ChevronLeft, ChevronRight, AlertCircle, X, User, Phone, Eye, DollarSign, Loader2 } from 'lucide-react'
import { useLancamentos, useClientes } from '../hooks/useSupabase'
import { formatCurrency, formatDate, getDefaultFilters, getDateRange, diasParaVencimento } from '../lib/utils'
import { StatusPagamentoBadge, StatusEnvioBadge } from '../components/StatusBadge'
import FilterBar from '../components/FilterBar'
import ClienteDetailModal from '../components/ClienteDetailModal'
import { supabase } from '../lib/supabase'
import type { FiltrosState, Cliente } from '../types'

const SUPABASE_URL = 'https://eohugjtnhmcnedqzzpyy.supabase.co'

type SortKey = 'descricao' | 'vencimento' | 'valor' | 'status_pagamento' | 'envios_count'
type SortDir = 'asc' | 'desc'
type TabType = 'atual' | 'proximo'

const PAGE_SIZE = 20

export default function Lancamentos() {
  const [filtros, setFiltros] = useState<FiltrosState>(getDefaultFilters())
  const [tabAtiva, setTabAtiva] = useState<TabType>('atual')
  const [filtroEnviadosHoje, setFiltroEnviadosHoje] = useState(false)
  const [filtroNaoEnviados, setFiltroNaoEnviados] = useState(false)
  const { lancamentos, loading, refetch: refetchLancamentos } = useLancamentos(filtros)

  const filtrosProximoMes = useMemo<FiltrosState>(() => {
    const hoje = new Date()
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      ...filtros,
      mes: null,
      ano: null,
      dataInicio: fmt(inicio),
      dataFim: fmt(fim),
    }
  }, [filtros])
  const { lancamentos: lancamentosProximoMes, loading: loadingProximo, refetch: refetchProximoMes } = useLancamentos(filtrosProximoMes)
  const [sortKey, setSortKey] = useState<SortKey>('vencimento')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const [showSemLancamento, setShowSemLancamento] = useState(false)
  const { clientes } = useClientes()

  const [confirmBaixa, setConfirmBaixa] = useState<any | null>(null)
  const [notificarBaixa, setNotificarBaixa] = useState(true)
  const [baixaLoading, setBaixaLoading] = useState<number | null>(null)
  const [baixaMsg, setBaixaMsg] = useState<{ id: number; type: 'success' | 'error'; text: string } | null>(null)

  const openConfirmBaixa = (lancamento: any) => {
    setNotificarBaixa(lancamento.notificar_baixa !== false)
    setConfirmBaixa(lancamento)
  }

  const handleDarBaixa = async (lancamento: any, notificar: boolean) => {
    setBaixaLoading(lancamento.id)
    setBaixaMsg(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/asaas-baixa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lancamento_id: lancamento.id,
          cliente_id: lancamento.cliente_id,
          vencimento: lancamento.vencimento,
          notificar,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await supabase
          .from('lancamentos_mensais')
          .update({ notificar_baixa: notificar })
          .eq('id', lancamento.id)
        setBaixaMsg({ id: lancamento.id, type: 'success', text: data.message || 'Baixa realizada' })
        refetchLancamentos()
        refetchProximoMes()
      } else {
        setBaixaMsg({ id: lancamento.id, type: 'error', text: data.error || 'Erro ao dar baixa' })
      }
    } catch {
      setBaixaMsg({ id: lancamento.id, type: 'error', text: 'Erro de conexão' })
    } finally {
      setBaixaLoading(null)
      setConfirmBaixa(null)
      setNotificarBaixa(true)
    }
  }

  const clientesSemLancamento = useMemo(() => {
    const clientesComLancamento = new Set(lancamentos.map((l) => l.cliente_id))
    return clientes.filter((c) => !clientesComLancamento.has(c.id) && (c.ativo === true || c.ativo === null))
  }, [clientes, lancamentos])

  const handlePreset = (preset: string) => {
    const range = getDateRange(preset)
    setFiltros({ ...filtros, mes: null, ano: null, dataInicio: range.start, dataFim: range.end })
    setPage(1)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Verificar se deveria ser enviado hoje (baseado na forma de pagamento)
  const deveriaEnviarHoje = (l: any): boolean => {
    const dias = diasParaVencimento(l.vencimento)
    const forma = (l.forma_pgt || '').toLowerCase()
    const isPago = l.status_pagamento === 'pago'
    if (isPago) return false
    // Boleto: 5 dias antes
    if (forma === 'boleto' && dias === 5) return true
    // Pix: 1 dia antes
    if (forma === 'pix' && dias === 1) return true
    // Vence hoje
    if (dias === 0) return true
    // Atrasado (1 dia ou mais)
    if (dias <= -1) return true
    return false
  }

  const foiEnviadoHoje = (l: any): boolean => {
    if (!l.ultimo_envio) return false
    const envio = new Date(l.ultimo_envio)
    const hoje = new Date()
    return envio.getFullYear() === hoje.getFullYear() &&
           envio.getMonth() === hoje.getMonth() &&
           envio.getDate() === hoje.getDate()
  }

  // Usar dados conforme a aba ativa + filtro enviados hoje
  const dadosBase = tabAtiva === 'atual' ? lancamentos : lancamentosProximoMes
  const naoFoiEnviado = (l: any): boolean => {
    // Deveria enviar hoje e não teve envio hoje
    if (deveriaEnviarHoje(l) && !foiEnviadoHoje(l)) return true
    return false
  }

  const dadosExibicao = filtroNaoEnviados
    ? lancamentos.filter((l) => naoFoiEnviado(l))
    : filtroEnviadosHoje
    ? lancamentos.filter((l) => foiEnviadoHoje(l))
    : dadosBase

  const sorted = useMemo(() => {
    const arr = [...dadosExibicao]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'descricao':
          cmp = (a.cliente?.descricao || '').localeCompare(b.cliente?.descricao || '')
          break
        case 'vencimento':
          cmp = (a.vencimento || '').localeCompare(b.vencimento || '')
          break
        case 'valor':
          cmp = (a.valor || 0) - (b.valor || 0)
          break
        case 'status_pagamento':
          cmp = (a.status_pagamento || '').localeCompare(b.status_pagamento || '')
          break
        case 'envios_count':
          cmp = (a.envios_count || 0) - (b.envios_count || 0)
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return arr
  }, [dadosExibicao, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={13} className="text-gray-300" />
    return sortDir === 'asc' ? <ArrowUp size={13} className="text-brand-700" /> : <ArrowDown size={13} className="text-brand-700" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-950">Lançamentos</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Visão completa dos lançamentos mensais</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setTabAtiva('atual'); setFiltroEnviadosHoje(false); setFiltroNaoEnviados(false); setPage(1) }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              tabAtiva === 'atual' && !filtroEnviadosHoje && !filtroNaoEnviados
                ? 'bg-brand-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={() => { setFiltroEnviadosHoje(true); setFiltroNaoEnviados(false); setPage(1) }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filtroEnviadosHoje
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Enviados Hoje
          </button>
          <button
            onClick={() => { setFiltroNaoEnviados(true); setFiltroEnviadosHoje(false); setPage(1) }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filtroNaoEnviados
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Não Enviados
          </button>
          <button
            onClick={() => { setTabAtiva('proximo'); setFiltroEnviadosHoje(false); setFiltroNaoEnviados(false); setPage(1) }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              tabAtiva === 'proximo' && !filtroEnviadosHoje && !filtroNaoEnviados
                ? 'bg-brand-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Próximo Mês
          </button>
        </div>
      </div>

      <FilterBar filtros={filtros} onChange={(f) => { setFiltros(f); setPage(1) }} onPreset={handlePreset} />

      {loading || (tabAtiva === 'proximo' && loadingProximo) ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xs sm:text-sm text-gray-500">
                <span className="font-semibold text-brand-950">{sorted.length}</span> lançamentos encontrados
              </p>
              {clientesSemLancamento.length > 0 && !filtroEnviadosHoje && !filtroNaoEnviados && tabAtiva === 'atual' && (
                <button
                  onClick={() => setShowSemLancamento(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                >
                  <AlertCircle size={14} />
                  {clientesSemLancamento.length} sem lançamento
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Valor total: <span className="font-bold text-brand-700">{formatCurrency(sorted.reduce((s, l) => s + (l.valor || 0), 0))}</span>
            </p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-brand-100/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-100/50 bg-brand-50/30">
                    <SortTh label="Empresa" col="descricao" onSort={handleSort}><SortIcon col="descricao" /></SortTh>
                    <SortTh label="Vencimento" col="vencimento" onSort={handleSort}><SortIcon col="vencimento" /></SortTh>
                    <SortTh label="Valor" col="valor" onSort={handleSort}><SortIcon col="valor" /></SortTh>
                    <SortTh label="Enviados" col="envios_count" onSort={handleSort}><SortIcon col="envios_count" /></SortTh>
                    <Th>Status Envio</Th>
                    <SortTh label="Status Pagamento" col="status_pagamento" onSort={handleSort}><SortIcon col="status_pagamento" /></SortTh>
                    <Th className="hidden md:table-cell">Contato</Th>
                    <Th className="hidden sm:table-cell">Forma Pgt</Th>
                    <Th className="hidden md:table-cell">Canal</Th>
                    <Th className="hidden lg:table-cell">WhatsApp</Th>
                    <Th className="hidden xl:table-cell">Email</Th>
                    <Th className="hidden xl:table-cell">CNPJ/CPF</Th>
                    <Th className="hidden lg:table-cell">Plataforma</Th>
                    <Th className="hidden xl:table-cell">NF</Th>
                    <Th className="hidden md:table-cell">Dt. Pagamento</Th>
                    <Th className="hidden lg:table-cell">Último Envio</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100/30">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="text-center py-12 text-gray-400">
                        Nenhum lançamento encontrado para o período selecionado
                      </td>
                    </tr>
                  ) : (
                    paginated.map((l) => {
                      const dias = diasParaVencimento(l.vencimento)
                      const isPago = l.status_pagamento === 'pago'
                      const isSuspenso = !isPago && dias <= -5
                      const isAtrasado = !isPago && dias <= -1 && !isSuspenso && (l.envios_count || 0) === 0
                      const isVenceHojeSemEnvio = !isPago && dias === 0 && (l.envios_count || 0) === 0
                      const isNaoEnviado = (deveriaEnviarHoje(l) && !foiEnviadoHoje(l)) || isVenceHojeSemEnvio
                      const forma = (l.forma_pgt || '').toLowerCase()
                      const formaCellBg = forma === 'boleto' ? 'bg-blue-100' : forma === 'pix' ? 'bg-emerald-50' : forma.includes('cart') ? 'bg-purple-100' : ''
                      // Cartão ou cobrança manual não passam pela cobrança automática do Asaas:
                      // nos não enviados eles ganham destaque azul (em vez de vermelho).
                      const isManualOuCartao = l.cliente?.cobranca_automatica === false || forma.includes('cart')
                      const rowBg = isNaoEnviado
                        ? isManualOuCartao
                          ? 'bg-blue-50/70 hover:bg-blue-100/60'
                          : 'bg-red-50/60 hover:bg-red-50'
                        : isSuspenso
                        ? 'bg-red-50/60 hover:bg-red-50'
                        : isAtrasado
                        ? 'bg-orange-50/60 hover:bg-orange-50'
                        : 'hover:bg-brand-50/30'
                      const leftBorder = isNaoEnviado
                        ? isManualOuCartao
                          ? 'border-l-2 border-l-blue-400'
                          : 'border-l-2 border-l-red-400'
                        : isSuspenso
                        ? 'border-l-2 border-l-red-400'
                        : isAtrasado
                        ? 'border-l-2 border-l-orange-400'
                        : ''
                      return (
                      <tr key={l.id} className={`transition-colors cursor-pointer ${rowBg} ${leftBorder}`} onClick={() => setSelectedClienteId(l.cliente_id)}>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-semibold text-brand-950 whitespace-nowrap max-w-[120px] sm:max-w-[200px] text-xs sm:text-sm">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate group-hover:text-brand-700">{l.descricao || l.cliente?.descricao || '—'}</span>
                            {isNaoEnviado && isManualOuCartao && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                {l.cliente?.cobranca_automatica === false ? 'Manual' : 'Cartão'}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-700 whitespace-nowrap font-medium text-xs sm:text-sm">{formatDate(l.vencimento)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-brand-700 whitespace-nowrap text-xs sm:text-sm">{formatCurrency(l.valor)}</td>
                        <td className="px-4 py-3 text-center">
                          {l.envios_count > 0 ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${l.ultima_origem_envio === 'manual' ? 'text-amber-600' : 'text-blue-600'}`}>
                              <Send size={12} /> {l.envios_count}
                            </span>
                          ) : (
                            <span className="text-gray-300">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusEnvioBadge status={l.ultimo_status_envio} origem={l.ultima_origem_envio} />
                          {l.ultima_origem_envio === 'manual' && l.ultimo_template_envio && (
                            <div className="mt-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 w-fit max-w-[180px] truncate" title={l.ultimo_template_envio}>
                              {l.ultimo_template_envio}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3"><StatusPagamentoBadge status={l.status_pagamento} /></td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap text-xs hidden md:table-cell">{l.cliente?.contato || '—'}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs hidden sm:table-cell">
                          <span className={`inline-block px-3 py-1 rounded-full text-gray-700 font-medium ${formaCellBg}`}>{l.forma_pgt || '—'}</span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap text-xs hidden md:table-cell">{l.canais || '—'}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap text-xs hidden lg:table-cell">{l.cliente?.whatsapp || '—'}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap text-xs hidden xl:table-cell">{l.cliente?.email || '—'}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap text-xs hidden xl:table-cell">{l.cliente?.cnpj_cpf || '—'}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap text-xs hidden lg:table-cell">{l.plataforma || '—'}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap text-xs hidden xl:table-cell">{l.nf || '—'}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 whitespace-nowrap text-xs hidden md:table-cell">{formatDate(l.data_pagamento)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-500 whitespace-nowrap text-xs hidden lg:table-cell">{formatDate(l.ultimo_envio)}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                          {!isPago ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); openConfirmBaixa(l) }}
                              disabled={baixaLoading === l.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                            >
                              {baixaLoading === l.id ? (
                                <><Loader2 size={12} className="animate-spin" /> ...</>
                              ) : (
                                <><DollarSign size={12} /> Dar Baixa</>
                              )}
                            </button>
                          ) : baixaMsg && baixaMsg.id === l.id ? (
                            <span className={`text-xs font-medium ${baixaMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                              {baixaMsg.text}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-brand-100/50 bg-brand-50/20">
                <p className="text-xs text-gray-500">
                  Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, sorted.length)} de {sorted.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number
                    if (totalPages <= 5) {
                      p = i + 1
                    } else if (page <= 3) {
                      p = i + 1
                    } else if (page >= totalPages - 2) {
                      p = totalPages - 4 + i
                    } else {
                      p = page - 2 + i
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                          ${page === p ? 'bg-brand-700 text-white shadow-md' : 'text-gray-500 hover:bg-white hover:text-brand-700'}
                        `}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cliente Detail Modal */}
      <ClienteDetailModal clienteId={selectedClienteId} onClose={() => setSelectedClienteId(null)} />

      {/* Sem Lançamento Modal */}
      <SemLancamentoModal
        open={showSemLancamento}
        onClose={() => setShowSemLancamento(false)}
        clientes={clientesSemLancamento}
        onViewCliente={(id) => { setShowSemLancamento(false); setSelectedClienteId(id) }}
      />

      {/* Confirmar Dar Baixa */}
      {confirmBaixa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pt-8 pb-8 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setConfirmBaixa(null); setNotificarBaixa(true) }} />
          <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl border border-brand-100/50 z-10">
            <div className="p-6 border-b border-brand-100/50">
              <h2 className="text-lg font-bold text-brand-950">Confirmar Dar Baixa</h2>
              <p className="text-sm text-gray-500 mt-1">Tem certeza que deseja confirmar o pagamento?</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-brand-50/50 rounded-lg p-4 space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Cliente</p>
                <p className="font-semibold text-brand-950">{confirmBaixa.descricao || confirmBaixa.cliente?.descricao || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-50/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Vencimento</p>
                  <p className="font-semibold text-sm text-brand-950">{formatDate(confirmBaixa.vencimento)}</p>
                </div>
                <div className="bg-brand-50/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Valor</p>
                  <p className="font-semibold text-sm text-brand-700">{formatCurrency(confirmBaixa.valor)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-gray-700">Notificar ao Dar Baixa</span>
                <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                  <button
                    onClick={() => setNotificarBaixa(true)}
                    className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                      notificarBaixa ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setNotificarBaixa(false)}
                    className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                      !notificarBaixa ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 flex gap-3 border-t border-brand-100/50">
              <button
                onClick={() => { setConfirmBaixa(null); setNotificarBaixa(true) }}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDarBaixa(confirmBaixa, notificarBaixa)}
                disabled={baixaLoading === confirmBaixa.id}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {baixaLoading === confirmBaixa.id ? (
                  <><Loader2 size={14} className="animate-spin" /> Processando...</>
                ) : (
                  <><DollarSign size={14} /> Confirmar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SemLancamentoModal({
  open,
  onClose,
  clientes,
  onViewCliente,
}: {
  open: boolean
  onClose: () => void
  clientes: Cliente[]
  onViewCliente: (clienteId: number) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-brand-100/50 z-10 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-100/50 shrink-0" style={{ background: 'linear-gradient(135deg, #3b82f608, #1d4ed808)' }}>
          <div>
            <h2 className="text-xl font-bold text-brand-950 flex items-center gap-2">
              <AlertCircle size={20} className="text-blue-500" />
              Clientes Sem Lançamento
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {clientes.length} cliente{clientes.length > 1 ? 's' : ''} sem lançamento no período selecionado
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-brand-100/50 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {clientes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Todos os clientes possuem lançamento</div>
          ) : (
            <div className="divide-y divide-brand-100/30">
              {clientes.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onViewCliente(c.id)}
                  className="px-5 py-3.5 hover:bg-blue-50/30 transition-colors cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-950 truncate group-hover:text-brand-700 transition-colors">
                        {c.descricao}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        {c.contato && (
                          <span>{c.contato}</span>
                        )}
                        {c.whatsapp && (
                          <span className="flex items-center gap-1"><Phone size={10} />{c.whatsapp}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Eye size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  )
}

function SortTh({ label, col, onSort, children }: {
  label: string
  col: SortKey
  onSort: (col: SortKey) => void
  children: React.ReactNode
}) {
  return (
    <th
      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-brand-700 select-none transition-colors"
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1.5">
        {label}
        {children}
      </span>
    </th>
  )
}
