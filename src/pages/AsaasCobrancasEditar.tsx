import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, CheckCircle2, XCircle, Loader2, DollarSign, Wallet, ChevronRight, X, Trash2, Pencil, BadgeCheck, Plus
} from 'lucide-react'
import DatePickerField from '../components/DatePickerField'
import { supabase } from '../lib/supabase'
import { useClientes } from '../hooks/useSupabase'

interface Pagamento {
  id: string
  customer: string
  dueDate: string
  value: number
  billingType: 'BOLETO' | 'PIX'
  status: string
  description: string
  observations: string
  tipo?: 'cobranca' | 'assinatura'
}

export default function AsaasCobrancasEditar() {
  const { clientes } = useClientes()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchCliente, setSearchCliente] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [cobranças, setCobranças] = useState<Pagamento[]>([])
  const [assinaturas, setAssinaturas] = useState<Pagamento[]>([])
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Pagamento | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)
  const [confirmBaixa, setConfirmBaixa] = useState<Pagamento | null>(null)
  const [baixaLoading, setBaixaLoading] = useState(false)
  const [notificarBaixa, setNotificarBaixa] = useState(true)
  const [confirmUpdateLancamentos, setConfirmUpdateLancamentos] = useState(false)
  const [editForm, setEditForm] = useState({
    valor: '',
    data_vencimento: '',
    forma_pgt: 'BOLETO',
    observacao: '',
  })

  // Filtrar clientes por busca
  const clientesFiltrados = useMemo(() => {
    if (!searchCliente.trim()) return clientes
    return clientes.filter(c =>
      c.descricao.toLowerCase().includes(searchCliente.toLowerCase())
    )
  }, [clientes, searchCliente])

  const handleSelecionarCliente = async (cliente: any) => {
    if (!cliente.asaas_customer_id) {
      setMessage({ type: 'error', text: 'Cliente não possui ID do Asaas' })
      return
    }

    setSelectedCliente(cliente)
    setSearchCliente('')
    setLoading(true)
    setMessage(null)
    setCobranças([])
    setAssinaturas([])
    setSelectedPagamento(null)

    try {
      const res = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/get-asaas-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asaas_customer_id: cliente.asaas_customer_id }),
      })
      const data = await res.json()

      if (data.success && data.total > 0) {
        const chargesArr = data.charges.map((c: any) => ({ ...c, tipo: 'cobranca' }))
        const subsArr = data.subscriptions.map((s: any) => ({
          ...s,
          dueDate: s.nextDueDate,
          tipo: 'assinatura',
        }))
        setCobranças(chargesArr)
        setAssinaturas(subsArr)
        setMessage(null)
      } else if (data.success) {
        setMessage({ type: 'error', text: `Nenhuma cobrança/assinatura em aberto para ${cliente.descricao}` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao buscar cobranças' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelecionarPagamento = (pagamento: Pagamento) => {
    setSelectedPagamento(pagamento)
    setEditForm({
      valor: pagamento.value.toString(),
      data_vencimento: pagamento.dueDate,
      forma_pgt: pagamento.billingType,
      observacao: pagamento.description || '',
    })
  }

  const handleDeleteAssinatura = (pagamento: Pagamento) => {
    setConfirmDelete(pagamento)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    setDeletingLoading(true)
    try {
      const isAssinatura = confirmDelete.tipo === 'assinatura'
      const endpoint = isAssinatura ? 'delete-asaas-subscription' : 'delete-asaas-charge'
      const bodyPayload = isAssinatura  ? { subscription_id: confirmDelete.id } : { payment_id: confirmDelete.id }
      const headers: any = { 'Content-Type': 'application/json' }
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
      const res = await fetch(`https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      })
      const data = await res.json()

      if (data.success || data.deleted || data.id) {
        setConfirmDelete(null)
        setMessage({ type: 'success', text: isAssinatura ? 'Assinatura deletada com sucesso!' : 'Cobrança deletada com sucesso!' })
        setSelectedPagamento(null)

        if (selectedCliente) {
          const reloadRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/get-asaas-charges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asaas_customer_id: selectedCliente.asaas_customer_id }),
          })
          const reloadData = await reloadRes.json()
          if (reloadData.success && reloadData.total > 0) {
            setCobranças(reloadData.charges.map((c: any) => ({ ...c, tipo: 'cobranca' })))
            setAssinaturas(reloadData.subscriptions.map((s: any) => ({ ...s, dueDate: s.nextDueDate, tipo: 'assinatura' })))
          } else {
            setCobranças([])
            setAssinaturas([])
          }
        }
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: 'error', text: data.error || `Erro ao deletar ${isAssinatura ? 'assinatura' : 'cobrança'}` })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor' })
    } finally {
      setDeletingLoading(false)
    }
  }

  const handleConfirmBaixa = async () => {
    if (!confirmBaixa) return
    setBaixaLoading(true)
    try {
      const res = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/baixa-asaas-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: confirmBaixa.id, notificar: notificarBaixa }),
      })
      const data = await res.json()
      if (data.success) {
        if (selectedCliente?.id) {
          await supabase
            .from('clientes')
            .update({ notificar: notificarBaixa })
            .eq('id', selectedCliente.id)
        }
        setConfirmBaixa(null)
        setNotificarBaixa(true)
        setMessage({ type: 'success', text: 'Baixa realizada com sucesso!' })
        if (selectedCliente) {
          const reloadRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/get-asaas-charges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asaas_customer_id: selectedCliente.asaas_customer_id }),
          })
          const reloadData = await reloadRes.json()
          if (reloadData.success) {
            setCobranças(reloadData.charges.map((c: any) => ({ ...c, tipo: 'cobranca' })))
            setAssinaturas(reloadData.subscriptions.map((s: any) => ({ ...s, dueDate: s.nextDueDate, tipo: 'assinatura' })))
          }
        }
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao dar baixa' })
        setConfirmBaixa(null)
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor' })
      setConfirmBaixa(null)
    } finally {
      setBaixaLoading(false)
    }
  }

  const handleSalvarAlteracoes = () => {
    if (!selectedPagamento) return
    if (!editForm.valor || !editForm.data_vencimento) {
      setMessage({ type: 'error', text: 'Preencha valor e data de vencimento' })
      return
    }
    if ((selectedPagamento as any).tipo === 'assinatura') {
      setConfirmUpdateLancamentos(true)
      return
    }
    doSave(false)
  }

  const doSave = async (incluirLancamentos: boolean) => {
    if (!selectedPagamento) return
    setConfirmUpdateLancamentos(false)
    setLoading(true)

    try {
      const res = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/update-asaas-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: selectedPagamento.id,
          tipo: (selectedPagamento as any).tipo,
          valor: editForm.valor,
          data_vencimento: editForm.data_vencimento,
          forma_pgt: editForm.forma_pgt,
          description: editForm.observacao || undefined,
          cliente_id: incluirLancamentos ? selectedCliente?.id : undefined,
          atualizar_pendentes: incluirLancamentos,
        }),
      })

      const data = await res.json()

      if (data.success) {
        if (incluirLancamentos && data.lancamentos_erro) {
          setMessage({ type: 'error', text: `Assinatura atualizada, mas os lançamentos não: ${data.lancamentos_erro}` })
        } else {
          const lancMsg = incluirLancamentos
            ? ` ${data.lancamentos_atualizados || 0} lançamento(s) em aberto atualizado(s).`
            : ''
          setMessage({ type: 'success', text: `Cobrança atualizada com sucesso!${lancMsg}` })
        }
        setSelectedPagamento(null)

        if (selectedCliente) {
          const reloadRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/get-asaas-charges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asaas_customer_id: selectedCliente.asaas_customer_id }),
          })
          const reloadData = await reloadRes.json()
          if (reloadData.success && reloadData.total > 0) {
            setCobranças(reloadData.charges.map((c: any) => ({ ...c, tipo: 'cobranca' })))
            setAssinaturas(reloadData.subscriptions.map((s: any) => ({ ...s, dueDate: s.nextDueDate, tipo: 'assinatura' })))
          }
        }
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao atualizar' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] font-body relative transition-colors delay-100">
      
      {/* Modals with Dark theme integration */}
      {confirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 pointer-events-auto" onClick={() => !deletingLoading && setConfirmDelete(null)} />
          <div className="bg-white dark:bg-surface-container rounded-2xl shadow-xl border border-transparent dark:border-white/5 p-8 max-w-md mx-4 pointer-events-auto relative z-50 transition-colors">
            <h3 className="text-xl font-bold font-headline text-gray-900 dark:text-primary mb-2">
              {confirmDelete.tipo === 'assinatura' ? 'Deletar assinatura?' : 'Deletar cobrança?'}
            </h3>
            <p className="text-sm font-label text-gray-600 dark:text-on-surface-variant mb-6">
              Tem certeza que deseja deletar esta {confirmDelete.tipo === 'assinatura' ? 'assinatura' : 'cobrança'}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={deletingLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-surface-variant text-gray-700 dark:text-on-surface-variant hover:bg-gray-200 dark:hover:bg-surface-container-highest transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} disabled={deletingLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 dark:bg-error dark:text-on-error hover:bg-red-700 dark:hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deletingLoading ? <><Loader2 size={16} className="animate-spin" /> Deletando...</> : <>Deletar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmBaixa && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 pointer-events-auto" onClick={() => !baixaLoading && (setConfirmBaixa(null), setNotificarBaixa(true))} />
          <div className="bg-white dark:bg-surface-container rounded-2xl shadow-xl border border-transparent dark:border-white/5 p-8 max-w-md mx-4 pointer-events-auto relative z-50 transition-colors">
            <h3 className="text-xl font-bold font-headline text-gray-900 dark:text-primary mb-2">Dar baixa na cobrança?</h3>
            <p className="text-sm border-l-2 border-emerald-500 pl-3 py-1 font-label text-gray-600 dark:text-on-surface-variant mb-4">
              {confirmBaixa.description || 'Sem descrição'} — <span className="font-extrabold text-emerald-600 dark:text-secondary">{confirmBaixa.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </p>
            <p className="text-sm font-label text-gray-500 dark:text-outline-variant mb-4">A data de pagamento será registrada como hoje.</p>
            <div className="flex items-center justify-between mb-6 px-1">
              <span className="text-sm font-bold font-label text-gray-700 dark:text-on-surface-variant">Notificar ao Dar Baixa</span>
              <div className="flex bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-lg p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setNotificarBaixa(true)}
                  className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                    notificarBaixa
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-secondary-container dark:text-on-secondary-container shadow-sm'
                      : 'text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setNotificarBaixa(false)}
                  className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                    !notificarBaixa
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-sm'
                      : 'text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface'
                  }`}
                >
                  Não
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setConfirmBaixa(null); setNotificarBaixa(true) }} disabled={baixaLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-surface-variant text-gray-700 dark:text-on-surface-variant hover:bg-gray-200 dark:hover:bg-surface-container-highest transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={handleConfirmBaixa} disabled={baixaLoading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 dark:bg-secondary dark:text-on-secondary hover:bg-emerald-700 dark:hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {baixaLoading ? <><Loader2 size={16} className="animate-spin" /> Processando...</> : <><BadgeCheck size={16} /> Confirmar Baixa</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: atualizar lançamentos em aberto? */}
      {confirmUpdateLancamentos && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 pointer-events-auto" onClick={() => setConfirmUpdateLancamentos(false)} />
          <div className="bg-white dark:bg-surface-container rounded-2xl shadow-xl border border-transparent dark:border-white/5 p-8 max-w-md mx-4 pointer-events-auto relative z-50 transition-colors">
            <h3 className="text-xl font-bold font-headline text-gray-900 dark:text-primary mb-2">Atualizar lançamentos?</h3>
            <p className="text-sm font-label text-gray-600 dark:text-on-surface-variant mb-6">
              Deseja atualizar também os lançamentos <strong>pendentes e atrasados</strong> deste cliente para o novo valor?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => doSave(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 dark:bg-primary dark:text-on-primary hover:bg-brand-700 transition-colors"
              >
                Atualizar assinatura + lançamentos em aberto
              </button>
              <button
                onClick={() => doSave(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-surface-variant text-gray-700 dark:text-on-surface-variant hover:bg-gray-200 transition-colors"
              >
                Somente a assinatura
              </button>
              <button
                onClick={() => setConfirmUpdateLancamentos(false)}
                className="w-full py-2 text-xs font-label text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {message?.type === 'success' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-6 py-4 shadow-md flex items-center gap-3 max-w-md mx-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{message.text}</p>
          </div>
        </div>
      )}

      {/* Sidebar List */}
      <div className="w-80 shrink-0 flex flex-col bg-white dark:bg-[#060e20] rounded-2xl border border-brand-100/50 dark:border-white/5 shadow-sm overflow-hidden transition-colors animate-fade-in-right">
        <div className="p-4 border-b border-brand-100/50 dark:border-white/5">
          <p className="text-xs font-bold font-label text-gray-500 dark:text-outline-variant uppercase tracking-wider mb-3">Clientes</p>
          <div className="relative">
            <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-outline/50 pointer-events-none" />
            <input
              type="text"
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 dark:border-none dark:bg-[#0b1326] text-sm text-gray-900 dark:text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary/50 transition-all placeholder:text-gray-400 dark:placeholder:text-outline/50"
            />
            {searchCliente && (
              <button onClick={() => setSearchCliente('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-outline hover:text-gray-600 dark:hover:text-on-surface">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-700 dark:border-primary border-t-transparent" />
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <p className="text-center py-10 text-sm font-label text-gray-400 dark:text-outline-variant">Nenhum cliente encontrado</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {clientesFiltrados.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelecionarCliente(c)}
                  disabled={!c.asaas_customer_id}
                  className={`w-full text-left pr-3 pl-4 py-3 flex items-center justify-between gap-3 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedCliente?.id === c.id
                      ? 'bg-brand-50 dark:bg-surface-container-highest border-r-4 border-brand-400 dark:border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-[#0b1326] border-r-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-surface-container-high dark:text-on-surface-variant flex items-center justify-center shrink-0 text-xs font-bold">
                      {c.descricao.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-gray-800 dark:text-on-surface">
                        {c.descricao}
                      </p>
                      {c.contato && (
                        <p className="text-xs text-gray-400 dark:text-outline-variant truncate">{c.contato}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-gray-300 dark:text-outline-variant group-hover:text-gray-400 dark:group-hover:text-on-surface transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-brand-100/50 dark:border-white/5">
          <p className="text-xs text-center font-label text-gray-400 dark:text-outline-variant">{clientes.length} clientes cadastrados</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {selectedCliente ? (
          <EditPanel
            cliente={selectedCliente}
            cobranças={cobranças}
            assinaturas={assinaturas}
            selectedPagamento={selectedPagamento}
            editForm={editForm}
            loading={loading}
            message={message}
            onSelectPagamento={handleSelecionarPagamento}
            onEditFormChange={(form: typeof editForm) => setEditForm(form)}
            onSave={handleSalvarAlteracoes}
            onBack={() => setSelectedPagamento(null)}
            onDelete={handleDeleteAssinatura}
            onBaixa={(p: Pagamento) => setConfirmBaixa(p)}
            onCriarCobranca={() => navigate(`/asaas-cobranca?cliente_id=${selectedCliente.id}`)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-[#060e20] border border-transparent dark:border-white/5 flex items-center justify-center mb-4 transition-colors">
              <FileText size={28} className="text-brand-300 dark:text-outline-variant" />
            </div>
            <p className="text-base font-bold font-headline text-gray-400 dark:text-outline-variant">Selecione um cliente</p>
            <p className="text-sm font-label text-gray-300 dark:text-outline/40 mt-1">Clique em um cliente para editar suas cobranças</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EditPanel({
  cliente, cobranças, assinaturas, selectedPagamento, editForm, loading, message,
  onSelectPagamento, onEditFormChange, onSave, onBack, onDelete, onBaixa, onCriarCobranca,
}: any) {
  
  if (selectedPagamento) {
    return (
      <div className="flex flex-col gap-4 h-full font-body">
        {/* Header Bar */}
        <div className="opacity-0 animate-fade-in-up [animation-delay:50ms] flex items-center justify-between bg-white dark:bg-[#060e20] px-5 py-4 rounded-2xl border border-brand-100/50 dark:border-white/5 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-600 dark:bg-primary-container text-white dark:text-on-primary-container flex items-center justify-center font-bold text-lg shadow-inner">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold font-headline text-brand-950 dark:text-on-surface tracking-tight">Editar Transação</h2>
              <p className="text-xs font-label text-gray-500 dark:text-outline-variant">{selectedPagamento.description || 'Sem descrição'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {message && message.type === 'error' && (
              <div className="flex items-center gap-2 text-xs font-bold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-lg transition-all">
                <XCircle size={14} /> {message.text}
              </div>
            )}
            <button onClick={onBack} className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-surface-variant text-gray-700 dark:text-on-surface-variant hover:bg-gray-200 dark:hover:bg-surface-container-highest transition-colors shadow-sm">
              Voltar
            </button>
            <button onClick={onSave} disabled={loading} className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-primary dark:to-primary-container dark:text-on-primary">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <>Salvar</>}
            </button>
          </div>
        </div>

        {/* Form Body - Bento Grid */}
        <div className="opacity-0 animate-fade-in-up [animation-delay:150ms] bg-white dark:bg-surface-container-low rounded-2xl p-5 md:p-6 border border-brand-100/50 dark:border-transparent dark:glass-panel shadow-sm relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl group">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 dark:bg-primary opacity-50 transition-all duration-500 ease-out group-hover:w-1.5 focus-within:w-1.5"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col space-y-1.5">
              <label className="font-label text-[10px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={12} className="text-gray-400 dark:text-outline-variant" /> Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.valor}
                onChange={(e) => onEditFormChange({ ...editForm, valor: e.target.value })}
                className="bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface p-2.5 text-sm transition-all"
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <label className="font-label text-[10px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider">
                Forma de Pagamento <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {(['BOLETO', 'PIX'] as const).map((opt) => (
                  <label key={opt} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border cursor-pointer transition-all text-[11px] font-bold shadow-sm ${
                    editForm.forma_pgt === opt
                      ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-primary-container dark:text-on-primary-container dark:border-transparent'
                      : 'border-gray-200 text-gray-600 dark:bg-surface-container-highest dark:border-transparent dark:text-on-surface-variant hover:border-gray-300 dark:hover:bg-surface-container-high'
                  }`}>
                    <input
                      type="radio"
                      name="forma_pgt"
                      value={opt}
                      checked={editForm.forma_pgt === opt}
                      onChange={(e) => onEditFormChange({ ...editForm, forma_pgt: e.target.value as 'BOLETO' | 'PIX' })}
                      className="sr-only"
                    />
                    <Wallet size={14} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="flex flex-col space-y-1.5">
                 <div className="[&_input]:bg-gray-50 dark:[&_input]:bg-surface-container-highest [&_input]:border-gray-200 dark:[&_input]:border-none [&_input]:text-gray-900 dark:[&_input]:text-on-surface [&_label]:text-gray-500 dark:[&_label]:text-on-surface-variant [&_label]:font-label [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-[10px] [&_label]:font-bold">
                   <DatePickerField
                     label="Data de Vencimento"
                     value={editForm.data_vencimento}
                     onChange={(v) => onEditFormChange({ ...editForm, data_vencimento: v })}
                   />
                 </div>
               </div>

               <div className="flex flex-col space-y-1.5">
                 <label className="font-label text-[10px] font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider">
                   Observação
                 </label>
                 <textarea
                   value={editForm.observacao}
                   onChange={(e) => onEditFormChange({ ...editForm, observacao: e.target.value })}
                   placeholder="Alguma observação adicional..."
                   rows={7}
                   className="bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface placeholder:text-gray-400 dark:placeholder:text-outline/50 p-2.5 text-sm transition-all resize-y"
                 />
               </div>
            </div>
            
          </div>
        </div>
      </div>
    )
  }

  const formatarData = (dataStr: string) => {
    if (!dataStr) return ''
    const parts = dataStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dataStr
  }

  const formatarForma = (tipo: string) => {
    if (tipo === 'BOLETO') return 'Boleto'
    if (tipo === 'PIX') return 'Pix'
    if (tipo === 'CREDIT_CARD') return 'Cartão'
    return tipo
  }

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="bg-white dark:bg-surface-container rounded-2xl border border-brand-100/50 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-full transition-colors opacity-0 animate-fade-in-up [animation-delay:50ms]">
      {/* Header */}
      <div className="px-6 py-5 border-b border-brand-50 dark:border-white/5 bg-gradient-to-br from-brand-50/50 to-white dark:from-surface-container-low dark:to-surface" style={{ background: 'linear-gradient(135deg, #7C3AED08, #5B21B608)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-600 dark:bg-primary-container text-white dark:text-on-primary-container flex items-center justify-center font-bold text-xl shadow-inner">
            {cliente.descricao.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold font-headline text-brand-950 dark:text-on-surface tracking-tight">{cliente.descricao}</h2>
            <p className="text-sm font-label text-gray-500 dark:text-outline-variant">ID: {cliente.asaas_customer_id}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {(cobranças.length > 0 || assinaturas.length > 0) ? (
          <div className="space-y-8">
            {/* Assinaturas */}
            {assinaturas.length > 0 && (
              <div className="opacity-0 animate-fade-in-up [animation-delay:150ms] border border-brand-100/50 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="bg-brand-50/50 dark:bg-surface-container-highest px-5 py-3 border-b border-brand-100/50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-headline text-brand-800 dark:text-primary">
                      Assinaturas Ativas
                    </h3>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-surface-container-low">
                  {assinaturas.map((pag: any) => (
                     <div key={pag.id} onClick={() => onSelectPagamento(pag)} className="flex flex-col sm:flex-row sm:items-stretch transition-all min-h-[56px] cursor-pointer hover:bg-brand-50 dark:hover:bg-[#2d3449]">
                      <div className="px-5 py-3 w-full sm:w-36 flex-shrink-0 flex items-center">
                        <span className="font-extrabold font-headline text-brand-700 dark:text-primary text-base">{formatarMoeda(pag.value)}</span>
                      </div>
                      <div className="px-5 py-3 flex-1 min-w-0 sm:border-l border-gray-100 dark:border-white/5 flex items-center">
                        <span className="text-sm font-body text-gray-700 dark:text-on-surface truncate">{pag.description || 'Sem descrição'}</span>
                      </div>
                      <div className="px-5 py-3 w-full sm:w-32 sm:border-l border-gray-100 dark:border-white/5 flex items-center">
                        <span className="text-sm font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider font-label">{formatarForma(pag.billingType)}</span>
                      </div>
                      <div className="px-5 py-3 w-full sm:w-32 sm:border-l border-gray-100 dark:border-white/5 flex items-center">
                        <span className="text-sm font-label text-gray-600 dark:text-on-surface-variant">{formatarData(pag.dueDate)}</span>
                      </div>
                      <div className="px-4 py-3 w-full sm:w-32 shrink-0 flex items-center justify-end gap-2 sm:border-l border-gray-100 dark:border-white/5">
                        <button onClick={(e) => { e.stopPropagation(); onSelectPagamento(pag) }} className="p-2 text-brand-600 dark:text-primary hover:bg-brand-100 dark:hover:bg-primary-container/30 rounded-lg transition-colors" title="Editar">
                          <Pencil size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete?.(pag) }} className="p-2 text-red-600 dark:text-error hover:bg-red-50 dark:hover:bg-error-container/30 rounded-lg transition-colors" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cobranças */}
            {cobranças.length > 0 && (
              <div className="opacity-0 animate-fade-in-up [animation-delay:250ms] border border-brand-100/50 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="bg-brand-50/50 dark:bg-surface-container-highest px-5 py-3 border-b border-brand-100/50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-headline text-brand-800 dark:text-primary">
                      Cobranças Avulsas
                    </h3>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-surface-container-low">
                  {cobranças.map((pag: any) => (
                    <div key={pag.id} onClick={() => onSelectPagamento(pag)} className={`flex flex-col sm:flex-row sm:items-stretch transition-all min-h-[56px] cursor-pointer ${['RECEIVED', 'RECEIVED_IN_CASH'].includes(pag.status) ? 'bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'hover:bg-brand-50 dark:hover:bg-[#2d3449]'}`}>
                      <div className="px-5 py-3 w-full sm:w-36 flex-shrink-0 flex items-center">
                        <span className={`font-extrabold font-headline text-base ${['RECEIVED', 'RECEIVED_IN_CASH'].includes(pag.status) ? 'text-emerald-700 dark:text-emerald-400' : 'text-brand-700 dark:text-primary'}`}>{formatarMoeda(pag.value)}</span>
                      </div>
                      <div className="px-5 py-3 flex-1 min-w-0 sm:border-l border-gray-100 dark:border-white/5 flex items-center">
                        <span className="text-sm font-body text-gray-700 dark:text-on-surface truncate">{pag.description || 'Sem descrição'}</span>
                      </div>
                      <div className="px-5 py-3 w-full sm:w-32 sm:border-l border-gray-100 dark:border-white/5 flex items-center">
                        <span className="text-sm font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider font-label">{formatarForma(pag.billingType)}</span>
                      </div>
                      <div className="px-5 py-3 w-full sm:w-32 sm:border-l border-gray-100 dark:border-white/5 flex items-center">
                        <span className="text-sm font-label text-gray-600 dark:text-on-surface-variant">{formatarData(pag.dueDate)}</span>
                      </div>
                      <div className="px-4 py-3 w-full sm:w-32 shrink-0 flex items-center justify-end gap-2 sm:border-l border-gray-100 dark:border-white/5">
                        {!['RECEIVED', 'RECEIVED_IN_CASH'].includes(pag.status) && (
                          <button onClick={(e) => { e.stopPropagation(); onBaixa?.(pag) }} className="p-2 text-emerald-600 dark:text-secondary hover:bg-emerald-50 dark:hover:bg-secondary-container/30 rounded-lg transition-colors" title="Dar Baixa">
                            <BadgeCheck size={18} />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onSelectPagamento(pag) }} className="p-2 text-brand-600 dark:text-primary hover:bg-brand-100 dark:hover:bg-primary-container/30 rounded-lg transition-colors" title="Editar">
                          <Pencil size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete?.(pag) }} className="p-2 text-red-600 dark:text-error hover:bg-red-50 dark:hover:bg-error-container/30 rounded-lg transition-colors" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center">
            <Wallet size={48} className="text-gray-300 dark:text-surface-container-highest mb-4" />
            <p className="text-lg font-headline font-bold text-gray-500 dark:text-outline-variant">Sem transações ativas</p>
            <p className="text-sm font-body text-gray-400 dark:text-outline">Este cliente não possui cobranças registradas no Asaas.</p>
            <button
              onClick={onCriarCobranca}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-headline font-extrabold text-white shadow-lg shadow-brand-500/20 active:scale-95 transition-all hover:opacity-90 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-primary dark:to-primary-container dark:text-on-primary"
            >
              <Plus size={16} /> Criar cobrança para {cliente.descricao}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
