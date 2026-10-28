import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileText, CheckCircle2, XCircle, Loader2,
  DollarSign, Search, Calendar, ArrowRight
} from 'lucide-react'
import { useClientes } from '../hooks/useSupabase'

export default function AsaasCobranca() {
  const { clientes } = useClientes()
  const [searchParams] = useSearchParams()
  const clienteIdParam = searchParams.get('cliente_id')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const dateInputRef = useRef<HTMLInputElement>(null)
  const [chargeForm, setChargeForm] = useState({
    cliente_id: '', 
    valor: '', 
    forma_pgt: 'BOLETO', 
    tipo: 'assinatura', 
    data_vencimento: '', 
    observacao: '',
  })

  const handleClienteChange = (clienteId: string) => {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === parseInt(clienteId))
      
      const raw = cliente?.forma_de_pgt?.toUpperCase() || ''
      const formaAutomatica = raw.includes('PIX') ? 'PIX' : raw.includes('CARTAO') || raw.includes('CARTÃO') ? 'CREDIT_CARD' : 'BOLETO'
      
      let defaultDate = ''
      if (cliente?.dia_vencimento) {
        const now = new Date()
        let year = now.getFullYear()
        let month = now.getMonth()
        let day = cliente.dia_vencimento

        if (now.getDate() > day) {
          month++
          if (month > 11) {
            month = 0
            year++
          }
        }
        
        const maxDay = new Date(year, month + 1, 0).getDate()
        if (day > maxDay) day = maxDay

        defaultDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }

      setChargeForm(prev => ({
        ...prev,
        cliente_id: clienteId,
        forma_pgt: formaAutomatica,
        data_vencimento: defaultDate || prev.data_vencimento
      }))
    } else {
      setChargeForm(prev => ({ ...prev, cliente_id: clienteId, forma_pgt: 'BOLETO' }))
    }
  }

  // Pré-seleciona o cliente quando chega de "Criar cobrança" na tela de edição
  const prefillFeito = useRef(false)
  useEffect(() => {
    if (prefillFeito.current || !clienteIdParam) return
    if (!clientes.some(c => c.id === parseInt(clienteIdParam))) return
    prefillFeito.current = true
    handleClienteChange(clienteIdParam)
  }, [clienteIdParam, clientes])

  const handleCreateCobranca = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chargeForm.cliente_id || !chargeForm.valor || !chargeForm.data_vencimento) {
      setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios' })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/create-asaas-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: parseInt(chargeForm.cliente_id),
          valor: parseFloat(chargeForm.valor),
          forma_pgt: chargeForm.forma_pgt,
          tipo: chargeForm.tipo,
          data_vencimento: chargeForm.data_vencimento,
          description: chargeForm.observacao || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Cobrança criada com sucesso!' })
        setChargeForm({ cliente_id: '', valor: '', forma_pgt: 'BOLETO', tipo: 'assinatura', data_vencimento: '', observacao: '' })
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao criar cobrança' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-6 pt-2">
      
      {/* Page Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-brand-950 dark:text-on-surface tracking-tight">Criar Cobrança</h1>
        </div>
      </div>

      {message && (
        <div className={`mb-8 px-5 py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-sm animate-fade-in-up ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleCreateCobranca} className="flex flex-col gap-6 animate-fade-in-up [animation-delay:100ms]">
        
        {/* Main Form Container */}
        <div className="bg-white dark:bg-[#060e20] border border-brand-100/50 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-5">
            
            {/* Cliente Select */}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-on-surface-variant mb-2 uppercase tracking-wide">Cliente <span className="text-red-500">*</span></label>
              <div className="relative group">
                <select 
                  value={chargeForm.cliente_id}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-white/5 rounded-xl py-3 pl-4 pr-10 appearance-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all text-sm font-medium text-gray-900 dark:text-on-surface hover:bg-white dark:hover:bg-[#0b1326]"
                >
                  <option value="">Selecione um cliente ou pesquise...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.descricao}</option>
                  ))}
                </select>
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Valor */}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-on-surface-variant mb-2 uppercase tracking-wide">Valor (R$) <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">R$</span>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={chargeForm.valor}
                  onChange={(e) => setChargeForm({ ...chargeForm, valor: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all font-headline font-bold text-lg text-gray-900 dark:text-on-surface hover:bg-white dark:hover:bg-[#0b1326] placeholder:text-gray-400 placeholder:font-medium"
                  placeholder="0.00" 
                />
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-on-surface-variant mb-2 uppercase tracking-wide">Forma de Pag. <span className="text-red-500">*</span></label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'BOLETO', label: 'Boleto' },
                  { id: 'PIX', label: 'PIX' },
                  { id: 'CREDIT_CARD', label: 'Cartão' }
                ].map((opt) => (
                  <label 
                    key={opt.id}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      chargeForm.forma_pgt === opt.id
                        ? 'border-brand-400 bg-brand-50 dark:bg-primary-container dark:border-primary text-brand-700 dark:text-on-primary-container'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-surface-container-highest text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="forma_pgt"
                        value={opt.id}
                        checked={chargeForm.forma_pgt === opt.id}
                        onChange={(e) => setChargeForm({ ...chargeForm, forma_pgt: e.target.value })}
                        className="sr-only" 
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        chargeForm.forma_pgt === opt.id 
                          ? 'border-brand-600 dark:border-primary' 
                          : 'border-gray-300 dark:border-gray-500'
                      }`}>
                        {chargeForm.forma_pgt === opt.id && (
                          <div className="w-2 h-2 rounded-full bg-brand-600 dark:bg-primary" />
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-sm tracking-wide">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tipo de Cobrança */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-on-surface-variant mb-2 uppercase tracking-wide">Tipo <span className="text-red-500">*</span></label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'assinatura', label: 'Assinatura' },
                  { id: 'cobranca', label: 'Cobrança' }
                ].map((opt) => (
                  <label 
                    key={opt.id}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                      chargeForm.tipo === opt.id
                        ? 'border-brand-400 bg-brand-50 dark:bg-primary-container dark:border-primary text-brand-700 dark:text-on-primary-container'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-surface-container-highest text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="tipo"
                        value={opt.id}
                        checked={chargeForm.tipo === opt.id}
                        onChange={(e) => setChargeForm({ ...chargeForm, tipo: e.target.value })}
                        className="sr-only" 
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        chargeForm.tipo === opt.id 
                          ? 'border-brand-600 dark:border-primary' 
                          : 'border-gray-300 dark:border-gray-500'
                      }`}>
                        {chargeForm.tipo === opt.id && (
                          <div className="w-2 h-2 rounded-full bg-brand-600 dark:bg-primary" />
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-sm tracking-wide">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Data de Vencimento */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-on-surface-variant mb-2 uppercase tracking-wide">Data de Vencimento <span className="text-red-500">*</span></label>
              <div 
                className="relative cursor-pointer"
                onClick={() => dateInputRef.current?.showPicker()}
              >
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input 
                  ref={dateInputRef}
                  type="date"
                  value={chargeForm.data_vencimento}
                  onChange={(e) => setChargeForm({ ...chargeForm, data_vencimento: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all text-sm font-medium text-gray-900 dark:text-on-surface hover:bg-white dark:hover:bg-[#0b1326] cursor-pointer"
                />
              </div>
            </div>

            {/* Observação */}
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-500 dark:text-on-surface-variant mb-2 uppercase tracking-wide">Observação (Opcional)</label>
              <textarea 
                value={chargeForm.observacao}
                onChange={(e) => setChargeForm({ ...chargeForm, observacao: e.target.value })}
                className="w-full bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-white/5 rounded-xl py-3 px-5 focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition-all resize-y text-sm font-medium text-gray-900 dark:text-on-surface hover:bg-white dark:hover:bg-[#0b1326] placeholder:text-gray-400"
                placeholder="Detalhes adicionais da cobrança..." 
                rows={7}
              />
            </div>

          </div>
        </div>

        {/* Action Button Centered */}
        <div className="flex justify-center mt-6 animate-fade-in-up [animation-delay:300ms]">
          <button 
            type="submit"
            disabled={loading}
            className="w-full max-w-sm h-12 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-primary dark:to-primary-container text-white font-headline font-extrabold rounded-xl shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Processando...</>
            ) : (
              <>{chargeForm.tipo === 'assinatura' ? 'Criar Assinatura' : 'Criar Cobrança'} <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </form>
      
    </div>
  )
}
