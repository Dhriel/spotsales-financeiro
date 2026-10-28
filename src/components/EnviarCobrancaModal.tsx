import { useMemo, useState } from 'react'
import { X, Send, Loader2, CheckCircle2, XCircle, MessageCircle, Mail, FileText, Receipt, Calendar, AlertTriangle } from 'lucide-react'
import { TEMPLATES, preencher, enviarCobranca, type Canal } from '../lib/envioManual'
import { diasParaVencimento, formatCurrency, formatDate } from '../lib/utils'
import type { Cliente, LancamentoMensal } from '../types'

// Template sugerido conforme a situação da cobrança.
function templatePadrao(vencimento: string): string {
  const dias = diasParaVencimento(vencimento)
  if (dias >= 1) return 'cobranca_antecipada'
  if (dias === 0) return 'vencehoje_pix'
  if (dias === -1) return 'atraso_1dia'
  if (dias === -2) return 'atraso_2dia'
  if (dias === -3) return 'atraso_3dia'
  if (dias === -4) return 'atraso_4dia'
  return 'suspenso'
}

function canalPadrao(cliente: Cliente): Canal {
  const temWhats = !!cliente.whatsapp?.trim()
  const temEmail = !!cliente.email?.trim()
  const canais = (cliente.canais || '').toLowerCase()
  if (temWhats && (canais.includes('whatsapp') || !temEmail)) return 'whatsapp'
  if (temEmail) return 'email'
  return 'whatsapp'
}

interface Props {
  cliente: Cliente
  lancamento: LancamentoMensal
  onClose: () => void
  onEnviado: () => void
}

export default function EnviarCobrancaModal({ cliente, lancamento, onClose, onEnviado }: Props) {
  const [templateId, setTemplateId] = useState(() => templatePadrao(lancamento.vencimento))
  const [canal, setCanal] = useState<Canal>(() => canalPadrao(cliente))
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]
  const mensagem = useMemo(() => preencher(template.texto, template, cliente, lancamento), [template, cliente, lancamento])
  const mensagemHtml = useMemo(() => preencher(template.html, template, cliente, lancamento, true), [template, cliente, lancamento])

  const semWhatsapp = !cliente.whatsapp?.trim()
  const semEmail = !cliente.email?.trim()
  const canalIndisponivel = canal === 'whatsapp' ? semWhatsapp : semEmail
  const enviado = resultado?.type === 'success'

  const dotColor =
    lancamento.status_pagamento === 'pago' ? 'bg-emerald-500' :
    lancamento.status_pagamento === 'pendente' ? 'bg-amber-400' :
    lancamento.status_pagamento === 'atrasado' ? 'bg-red-500' : 'bg-gray-400'

  const handleEnviar = async () => {
    setResultado(null)
    setEnviando(true)
    const r = await enviarCobranca(cliente, lancamento, template, canal)
    setEnviando(false)
    if (!r.ok) {
      setResultado({ type: 'error', text: r.erro || 'Falha no envio.' })
      return
    }
    if (r.registroErro) {
      setResultado({ type: 'error', text: `Envio disparado, mas não foi registrado no lançamento: ${r.registroErro}` })
    } else {
      setResultado({ type: 'success', text: 'Envio disparado e registrado no lançamento!' })
    }
    onEnviado()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-5xl my-auto flex flex-col gap-5 font-body" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 sm:px-6 py-4 rounded-2xl border border-brand-100/50 shadow-lg">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
              {(cliente.descricao || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-brand-950 tracking-tight truncate">{cliente.descricao}</h2>
              <p className="text-sm text-gray-500">Disparar template de cobrança</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {resultado && (
              <div className={`flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl ${resultado.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {resultado.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span className="max-w-[22rem]">{resultado.text}</span>
              </div>
            )}
            {!enviado && (
              <button
                onClick={handleEnviar}
                disabled={enviando || !mensagem.trim() || canalIndisponivel}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 bg-gradient-to-r from-brand-600 to-brand-800"
              >
                {enviando ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <><Send size={16} /> Enviar</>}
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Coluna esquerda */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Template */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-brand-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-50" />
              <h3 className="text-lg font-bold text-brand-700 mb-4 flex items-center">
                <FileText className="mr-2 w-5 h-5" /> Template
              </h3>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTemplateId(t.id); setResultado(null) }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      templateId === t.id
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensagem */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-brand-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-50" />
              <h3 className="text-lg font-bold text-emerald-700 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  {canal === 'email' ? <Mail className="mr-2 w-5 h-5" /> : <MessageCircle className="mr-2 w-5 h-5" />}
                  {canal === 'email' ? 'E-mail' : 'Mensagem'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gray-100 text-gray-500">Prévia</span>
              </h3>
              {canal === 'email' ? (
                <>
                  <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mr-2">Assunto</span>
                    {template.assunto}
                  </div>
                  <iframe
                    title="Prévia do e-mail"
                    srcDoc={`<body style="margin:16px;font-family:Arial,sans-serif;font-size:14px;color:#222">${mensagemHtml}</body>`}
                    sandbox=""
                    className="w-full h-72 rounded-xl border border-gray-200 bg-white"
                  />
                </>
              ) : (
                <div className="w-full min-h-[11rem] rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words select-text">
                  {mensagem}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                {canal === 'email'
                  ? <>Mesmo texto do WhatsApp em HTML. Onde aparece <code>{'{link}'}</code> o n8n coloca o link de pagamento no disparo</>
                  : <>Template aprovado do WhatsApp — o texto não é editável · o link de pagamento é gerado no disparo</>}
              </p>
            </div>
          </div>

          {/* Coluna direita */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-brand-100/50 shadow-sm">
              <h3 className="text-md font-bold text-brand-800 mb-5 flex items-center">
                <Receipt className="mr-2 w-5 h-5 text-brand-600" /> Envio
              </h3>

              <div className="space-y-5">
                {/* Cobrança */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt size={11} className="text-brand-500" /> Cobrança
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{formatCurrency(lancamento.valor)}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(lancamento.vencimento)}
                        {lancamento.forma_pgt && <span className="ml-1 opacity-60">· {lancamento.forma_pgt}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Canal */}
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Canal</label>
                  <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                    <button
                      onClick={() => { setCanal('whatsapp'); setResultado(null) }}
                      className={`flex-1 px-4 py-1.5 text-xs rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                        canal === 'whatsapp' ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      } ${semWhatsapp ? 'opacity-60' : ''}`}
                    >
                      <MessageCircle size={13} /> WhatsApp
                      {semWhatsapp && <AlertTriangle size={11} className="text-amber-500" />}
                    </button>
                    <button
                      onClick={() => { setCanal('email'); setResultado(null) }}
                      className={`flex-1 px-4 py-1.5 text-xs rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                        canal === 'email' ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      } ${semEmail ? 'opacity-60' : ''}`}
                    >
                      <Mail size={13} /> E-mail
                      {semEmail && <AlertTriangle size={11} className="text-amber-500" />}
                    </button>
                  </div>
                  {canalIndisponivel ? (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                      <span>{cliente.descricao} não tem {canal === 'whatsapp' ? 'WhatsApp' : 'e-mail'} cadastrado. Cadastre em Clientes ou escolha o outro canal.</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Para: <span className="font-semibold text-gray-700">{canal === 'whatsapp' ? cliente.whatsapp : cliente.email}</span></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
