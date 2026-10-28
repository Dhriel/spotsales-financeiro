import { useState } from 'react'
import {
  CheckCircle2, XCircle, Loader2,
  Building2, Hash, Mail, Phone,
  BadgeInfo, Contact2, Wallet, ArrowRight,
  Sparkles, ShieldCheck, CreditCard
} from 'lucide-react'

export default function AsaasClientes() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [clientForm, setClientForm] = useState({
    nome: '',
    cpf_cnpj: '',
    email: '',
    contato: '',
    celular: '',
    cep: '',
    dia_vencimento: '',
    valor: '',
    forma_de_pgt: '',
    envia_nf: '',
    canais: '',
    observacoes: '',
  })

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientForm.nome) {
      setMessage({ type: 'error', text: 'Preencha o campo Empresa' })
      return
    }
    if (!clientForm.forma_de_pgt) {
      setMessage({ type: 'error', text: 'Selecione a Forma de Pagamento' })
      return
    }
    if (!clientForm.envia_nf) {
      setMessage({ type: 'error', text: 'Selecione se Envia NF' })
      return
    }
    if (!clientForm.canais) {
      setMessage({ type: 'error', text: 'Selecione o Canal de Envio' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/create-asaas-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientForm.nome,
          cpfCnpj: clientForm.cpf_cnpj || undefined,
          email: clientForm.email || undefined,
          mobilePhone: clientForm.celular || undefined,
          contato: clientForm.contato || undefined,
          postalCode: clientForm.cep || undefined,
          dia_vencimento: clientForm.dia_vencimento ? parseInt(clientForm.dia_vencimento) : undefined,
          valor: clientForm.valor ? parseFloat(clientForm.valor) : undefined,
          forma_de_pgt: clientForm.forma_de_pgt,
          envia_nf: clientForm.envia_nf === 'sim',
          canais: clientForm.canais,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Cliente criado com sucesso!' })
        setClientForm({
          nome: '', cpf_cnpj: '', email: '', contato: '', celular: '',
          cep: '', dia_vencimento: '', valor: '', forma_de_pgt: '', envia_nf: '', canais: '', observacoes: '',
        })
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao criar cliente' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl flex items-center justify-center gap-3 text-sm font-bold shadow-sm animate-fade-in-up ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
          }`}
        >
          {message.type === 'success'
            ? <CheckCircle2 size={18} className="flex-shrink-0" />
            : <XCircle size={18} className="flex-shrink-0" />
          }
          {message.text}
        </div>
      )}

      {/* Form Section */}
      <div className="bg-brand-50/50 dark:bg-surface-container-low rounded-[1.5rem] p-1 overflow-hidden shadow-sm animate-fade-in-up">
        <div className="bg-white dark:bg-[#060e20] rounded-[1.25rem] p-8 md:p-10 border border-brand-100/50 dark:border-white/5 shadow-sm">
          <div className="mb-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-primary-container flex items-center justify-center">
              <CreditCard size={20} className="text-brand-700 dark:text-on-primary-container" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-headline text-brand-950 dark:text-on-surface">Criar Cliente</h2>
              <p className="text-sm text-gray-400 dark:text-outline-variant">Preencha os dados para cadastrar</p>
            </div>
          </div>

          <form onSubmit={handleCreateCliente} className="space-y-8">
            {/* Identificação */}
            <section className="opacity-0 animate-fade-in-up [animation-delay:100ms]">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Empresa <span className="text-red-500">*</span></label>
                  <input 
                    type="text"
                    value={clientForm.nome}
                    onChange={(e) => setClientForm({ ...clientForm, nome: e.target.value })}
                    className="w-full h-12 px-4 bg-gray-50 dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary focus:bg-white dark:focus:bg-[#0b1326] transition-all text-gray-900 dark:text-on-surface font-medium text-sm placeholder:text-gray-400" 
                    placeholder="Nome Fantasia ou Razão Social"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">CPF ou CNPJ (Opcional)</label>
                  <input 
                    type="text"
                    value={clientForm.cpf_cnpj}
                    onChange={(e) => setClientForm({ ...clientForm, cpf_cnpj: e.target.value })}
                    className="w-full h-12 px-4 bg-gray-50 dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary focus:bg-white dark:focus:bg-[#0b1326] transition-all text-gray-900 dark:text-on-surface font-medium text-sm placeholder:text-gray-400" 
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </section>

            {/* Contato & Localização */}
            <section className="opacity-0 animate-fade-in-up [animation-delay:200ms]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-secondary-container flex items-center justify-center text-emerald-700 dark:text-on-secondary-container">
                  <Contact2 size={16} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-outline-variant">Contato & Localização</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Contato (Opcional)</label>
                  <input 
                    type="text"
                    value={clientForm.contato}
                    onChange={(e) => setClientForm({ ...clientForm, contato: e.target.value })}
                    className="w-full h-12 px-4 bg-gray-50 dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-emerald-500/40 dark:focus:ring-secondary focus:bg-white dark:focus:bg-[#0b1326] transition-all text-gray-900 dark:text-on-surface font-medium text-sm placeholder:text-gray-400" 
                    placeholder="Nome do Responsável"
                  />
                </div>
                <div className="flex flex-col gap-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Celular (WhatsApp) (Opcional)</label>
                  <input 
                    type="tel"
                    value={clientForm.celular}
                    onChange={(e) => setClientForm({ ...clientForm, celular: e.target.value })}
                    className="w-full h-12 px-4 bg-gray-50 dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-emerald-500/40 dark:focus:ring-secondary focus:bg-white dark:focus:bg-[#0b1326] transition-all text-gray-900 dark:text-on-surface font-medium text-sm placeholder:text-gray-400" 
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="flex flex-col gap-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Email (Opcional)</label>
                  <input 
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full h-12 px-4 bg-gray-50 dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-emerald-500/40 dark:focus:ring-secondary focus:bg-white dark:focus:bg-[#0b1326] transition-all text-gray-900 dark:text-on-surface font-medium text-sm placeholder:text-gray-400" 
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="flex flex-col gap-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">CEP (Opcional)</label>
                  <input 
                    type="text"
                    value={clientForm.cep}
                    onChange={(e) => setClientForm({ ...clientForm, cep: e.target.value })}
                    className="w-full h-12 px-4 bg-gray-50 dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-emerald-500/40 dark:focus:ring-secondary focus:bg-white dark:focus:bg-[#0b1326] transition-all text-gray-900 dark:text-on-surface font-medium text-sm placeholder:text-gray-400" 
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </section>

            {/* Configurações Financeiras */}
            <section className="opacity-0 animate-fade-in-up [animation-delay:300ms] bg-brand-50/30 dark:bg-surface-container-high/40 p-6 md:p-8 rounded-[1.25rem] border border-brand-100/50 dark:border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-primary-container flex items-center justify-center text-brand-700 dark:text-on-primary-container">
                  <Wallet size={16} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-outline-variant">Regras Financeiras & Faturamento</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Dia do Vencimento (Opcional)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={clientForm.dia_vencimento}
                    onChange={(e) => setClientForm({ ...clientForm, dia_vencimento: e.target.value })}
                    className="w-full h-12 px-4 bg-white dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-sm font-medium text-gray-900 dark:text-on-surface transition-all placeholder:text-gray-400"
                    placeholder="Ex: 15"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Valor (Opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={clientForm.valor}
                    onChange={(e) => setClientForm({ ...clientForm, valor: e.target.value })}
                    className="w-full h-12 px-4 bg-white dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-sm font-medium text-gray-900 dark:text-on-surface transition-all placeholder:text-gray-400"
                    placeholder="Ex: 199.90"
                  />
                </div>

                <div className="flex flex-col gap-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Forma de Pagamento <span className="text-red-500">*</span></label>
                  <div className="flex gap-1 h-12 bg-white dark:bg-surface-container-highest p-1 rounded-xl ring-1 ring-gray-200 dark:ring-white/5">
                    {(['Boleto', 'Pix', 'Cartão']).map(opt => (
                      <button 
                        key={opt}
                        type="button"
                        onClick={() => setClientForm({ ...clientForm, forma_de_pgt: opt })}
                        className={`flex-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center ${
                          clientForm.forma_de_pgt === opt
                            ? 'bg-brand-600 dark:bg-primary-container text-white dark:text-on-primary-container shadow-md'
                            : 'hover:bg-gray-50 dark:hover:bg-surface-container-high text-gray-500 dark:text-on-surface-variant'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Envia NF <span className="text-red-500">*</span></label>
                  <div className="flex gap-1 h-12 bg-white dark:bg-surface-container-highest p-1 rounded-xl ring-1 ring-gray-200 dark:ring-white/5">
                    <button 
                      type="button"
                      onClick={() => setClientForm({ ...clientForm, envia_nf: 'sim' })}
                      className={`flex-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center ${
                        clientForm.envia_nf === 'sim'
                          ? 'bg-brand-600 dark:bg-primary-container text-white dark:text-on-primary-container shadow-md'
                          : 'hover:bg-gray-50 dark:hover:bg-surface-container-high text-gray-500 dark:text-on-surface-variant'
                      }`}
                    >Sim</button>
                    <button 
                      type="button"
                      onClick={() => setClientForm({ ...clientForm, envia_nf: 'nao' })}
                      className={`flex-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center ${
                        clientForm.envia_nf === 'nao'
                          ? 'bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300 shadow-md'
                          : 'hover:bg-gray-50 dark:hover:bg-surface-container-high text-gray-500 dark:text-on-surface-variant'
                      }`}
                    >Não</button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:col-span-1">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider ml-1">Canal de Envio <span className="text-red-500">*</span></label>
                  <select 
                    value={clientForm.canais}
                    onChange={(e) => setClientForm({ ...clientForm, canais: e.target.value })}
                    className="w-full h-12 px-4 bg-white dark:bg-surface-container-highest rounded-xl border-none ring-1 ring-gray-200 dark:ring-white/5 focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary appearance-none cursor-pointer text-sm font-medium text-gray-900 dark:text-on-surface transition-all"
                  >
                    <option value="">Selecionar</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="WhatsApp e Email">WhatsApp e Email</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="opacity-0 animate-fade-in-up [animation-delay:400ms] flex items-center justify-end pt-6 border-t border-gray-100 dark:border-white/5">
              <button 
                type="submit"
                disabled={loading}
                className="h-12 px-8 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-primary dark:to-primary-container text-white font-headline font-bold text-sm rounded-xl shadow-xl shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                Finalizar Cadastro
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
