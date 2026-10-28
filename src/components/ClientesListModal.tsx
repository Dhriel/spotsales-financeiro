import { useState, useMemo } from 'react'
import { X, Search, User, Phone, Mail, Calendar, DollarSign, Send, CreditCard, ChevronRight, FileText, Wallet } from 'lucide-react'
import { useClientes, useClienteDetail } from '../hooks/useSupabase'
import { formatCurrency, formatDate, formatMonthYear } from '../lib/utils'
import { StatusPagamentoBadge, StatusEnvioBadge } from './StatusBadge'
import type { FiltrosState, Cliente } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  filtros: FiltrosState
}

export default function ClientesListModal({ open, onClose, filtros }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const { clientes, loading: loadingClientes } = useClientes()

  const ativos = useMemo(() => {
    let list = clientes.filter((c) => c.ativo !== false)
    if (filtros.envia_nf) {
      const envNfValue = filtros.envia_nf === 'true'
      list = list.filter((c) => c.envia_nf === envNfValue)
    }
    if (filtros.canais) {
      list = list.filter((c) => c.canais === filtros.canais)
    }
    if (filtros.forma_pgt) {
      list = list.filter((c) => (c as any).forma_de_pgt === filtros.forma_pgt)
    }
    if (filtros.dia_vencimento) {
      const diaVenc = parseInt(filtros.dia_vencimento)
      list = list.filter((c) => c.dia_vencimento === diaVenc)
    }
    if (filtros.cliente) {
      const term = filtros.cliente.toLowerCase()
      list = list.filter((c) => c.descricao?.toLowerCase().includes(term))
    }
    return list
  }, [clientes, filtros])

  const filtered = useMemo(() => {
    if (!search.trim()) return ativos
    const term = search.toLowerCase()
    return ativos.filter((c) => c.descricao.toLowerCase().includes(term))
  }, [ativos, search])

  const handleClose = () => {
    setSearch('')
    setSelectedCliente(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

      <div className="relative w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl border border-brand-100/50 z-10 max-h-[85vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-100/50 shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED08, #5B21B608)' }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-brand-950">
                {selectedCliente ? selectedCliente.descricao : 'Clientes'}
              </h2>
              {selectedCliente?.ativo === false && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                  Desativado
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedCliente ? 'Detalhes e lançamentos' : `${ativos.length} clientes cadastrados`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCliente && (
              <button
                onClick={() => setSelectedCliente(null)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-50 border border-brand-200 transition-colors"
              >
                Voltar
              </button>
            )}
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-brand-100/50 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {selectedCliente ? (
          <ClienteDetalhe clienteId={selectedCliente.id} cliente={selectedCliente} />
        ) : (
          <>
            {/* Search */}
            <div className="p-4 border-b border-brand-100/50 shrink-0">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar por nome..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-brand-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loadingClientes ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-700 border-t-transparent" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">Nenhum cliente encontrado</div>
              ) : (
                <div className="divide-y divide-brand-100/30">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCliente(c)}
                      className="w-full text-left px-5 py-3.5 hover:bg-brand-50/50 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                          <User size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-brand-950 truncate">{c.descricao}</p>
                            {c.ativo === false && (
                              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                                Inativo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            {c.contato && <span>{c.contato}</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ClienteDetalhe({ clienteId, cliente }: { clienteId: number; cliente: Cliente }) {
  const { lancamentos, envios, loading } = useClienteDetail(clienteId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-700 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 animate-fade-in-down">
      {/* Client info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cliente.contato && (
          <InfoCard icon={User} label="Contato" value={cliente.contato} />
        )}
        {cliente.whatsapp && (
          <InfoCard icon={Phone} label="WhatsApp" value={cliente.whatsapp} />
        )}
        {cliente.email && (
          <InfoCard icon={Mail} label="Email" value={cliente.email} />
        )}
        {cliente.cnpj_cpf && (
          <InfoCard icon={FileText} label="CNPJ/CPF" value={cliente.cnpj_cpf} />
        )}
        {cliente.dia_vencimento && (
          <InfoCard icon={Calendar} label="Dia Vencimento" value={`Dia ${cliente.dia_vencimento}`} />
        )}
        {cliente.forma_de_pgt && (
          <InfoCard icon={Wallet} label="Forma de Pagamento" value={cliente.forma_de_pgt} />
        )}
        <InfoCard icon={FileText} label="Envia NF" value={cliente.envia_nf ? 'Sim' : 'Não'} />
      </div>

      {/* Lancamentos */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
          <CreditCard size={14} />
          Todos os Lançamentos ({lancamentos.length})
        </h4>

        {lancamentos.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm bg-brand-50/30 rounded-lg">
            Nenhum lançamento encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {lancamentos.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-brand-100/50 overflow-hidden shadow-sm">
                {/* Month label */}
                <div className="px-4 py-1.5 bg-brand-50/50 border-b border-brand-100/30">
                  <p className="text-xs font-semibold text-brand-700 capitalize">{formatMonthYear(l.vencimento)}</p>
                </div>
                <div className="p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Vencimento</p>
                      <p className="text-sm font-semibold text-brand-950 flex items-center gap-1.5">
                        <Calendar size={13} className="text-brand-400" />
                        {formatDate(l.vencimento)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Valor</p>
                      <p className="text-sm font-bold text-brand-700">{formatCurrency(l.valor)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Forma</p>
                      <p className="text-sm text-gray-700">{l.forma_pgt || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Canal</p>
                      <p className="text-sm text-gray-700">{l.canais || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPagamentoBadge status={l.status_pagamento} />
                    {l.data_pagamento && (
                      <span className="text-xs text-emerald-600 font-medium">Pago em {formatDate(l.data_pagamento)}</span>
                    )}
                  </div>
                </div>

                {/* Envios */}
                {envios[l.id] && envios[l.id].length > 0 && (
                  <div className="pt-2 border-t border-brand-100/30">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Send size={11} />
                      Envios ({envios[l.id].length})
                    </p>
                    <div className="space-y-1">
                      {envios[l.id].map((e) => (
                        <div key={e.id} className="flex items-center gap-3 text-xs py-0.5">
                          <span className="text-gray-500 font-medium">{formatDate(e.data_envio)}</span>
                          <StatusEnvioBadge status={e.status_envio} />
                          <span className="text-gray-500">{e.canal_envio}</span>
                          {e.observacao && <span className="text-gray-400 italic truncate max-w-[200px]">{e.observacao}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!envios[l.id] || envios[l.id].length === 0) && (
                  <div className="pt-2 border-t border-brand-100/30 flex items-center gap-1.5 text-xs text-gray-400">
                    <Send size={11} />
                    <span>Sem envios</span>
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-brand-100/50 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-brand-500" />
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-brand-950 truncate">{value}</p>
    </div>
  )
}
