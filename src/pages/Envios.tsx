import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Send, Search, X, Loader2, CheckCircle2, XCircle, AlertTriangle,
  MessageCircle, Mail, FileText, Receipt, Megaphone, ChevronRight,
  ChevronDown, Calendar, Check
} from 'lucide-react'
import { useClientes, useClienteDetail } from '../hooks/useSupabase'
import { formatCurrency, formatDate } from '../lib/utils'
import { TEMPLATES, preencher, valoresDasVars, enviarCobranca, type Canal } from '../lib/envioManual'


export default function Envios() {
  const { clientes, loading } = useClientes()
  const [busca, setBusca] = useState('')
  const [clienteId, setClienteId] = useState<number | null>(null)

  const { cliente, lancamentos, loading: loadingCliente } = useClienteDetail(clienteId)

  const [cobrancaId, setCobrancaId] = useState<number | null>(null)
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id)
  const [canal, setCanal] = useState<Canal>('whatsapp')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const lista = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return clientes
      .filter((c) => !termo || (c.descricao || '').toLowerCase().includes(termo))
      .sort((a, b) => {
        const ai = a.ativo === false ? 1 : 0
        const bi = b.ativo === false ? 1 : 0
        if (ai !== bi) return ai - bi
        return (a.descricao || '').localeCompare(b.descricao || '')
      })
  }, [clientes, busca])

  // Ao trocar de cliente, escolhe a cobrança mais relevante (não paga mais recente, senão a mais recente).
  useEffect(() => {
    if (lancamentos.length === 0) {
      setCobrancaId(null)
      return
    }
    const aberta = lancamentos.find(
      (l) => l.status_pagamento !== 'pago' && l.status_pagamento !== 'cancelado'
    )
    setCobrancaId((aberta || lancamentos[0]).id)
  }, [lancamentos])

  const cobranca = useMemo(
    () => lancamentos.find((l) => l.id === cobrancaId) || null,
    [lancamentos, cobrancaId]
  )

  const [cobDropdownOpen, setCobDropdownOpen] = useState(false)
  const cobDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cobDropdownRef.current && !cobDropdownRef.current.contains(e.target as Node)) {
        setCobDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]

  // Prévia do template aprovado do WhatsApp — somente leitura, não é editável.
  const mensagem = useMemo(
    () => (cliente ? preencher(template.texto, template, cliente, cobranca) : ''),
    [template, cliente, cobranca]
  )

  // Versão HTML para e-mail. O {link} permanece literal para o n8n substituir.
  const mensagemHtml = useMemo(
    () => (cliente ? preencher(template.html, template, cliente, cobranca, true) : ''),
    [template, cliente, cobranca]
  )

  // Limpa o resultado do envio anterior ao trocar de template/cobrança/cliente
  useEffect(() => {
    setResultado(null)
  }, [cobrancaId, templateId, cliente?.id])

  const destinatario = canal === 'whatsapp' ? cliente?.whatsapp : cliente?.email
  const semWhatsapp = !cliente?.whatsapp?.trim()
  const semEmail = !cliente?.email?.trim()
  const canalIndisponivel = canal === 'whatsapp' ? semWhatsapp : semEmail

  const handleEnviar = async () => {
    if (!cliente) return
    setResultado(null)
    setEnviando(true)
    const r = await enviarCobranca(cliente, cobranca, template, canal)
    setEnviando(false)
    if (!r.ok) {
      setResultado({ type: 'error', text: r.erro || 'Falha no envio.' })
    } else if (r.registroErro) {
      setResultado({ type: 'error', text: `Envio disparado, mas não foi registrado no lançamento: ${r.registroErro}` })
    } else {
      setResultado({ type: 'success', text: cobranca ? 'Envio disparado e registrado no lançamento!' : 'Envio disparado!' })
      setTimeout(() => setResultado(null), 4000)
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] font-body">
      {/* Lista lateral */}
      <div className="w-80 shrink-0 flex flex-col bg-white dark:bg-[#060e20] rounded-2xl border border-brand-100/50 dark:border-white/5 shadow-sm overflow-hidden transition-colors animate-fade-in-right">
        {/* Header / filtros / busca */}
        <div className="p-4 border-b border-brand-100/50 dark:border-white/5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-outline-variant uppercase tracking-wider">Empresas</p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-outline/50 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar empresa..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 dark:border-none dark:bg-[#0b1326] text-sm text-gray-900 dark:text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary/50 transition-all placeholder:text-gray-400 dark:placeholder:text-outline/50"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-outline hover:text-gray-600 dark:hover:text-on-surface">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-700 dark:border-primary border-t-transparent" />
            </div>
          ) : lista.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400 dark:text-outline-variant">Nenhuma empresa encontrada</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {lista.map((c) => {
                const isInativo = c.ativo === false
                return (
                  <button
                    key={c.id}
                    onClick={() => setClienteId(c.id)}
                    className={`w-full text-left pl-4 pr-3 py-3 flex items-center justify-between gap-3 transition-all group ${
                      clienteId === c.id
                        ? 'bg-brand-50 dark:bg-surface-container-highest border-r-4 border-brand-400 dark:border-primary'
                        : 'hover:bg-gray-50 dark:hover:bg-[#0b1326] border-r-4 border-transparent'
                    } ${isInativo ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-brand-100 text-brand-700 dark:bg-surface-container-high dark:text-on-surface-variant">
                        {(c.descricao || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-gray-800 dark:text-on-surface flex items-center gap-1.5">
                          {c.descricao}
                          {isInativo && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 uppercase tracking-wider">Inativo</span>
                          )}
                        </p>
                        {(c.whatsapp || c.contato) && (
                          <p className="text-xs text-gray-400 dark:text-outline-variant truncate">{c.whatsapp || c.contato}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-gray-300 dark:text-outline-variant group-hover:text-gray-400 dark:group-hover:text-on-surface transition-colors" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-brand-100/50 dark:border-white/5">
          <p className="text-xs text-center text-gray-400 dark:text-outline-variant">{lista.length} empresa(s)</p>
        </div>
      </div>

      {/* Painel de composição */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {!clienteId ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-[#060e20] flex items-center justify-center mb-4 border border-transparent dark:border-white/5">
              <Megaphone size={28} className="text-brand-300 dark:text-outline-variant" />
            </div>
            <p className="text-base font-semibold text-gray-400 dark:text-outline-variant">Selecione uma empresa</p>
            <p className="text-sm text-gray-300 dark:text-outline/40 mt-1">Clique numa empresa para montar e disparar o envio</p>
          </div>
        ) : loadingCliente ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 dark:border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 h-full font-body">
            {/* Header Bar */}
            <div className="opacity-0 animate-fade-in-up [animation-delay:50ms] flex items-center justify-between bg-white dark:bg-[#060e20] px-6 py-5 rounded-2xl border border-brand-100/50 dark:border-white/5 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-600 dark:bg-primary-container text-white dark:text-on-primary-container flex items-center justify-center font-bold text-xl shadow-inner">
                  {(cliente?.descricao || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold font-headline text-brand-950 dark:text-on-surface tracking-tight">{cliente?.descricao}</h2>
                  <p className="text-sm text-gray-500 dark:text-outline-variant">Disparar template de cobrança</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {resultado && (
                  <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                    resultado.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {resultado.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {resultado.text}
                  </div>
                )}
                <button
                  onClick={handleEnviar}
                  disabled={enviando || !mensagem.trim() || canalIndisponivel}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-primary dark:to-primary-container dark:text-on-primary"
                >
                  {enviando ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <><Send size={16} /> Enviar</>}
                </button>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
              {/* Coluna esquerda */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Template */}
                <div className="opacity-0 animate-fade-in-up [animation-delay:150ms] bg-white dark:bg-surface-container-low rounded-2xl p-6 md:p-8 border border-brand-100/50 dark:border-white/5 dark:glass-panel shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-500">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 dark:bg-primary-container opacity-50 transition-all duration-500 ease-out group-hover:w-1.5"></div>
                  <h3 className="text-lg font-bold font-headline text-brand-700 dark:text-primary mb-5 flex items-center">
                    <FileText className="mr-2 w-5 h-5" /> Template
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTemplateId(t.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          templateId === t.id
                            ? 'bg-brand-600 text-white border-brand-600 dark:bg-primary dark:text-on-primary dark:border-primary shadow-sm'
                            : 'bg-gray-50 dark:bg-surface-container-highest text-gray-600 dark:text-on-surface-variant border-gray-200 dark:border-none hover:border-brand-300 dark:hover:bg-white/5'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensagem */}
                <div className="opacity-0 animate-fade-in-up [animation-delay:250ms] bg-white dark:bg-surface-container-low rounded-2xl p-6 md:p-8 border border-brand-100/50 dark:border-white/5 dark:glass-panel shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-500">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 dark:bg-secondary opacity-50 transition-all duration-500 ease-out group-hover:w-1.5 focus-within:w-1.5"></div>
                  <h3 className="text-lg font-bold font-headline text-emerald-700 dark:text-secondary mb-5 flex items-center justify-between">
                    <span className="flex items-center">
                      {canal === 'email' ? <Mail className="mr-2 w-5 h-5" /> : <MessageCircle className="mr-2 w-5 h-5" />}
                      {canal === 'email' ? 'E-mail' : 'Mensagem'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-surface-container-highest dark:text-outline-variant">
                      Prévia
                    </span>
                  </h3>
                  {canal === 'email' ? (
                    <>
                      <div className="mb-3 rounded-xl border border-gray-200 dark:border-none bg-gray-50 dark:bg-surface-container-highest px-4 py-2.5 text-sm text-gray-900 dark:text-on-surface">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-outline-variant mr-2">Assunto</span>
                        {template.assunto}
                      </div>
                      <iframe
                        title="Prévia do e-mail"
                        srcDoc={`<body style="margin:16px;font-family:Arial,sans-serif;font-size:14px;color:#222">${mensagemHtml}</body>`}
                        sandbox=""
                        className="w-full h-[30rem] rounded-xl border border-gray-200 dark:border-none bg-white"
                      />
                      <p className="text-[11px] text-gray-400 dark:text-outline-variant mt-2">
                        Mesmo texto do WhatsApp em HTML — o texto não é editável. Onde aparece <code>{'{link}'}</code> o n8n coloca o link de pagamento no disparo
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-full min-h-[13rem] rounded-xl border border-gray-200 dark:border-none bg-gray-50 dark:bg-surface-container-highest p-4 text-sm text-gray-900 dark:text-on-surface leading-relaxed whitespace-pre-wrap break-words select-text">
                        {mensagem}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-outline-variant mt-2">
                        Template aprovado do WhatsApp — o texto não é editável. Preenchido com: {template.vars.join(', ')} · o link de pagamento é gerado no disparo
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Coluna direita */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="opacity-0 animate-fade-in-up [animation-delay:350ms] bg-brand-50/30 dark:bg-surface-container-high rounded-2xl p-6 md:p-8 border border-brand-100/50 dark:border-white/5 dark:glass-panel shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-500">
                  <h3 className="text-md font-bold font-headline text-brand-800 dark:text-on-surface mb-6 flex items-center">
                    <Receipt className="mr-2 w-5 h-5 text-brand-600 dark:text-primary" /> Envio
                  </h3>

                  <div className="space-y-6">
                    {/* Destinatário */}
                    <div className="rounded-xl bg-white dark:bg-surface-container-highest border border-gray-100 dark:border-none p-4">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-outline-variant font-bold mb-1">Destinatário</p>
                      <div className="space-y-1 text-xs text-gray-600 dark:text-on-surface-variant">
                        <span className={`flex items-center gap-1.5 ${semWhatsapp ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                          <MessageCircle size={12} className={semWhatsapp ? 'text-amber-500' : 'text-gray-400'} />
                          {cliente?.whatsapp || 'Sem WhatsApp cadastrado'}
                        </span>
                        <span className={`flex items-center gap-1.5 ${semEmail ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                          <Mail size={12} className={semEmail ? 'text-amber-500' : 'text-gray-400'} />
                          {cliente?.email || 'Sem e-mail cadastrado'}
                        </span>
                      </div>
                    </div>

                    {/* Cobrança */}
                    <div className="flex flex-col space-y-2">
                      <label className="font-label text-xs font-bold text-gray-600 dark:text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt size={11} className="text-brand-500 dark:text-primary" />
                        Cobrança
                      </label>
                      {lancamentos.length === 0 ? (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          Sem cobrança para este cliente. Valor/vencimento ficarão em branco.
                        </div>
                      ) : (
                        <div ref={cobDropdownRef} className="relative">
                          {/* Trigger */}
                          <button
                            type="button"
                            onClick={() => setCobDropdownOpen((v) => !v)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                              cobDropdownOpen
                                ? 'border-brand-400 dark:border-primary ring-2 ring-brand-500/20 dark:ring-primary/20 bg-white dark:bg-surface-container-highest'
                                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-surface-container-highest hover:border-brand-300 dark:hover:border-primary/40'
                            }`}
                          >
                            {cobranca ? (
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  cobranca.status_pagamento === 'pago' ? 'bg-emerald-500' :
                                  cobranca.status_pagamento === 'pendente' ? 'bg-amber-400' :
                                  cobranca.status_pagamento === 'atrasado' ? 'bg-red-500' : 'bg-gray-400'
                                }`} />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-900 dark:text-on-surface truncate">
                                    {formatCurrency(cobranca.valor)}
                                  </p>
                                  <p className="text-[11px] text-gray-400 dark:text-outline-variant flex items-center gap-1">
                                    <Calendar size={10} />
                                    {formatDate(cobranca.vencimento)}
                                    {cobranca.forma_pgt && <span className="ml-1 opacity-60">· {cobranca.forma_pgt}</span>}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-outline-variant">Selecionar...</span>
                            )}
                            <ChevronDown
                              size={15}
                              className={`shrink-0 text-gray-400 dark:text-outline-variant transition-transform duration-200 ${cobDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {/* Dropdown panel */}
                          {cobDropdownOpen && (
                            <div className="absolute z-20 mt-1.5 w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-surface-container-highest shadow-xl dark:shadow-black/40 overflow-hidden animate-fade-in-up [animation-duration:150ms]">
                              <div className="p-1.5 space-y-0.5 max-h-52 overflow-y-auto">
                                {lancamentos.map((l) => {
                                  const isSelected = l.id === cobrancaId
                                  const dotColor =
                                    l.status_pagamento === 'pago' ? 'bg-emerald-500' :
                                    l.status_pagamento === 'pendente' ? 'bg-amber-400' :
                                    l.status_pagamento === 'atrasado' ? 'bg-red-500' : 'bg-gray-400'
                                  const statusLabel =
                                    l.status_pagamento === 'pago' ? 'Pago' :
                                    l.status_pagamento === 'pendente' ? 'Pendente' :
                                    l.status_pagamento === 'atrasado' ? 'Atrasado' : 'Cancelado'
                                  const statusClass =
                                    l.status_pagamento === 'pago' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                                    l.status_pagamento === 'pendente' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' :
                                    l.status_pagamento === 'atrasado' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' :
                                    'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50'
                                  return (
                                    <button
                                      key={l.id}
                                      type="button"
                                      onClick={() => { setCobrancaId(l.id); setCobDropdownOpen(false) }}
                                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                                        isSelected
                                          ? 'bg-brand-50 dark:bg-primary/10'
                                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                        <div className="min-w-0">
                                          <p className={`text-sm font-bold truncate ${isSelected ? 'text-brand-700 dark:text-primary' : 'text-gray-800 dark:text-on-surface'}`}>
                                            {formatCurrency(l.valor)}
                                          </p>
                                          <p className="text-[11px] text-gray-400 dark:text-outline-variant flex items-center gap-1">
                                            <Calendar size={10} />
                                            {formatDate(l.vencimento)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}>
                                          {statusLabel}
                                        </span>
                                        {isSelected && <Check size={13} className="text-brand-600 dark:text-primary" />}
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Canal */}
                    <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200 dark:border-white/5">
                      <label className="font-label text-xs font-bold text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                        Canal
                      </label>
                      <div className="flex bg-white dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-lg p-1 shadow-sm">
                        <button
                          onClick={() => setCanal('whatsapp')}
                          className={`flex-1 px-4 py-1.5 text-xs rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                            canal === 'whatsapp'
                              ? 'bg-brand-100 text-brand-700 dark:bg-primary-container dark:text-on-primary-container shadow-sm'
                              : 'text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface'
                          } ${semWhatsapp ? 'opacity-60' : ''}`}
                        >
                          <MessageCircle size={13} /> WhatsApp
                          {semWhatsapp && <AlertTriangle size={11} className="text-amber-500" />}
                        </button>
                        <button
                          onClick={() => setCanal('email')}
                          className={`flex-1 px-4 py-1.5 text-xs rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                            canal === 'email'
                              ? 'bg-brand-100 text-brand-700 dark:bg-primary-container dark:text-on-primary-container shadow-sm'
                              : 'text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface'
                          } ${semEmail ? 'opacity-60' : ''}`}
                        >
                          <Mail size={13} /> E-mail
                          {semEmail && <AlertTriangle size={11} className="text-amber-500" />}
                        </button>
                      </div>
                      {canalIndisponivel && (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          <span>
                            {cliente?.descricao} não tem {canal === 'whatsapp' ? 'WhatsApp' : 'e-mail'} cadastrado.
                            {' '}Cadastre em Clientes ou escolha o outro canal para enviar.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
