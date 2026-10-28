import { useEffect, useState } from 'react'
import { Calendar, User, CreditCard, Send, Clock, AlertOctagon, Wallet, BellOff } from 'lucide-react'
import { useKanbanData } from '../hooks/useSupabase'
import { formatCurrency, formatDate, formatDateShort, diasParaVencimento, getKanbanColumn, kanbanColumns } from '../lib/utils'
import ClienteDetailModal from '../components/ClienteDetailModal'
import type { KanbanCard } from '../types'

export default function Kanban() {
  const { data, loading, refetch } = useKanbanData()
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)

  // Group cards into columns. Dentro de cada coluna, o mais atrasado (vencimento mais antigo) vem primeiro.
  const columns = kanbanColumns.map((col) => {
    const cards = data
      .filter((item) => getKanbanColumn(item.lancamento.vencimento, item.ultimo_status_envio, item.envios_count) === col.id)
      .sort((a, b) => a.lancamento.vencimento.localeCompare(b.lancamento.vencimento))
    return { ...col, cards }
  })

  const totalCards = data.length

  // Em telas grandes a página do navegador não rola; só o Kanban (colunas) rola.
  useEffect(() => {
    if (window.innerWidth < 1024) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = prev }
  }, [])

  return (
    <div className="flex flex-col gap-4 overflow-hidden -mb-4 lg:-mb-6 xl:-mb-8 h-[calc(100vh-4rem-1rem)] lg:h-[calc(100vh-4rem-1.5rem)] xl:h-[calc(100vh-4rem-2rem)]">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-950">Kanban de Cobrança</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Visão operacional de cobrança — <span className="font-medium text-brand-700">{totalCards}</span> lançamentos em aberto
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Antecipado
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Vence Hoje
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Atrasado
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-700" />
            Suspenso
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex items-start gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 lg:-mx-6 lg:px-6 xl:-mx-8 xl:px-8">
          {columns.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-64 sm:w-72 max-h-full flex flex-col">
              {/* Column header */}
              <div className={`shrink-0 rounded-t-xl p-3 ${col.lightColor} border ${col.borderColor} border-b-0`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="text-sm font-semibold text-gray-800">{col.title}</h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.lightColor} ${col.borderColor} border text-gray-600`}>
                    {col.cards.length}
                  </span>
                </div>
              </div>

              {/* Column body */}
              <div className={`rounded-b-xl border ${col.borderColor} border-t-0 bg-white/60 p-2 min-h-[200px] overflow-y-auto space-y-2`}>
                {col.cards.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-300 text-xs">
                    Nenhum lançamento
                  </div>
                ) : (
                  col.cards.map((item: any) => (
                    <KanbanCardComponent
                      key={item.lancamento.id}
                      item={item}
                      onViewDetail={() => setSelectedClienteId(item.cliente?.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ClienteDetailModal
        clienteId={selectedClienteId}
        onClose={() => { setSelectedClienteId(null); refetch() }}
      />
    </div>
  )
}

function KanbanCardComponent({ item, onViewDetail }: { item: any; onViewDetail: () => void }) {
  const dias = diasParaVencimento(item.lancamento.vencimento)
  const isLate = dias < 0
  const isCritical = dias < -5
  const isManual = item.cliente?.cobranca_automatica === false
  // Venceu ou vence hoje, sem envio registrado (cobrança manual não conta: não tem envio automático)
  const semEnvio = dias <= 0 && item.envios_count === 0 && !isManual
  const origens = item.envios_origens as string[]
  const qtdManual = origens.filter((o) => o === 'manual').length
  const qtdAuto = origens.length - qtdManual

  return (
    <div
      onClick={onViewDetail}
      className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all group
        ${semEnvio ? 'border-red-400 ring-1 ring-red-200 bg-red-50/40' : isCritical ? 'border-red-300 bg-red-50/30' : isLate ? 'border-orange-200' : isManual ? 'border-amber-200 bg-amber-50/20' : 'border-brand-100/50'}
      `}
    >
      {/* Date + Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar size={12} />
          <span className={`font-medium ${isLate ? 'text-red-600' : ''}`}>
            {formatDate(item.lancamento.vencimento)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {semEnvio && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
              <BellOff size={9} /> Sem envio
            </span>
          )}
          {isManual && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
              <Wallet size={9} /> Manual
            </span>
          )}
          {isCritical && (
            <AlertOctagon size={14} className="text-red-500 animate-pulse" />
          )}
        </div>
      </div>

      {/* Company name */}
      <h4 className="text-sm font-semibold text-brand-950 truncate group-hover:text-brand-700 transition-colors">
        {item.cliente?.descricao || '—'}
      </h4>

      {/* Contact */}
      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
        <User size={11} />
        <span className="truncate">{item.cliente?.contato || '—'}</span>
      </div>

      {/* Value + Payment method */}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-brand-100/30">
        <div className="flex items-center gap-1.5">
          <CreditCard size={12} className="text-brand-400" />
          <span className="text-xs text-gray-500">{item.lancamento.forma_pgt || '—'}</span>
        </div>
        <span className="text-sm font-bold text-brand-700">{formatCurrency(item.lancamento.valor)}</span>
      </div>

      {/* Canal */}
      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400">
        <Send size={11} />
        <span>{item.lancamento.canais || '—'}</span>
      </div>

      {/* Envios info */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-100/30">
        <div className="flex items-center gap-1.5 text-xs">
          <Send size={11} className="text-gray-400" />
          {item.envios_count > 0 ? (
            <div className="flex items-center gap-1">
              {qtdAuto > 0 && (
                <span title={`${qtdAuto} automático${qtdAuto > 1 ? 's' : ''}`} className="min-w-[20px] h-5 px-1 inline-flex items-center justify-center rounded bg-blue-100 text-blue-700 border border-blue-300 text-[11px] font-bold">
                  {qtdAuto}
                </span>
              )}
              {qtdManual > 0 && (
                <span title={`${qtdManual} manua${qtdManual > 1 ? 'is' : 'l'}`} className="min-w-[20px] h-5 px-1 inline-flex items-center justify-center rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                  {qtdManual}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">Sem envios</span>
          )}
        </div>
        {item.ultimo_envio && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={10} />
            <span>{formatDateShort(item.ultimo_envio)}</span>
          </div>
        )}
      </div>

    </div>
  )
}
