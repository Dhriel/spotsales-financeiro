import { useState } from 'react'
import { X, User, Phone, Mail, FileText, Calendar, Send, CreditCard, DollarSign, Loader2, Wallet } from 'lucide-react'
import { useClienteDetail } from '../hooks/useSupabase'
import { formatCurrency, formatDate, statusPagamentoConfig, statusEnvioConfig } from '../lib/utils'
import { StatusPagamentoBadge, StatusEnvioBadge } from './StatusBadge'
import { supabase } from '../lib/supabase'
import EnviarCobrancaModal from './EnviarCobrancaModal'

const SUPABASE_URL = 'https://eohugjtnhmcnedqzzpyy.supabase.co'

interface Props {
  clienteId: number | null
  onClose: () => void
}

export default function ClienteDetailModal({ clienteId, onClose }: Props) {
  const { cliente, lancamentos, envios, loading, refetch } = useClienteDetail(clienteId)
  const [baixaLoading, setBaixaLoading] = useState<number | null>(null)
  const [baixaMsg, setBaixaMsg] = useState<{ id: number; type: 'success' | 'error'; text: string } | null>(null)
  const [confirmBaixa, setConfirmBaixa] = useState<any | null>(null)
  const [enviarLanc, setEnviarLanc] = useState<any | null>(null)
  const [notificarBaixa, setNotificarBaixa] = useState(true)

  const openConfirmBaixa = (lancamento: any) => {
    setNotificarBaixa(lancamento.notificar_baixa !== false)
    setConfirmBaixa(lancamento)
  }

  const handleDarBaixa = async (lancamento: any, notificar: boolean) => {
    if (!cliente) return
    setBaixaLoading(lancamento.id)
    setBaixaMsg(null)

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/asaas-baixa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lancamento_id: lancamento.id,
          cliente_id: cliente.id,
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

        setBaixaMsg({ id: lancamento.id, type: 'success', text: data.message })
        refetch()
      } else {
        setBaixaMsg({ id: lancamento.id, type: 'error', text: data.error || 'Erro desconhecido' })
      }
    } catch (err) {
      setBaixaMsg({ id: lancamento.id, type: 'error', text: 'Erro de conexão' })
    } finally {
      setBaixaLoading(null)
      setConfirmBaixa(null)
    }
  }

  if (!clienteId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl mx-2 sm:mx-4 bg-white rounded-2xl shadow-2xl border border-brand-100/50 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-100/50" style={{ background: 'linear-gradient(135deg, #7C3AED08, #5B21B608)' }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-brand-950">
                {loading ? 'Carregando...' : cliente?.descricao}
              </h2>
              {!loading && cliente?.ativo === false && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                  Desativado
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Detalhes do cliente</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-brand-100/50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
          </div>
        ) : cliente ? (
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Info cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <InfoCard icon={User} label="Contato" value={cliente.contato || '—'} />
              <InfoCard icon={Phone} label="WhatsApp" value={cliente.whatsapp || '—'} />
              <InfoCard icon={Mail} label="Email" value={cliente.email || '—'} />
              <InfoCard icon={FileText} label="CNPJ/CPF" value={cliente.cnpj_cpf || '—'} />
              <InfoCard icon={Calendar} label="Dia Vencimento" value={`Dia ${cliente.dia_vencimento}`} />
              <InfoCard icon={Wallet} label="Forma de Pagamento" value={cliente.forma_de_pgt || '—'} />
              <InfoCard icon={FileText} label="Envia NF" value={cliente.envia_nf ? 'Sim' : 'Não'} />
              <InfoCard
                icon={DollarSign}
                label="Cobrança"
                value={cliente.cobranca_automatica === false ? 'Manual (paga direto)' : 'Automática (Asaas)'}
                accent={cliente.cobranca_automatica === false ? 'amber' : undefined}
              />
            </div>

            {/* Lancamentos */}
            <div>
              <h3 className="text-base font-semibold text-brand-950 mb-3 flex items-center gap-2">
                <CreditCard size={18} className="text-brand-600" />
                Lançamentos Mensais
              </h3>
              {lancamentos.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center bg-brand-50/50 rounded-lg">Nenhum lançamento encontrado</p>
              ) : (
                <div className="space-y-3">
                  {lancamentos.map((l) => (
                    <div key={l.id} className="bg-brand-50/30 rounded-xl border border-brand-100/50 overflow-hidden">
                      {/* Lancamento header */}
                      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                          <div>
                            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Vencimento</p>
                            <p className="text-xs sm:text-sm font-semibold text-brand-950">{formatDate(l.vencimento)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Valor</p>
                            <p className="text-xs sm:text-sm font-bold text-brand-700">{formatCurrency(l.valor)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Forma</p>
                            <p className="text-xs sm:text-sm text-gray-700">{l.forma_pgt || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Canal</p>
                            <p className="text-xs sm:text-sm text-gray-700">{l.canais || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPagamentoBadge status={l.status_pagamento} />
                          {l.data_pagamento && (
                            <span className="text-xs text-gray-500">Pago em {formatDate(l.data_pagamento)}</span>
                          )}
                          {l.status_pagamento !== 'pago' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openConfirmBaixa(l) }}
                              disabled={baixaLoading === l.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {baixaLoading === l.id ? (
                                <><Loader2 size={12} className="animate-spin" /> Processando...</>
                              ) : (
                                <><DollarSign size={12} /> Dar Baixa</>
                              )}
                            </button>
                          )}
                          {l.status_pagamento !== 'pago' && l.status_pagamento !== 'cancelado' && cliente && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEnviarLanc(l) }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 transition-colors"
                            >
                              <Send size={12} /> Enviar cobrança
                            </button>
                          )}
                          {baixaMsg && baixaMsg.id === l.id && (
                            <span className={`text-xs font-medium ${baixaMsg.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                              {baixaMsg.text}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Envios */}
                      {envios[l.id] && envios[l.id].length > 0 && (
                        <div className="border-t border-brand-100/50 px-4 py-3 bg-white/50">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Send size={12} />
                            Envios ({envios[l.id].length})
                          </p>
                          <div className="space-y-1.5">
                            {envios[l.id].map((e) => (
                              <div
                                key={e.id}
                                className={`flex items-center gap-3 text-xs py-1 ${e.origem === 'manual' ? 'bg-amber-50 border border-amber-200 rounded-md px-2 -mx-2' : ''}`}
                              >
                                <span className="text-gray-500 font-medium w-20">{formatDate(e.data_envio)}</span>
                                <StatusEnvioBadge status={e.status_envio} origem={e.origem} />
                                <span className="text-gray-500">{e.canal_envio}</span>
                                {e.observacao && <span className="text-gray-400 italic truncate max-w-[200px]">{e.observacao}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Cliente não encontrado
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      {confirmBaixa && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pt-8 pb-8 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setConfirmBaixa(null); setNotificarBaixa(true) }} />
          <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl border border-brand-100/50 z-10">
            <div className="p-6 border-b border-brand-100/50">
              <h2 className="text-lg font-bold text-brand-950">Confirmar Dar Baixa</h2>
              <p className="text-sm text-gray-500 mt-1">Tem certeza que deseja confirmar o pagamento?</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-brand-50/50 rounded-lg p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Cliente</p>
                <p className="font-semibold text-brand-950">{cliente?.descricao}</p>
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
                      notificarBaixa
                        ? 'bg-brand-100 text-brand-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setNotificarBaixa(false)}
                    className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                      !notificarBaixa
                        ? 'bg-red-50 text-red-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
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
                onClick={() => { handleDarBaixa(confirmBaixa, notificarBaixa); setConfirmBaixa(null); setNotificarBaixa(true) }}
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

      {enviarLanc && cliente && (
        <EnviarCobrancaModal
          cliente={cliente}
          lancamento={enviarLanc}
          onClose={() => setEnviarLanc(null)}
          onEnviado={refetch}
        />
      )}
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: 'amber' }) {
  const isAmber = accent === 'amber'
  return (
    <div className={`rounded-lg border p-3 shadow-sm ${isAmber ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-brand-100/50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={isAmber ? 'text-amber-600' : 'text-brand-500'} />
        <span className={`text-[11px] font-medium uppercase tracking-wider ${isAmber ? 'text-amber-700' : 'text-gray-500'}`}>{label}</span>
      </div>
      <p className={`text-sm font-semibold truncate ${isAmber ? 'text-amber-900' : 'text-brand-950'}`}>{value}</p>
    </div>
  )
}
