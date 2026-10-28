import { useState, useMemo } from 'react'
import {
  Search, X, User, Phone, Mail, Hash, Building2,
  Calendar, FileText, Wallet, CheckCircle2, XCircle,
  Loader2, Save, ChevronRight, Power, AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useClientes } from '../hooks/useSupabase'
import type { Cliente } from '../types'

export default function EditarContatos() {
  const { clientes, loading, refetch } = useClientes()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Cliente | null>(null)

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    const list = term ? clientes.filter((c) => c.descricao.toLowerCase().includes(term)) : clientes
    return [...list].sort((a, b) => {
      const aInativo = a.ativo === false ? 1 : 0
      const bInativo = b.ativo === false ? 1 : 0
      return aInativo - bInativo
    })
  }, [clientes, search])

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Lista lateral */}
      <div className="w-80 shrink-0 flex flex-col bg-white dark:bg-[#060e20] rounded-2xl border border-brand-100/50 dark:border-white/5 shadow-sm overflow-hidden transition-colors animate-fade-in-right">
        {/* Search */}
        <div className="p-4 border-b border-brand-100/50 dark:border-white/5">
          <p className="text-xs font-semibold text-gray-500 dark:text-outline-variant uppercase tracking-wider mb-3">Clientes</p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-outline/50 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 dark:border-none dark:bg-[#0b1326] text-sm text-gray-900 dark:text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary/50 transition-all placeholder:text-gray-400 dark:placeholder:text-outline/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-outline hover:text-gray-600 dark:hover:text-on-surface">
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
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-sm text-gray-400 dark:text-outline-variant">Nenhum cliente encontrado</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {filtered.map((c) => {
                const isInativo = c.ativo === false
                return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left pl-4 pr-3 py-3 flex items-center justify-between gap-3 transition-all group ${
                    selected?.id === c.id
                      ? 'bg-brand-50 dark:bg-surface-container-highest border-r-4 border-brand-400 dark:border-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-[#0b1326] border-r-4 border-transparent'
                  } ${isInativo ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isInativo
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-brand-100 text-brand-700 dark:bg-surface-container-high dark:text-on-surface-variant'
                    }`}>
                      {c.descricao.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-gray-800 dark:text-on-surface flex items-center gap-1.5">
                        {c.descricao}
                        {isInativo && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 uppercase tracking-wider">Inativo</span>
                        )}
                        {!isInativo && c.cobranca_automatica === false && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wider">Manual</span>
                        )}
                      </p>
                      {c.contato && (
                        <p className="text-xs text-gray-400 dark:text-outline-variant truncate">{c.contato}</p>
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
          <p className="text-xs text-center text-gray-400 dark:text-outline-variant">{clientes.length} clientes cadastrados</p>
        </div>
      </div>

      {/* Painel de edição */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {selected ? (
          <EditForm key={selected.id} cliente={selected} onSaved={(updated) => { setSelected(updated); refetch() }} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-[#060e20] flex items-center justify-center mb-4 border border-transparent dark:border-white/5">
              <User size={28} className="text-brand-300 dark:text-outline-variant" />
            </div>
            <p className="text-base font-semibold text-gray-400 dark:text-outline-variant">Selecione um cliente</p>
            <p className="text-sm text-gray-300 dark:text-outline/40 mt-1">Clique em um cliente para editar suas informações</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EditForm({ cliente, onSaved }: { cliente: Cliente; onSaved: (c: Cliente) => void }) {
  const [form, setForm] = useState({
    descricao: cliente.descricao || '',
    contato: cliente.contato || '',
    whatsapp: cliente.whatsapp || '',
    email: cliente.email || '',
    cnpj_cpf: cliente.cnpj_cpf || '',
    cep: cliente.cep || '',
    dia_vencimento: cliente.dia_vencimento?.toString() || '',
    forma_de_pgt: cliente.forma_de_pgt || '',
    canais: cliente.canais || '',
    envia_nf: cliente.envia_nf ?? false,
    cobranca_automatica: cliente.cobranca_automatica ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmToggleAtivo, setConfirmToggleAtivo] = useState(false)
  const [togglingAtivo, setTogglingAtivo] = useState(false)
  const [confirmCobrancaAuto, setConfirmCobrancaAuto] = useState<boolean | null>(null)

  const isAtivo = cliente.ativo !== false

  const handleToggleAtivo = async () => {
    setTogglingAtivo(true)
    setMessage(null)
    try {
      const novoAtivo = !isAtivo
      const { data, error } = await supabase
        .from('clientes')
        .update({ ativo: novoAtivo })
        .eq('id', cliente.id)
        .select()
        .single()

      if (error) {
        setMessage({ type: 'error', text: `Erro ao ${novoAtivo ? 'ativar' : 'desativar'} cliente` })
        return
      }

      let removidas = 0
      let assinaturasRemovidas = 0
      let falhasRemocao = 0
      if (!novoAtivo && cliente.asaas_customer_id) {
        try {
          const headers: any = { 'Content-Type': 'application/json' }
          if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
            headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
          const chargesRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/get-asaas-charges', {
            method: 'POST',
            headers,
            body: JSON.stringify({ asaas_customer_id: cliente.asaas_customer_id }),
          })
          const chargesData = await chargesRes.json()

          if (chargesData.success) {
            // Exclui cobranças avulsas pendentes
            const pendentes = (chargesData.charges || []).filter((c: any) => c.status === 'PENDING' || c.status === 'OVERDUE')
            for (const p of pendentes) {
              const delRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/delete-asaas-charge', {
                method: 'POST',
                headers,
                body: JSON.stringify({ payment_id: p.id }),
              })
              const delData = await delRes.json().catch(() => ({}))
              if (delRes.ok && (delData.deleted || delData.success || delData.id)) {
                removidas++
              } else {
                falhasRemocao++
              }
            }

            // Exclui assinaturas vigentes
            for (const sub of (chargesData.subscriptions || [])) {
              const delRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/delete-asaas-subscription', {
                method: 'POST',
                headers,
                body: JSON.stringify({ subscription_id: sub.id }),
              })
              const delData = await delRes.json().catch(() => ({}))
              if (delRes.ok && (delData.deleted || delData.success || delData.id)) {
                assinaturasRemovidas++
              } else {
                falhasRemocao++
              }
            }
          }
        } catch {
          falhasRemocao++
        }
      }

      let successText = novoAtivo ? 'Cliente ativado!' : 'Cliente desativado!'
      if (!novoAtivo) {
        const partes: string[] = []
        if (removidas > 0) partes.push(`${removidas} cobrança(s) removida(s)`)
        if (assinaturasRemovidas > 0) partes.push(`${assinaturasRemovidas} assinatura(s) removida(s)`)
        if (partes.length > 0) successText += ` ${partes.join(', ')}.`
      }
      if (falhasRemocao > 0) {
        setMessage({ type: 'error', text: `Cliente desativado, mas falhou ao remover ${falhasRemocao} item(ns) no Asaas.` })
      } else {
        setMessage({ type: 'success', text: successText })
      }
      onSaved(data as Cliente)
      setConfirmToggleAtivo(false)
      setTimeout(() => setMessage(null), 4000)
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão' })
    } finally {
      setTogglingAtivo(false)
    }
  }

  const hasChanges = JSON.stringify(form) !== JSON.stringify({
    descricao: cliente.descricao || '',
    contato: cliente.contato || '',
    whatsapp: cliente.whatsapp || '',
    email: cliente.email || '',
    cnpj_cpf: cliente.cnpj_cpf || '',
    cep: cliente.cep || '',
    dia_vencimento: cliente.dia_vencimento?.toString() || '',
    forma_de_pgt: cliente.forma_de_pgt || '',
    canais: cliente.canais || '',
    envia_nf: cliente.envia_nf ?? false,
    cobranca_automatica: cliente.cobranca_automatica ?? true,
  })

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const novoDiaVencimento = form.dia_vencimento ? parseInt(form.dia_vencimento) : null
      const diaVencimentoMudou = novoDiaVencimento !== null && novoDiaVencimento !== cliente.dia_vencimento

      const { data, error } = await supabase
        .from('clientes')
        .update({
          descricao: form.descricao,
          contato: form.contato || null,
          whatsapp: form.whatsapp || null,
          email: form.email || null,
          cnpj_cpf: form.cnpj_cpf || null,
          cep: form.cep || null,
          dia_vencimento: novoDiaVencimento,
          forma_de_pgt: form.forma_de_pgt || null,
          canais: form.canais || null,
          envia_nf: form.envia_nf,
          cobranca_automatica: form.cobranca_automatica,
        })
        .eq('id', cliente.id)
        .select()
        .single()

      if (error) {
        setMessage({ type: 'error', text: 'Erro ao salvar alterações' })
        return
      }

      let lancamentosAtualizados = 0
      let assinaturaAtualizada = false

      if (diaVencimentoMudou) {
        // Atualiza faturas em aberto no banco
        const { data: lancamentos } = await supabase
          .from('lancamentos_mensais')
          .select('id, vencimento')
          .eq('cliente_id', cliente.id)
          .in('status_pagamento', ['pendente', 'atrasado'])

        if (lancamentos && lancamentos.length > 0) {
          for (const l of lancamentos) {
            const [ano, mes] = l.vencimento.split('-')
            const ultimoDiaMes = new Date(parseInt(ano), parseInt(mes), 0).getDate()
            const novoDia = Math.min(novoDiaVencimento, ultimoDiaMes)
            const novaData = `${ano}-${mes}-${String(novoDia).padStart(2, '0')}`
            const { error: updateError } = await supabase
              .from('lancamentos_mensais')
              .update({ vencimento: novaData })
              .eq('id', l.id)
            if (!updateError) lancamentosAtualizados++
          }
        }

        // Atualiza assinatura e cobranças em aberto no Asaas
        if (cliente.asaas_customer_id) {
          try {
            const headers: any = { 'Content-Type': 'application/json' }
            if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
              headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
            const chargesRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/get-asaas-charges', {
              method: 'POST',
              headers,
              body: JSON.stringify({ asaas_customer_id: cliente.asaas_customer_id }),
            })
            const chargesData = await chargesRes.json()

            const calcNovaData = (dateStr: string) => {
              const [ano, mes] = dateStr.split('-')
              const ultimoDiaMes = new Date(parseInt(ano), parseInt(mes), 0).getDate()
              const novoDia = Math.min(novoDiaVencimento, ultimoDiaMes)
              return `${ano}-${mes}-${String(novoDia).padStart(2, '0')}`
            }

            // Assinaturas
            if (chargesData.success && chargesData.subscriptions?.length > 0) {
              for (const sub of chargesData.subscriptions) {
                const nextDue = sub.nextDueDate || sub.dueDate
                if (nextDue) {
                  const updateRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/update-asaas-charge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      payment_id: sub.id,
                      tipo: 'assinatura',
                      data_vencimento: calcNovaData(nextDue),
                      valor: sub.value,
                      forma_pgt: sub.billingType,
                    }),
                  })
                  const updateData = await updateRes.json().catch(() => ({}))
                  if (updateData.success) assinaturaAtualizada = true
                }
              }
            }

            // Cobranças avulsas em aberto (PENDING ou OVERDUE)
            if (chargesData.success && chargesData.charges?.length > 0) {
              const cobrancasAbertas = chargesData.charges.filter(
                (c: any) => c.status === 'PENDING' || c.status === 'OVERDUE'
              )
              for (const cobranca of cobrancasAbertas) {
                const dueDate = cobranca.dueDate
                if (dueDate) {
                  await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/update-asaas-charge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      payment_id: cobranca.id,
                      tipo: 'cobranca',
                      data_vencimento: calcNovaData(dueDate),
                      valor: cobranca.value,
                      forma_pgt: cobranca.billingType,
                    }),
                  })
                }
              }
            }
          } catch {
            // falha silenciosa — não bloqueia o salvamento
          }
        }
      }

      // Atualiza dados do cliente no Asaas
      if (cliente.asaas_customer_id) {
        const asaasRes = await fetch('https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/update-asaas-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asaas_customer_id: cliente.asaas_customer_id,
            name: form.descricao,
            contact: form.contato,
            email: form.email,
            phone: form.whatsapp,
            cpfCnpj: form.cnpj_cpf,
            postalCode: form.cep,
          }),
        })

        const asaasData = await asaasRes.json().catch(() => ({}))
        if (!asaasRes.ok || asaasData.error) {
          setMessage({ type: 'error', text: `Salvo no banco, mas falhou no Asaas: ${asaasData.error || 'erro desconhecido'}` })
          onSaved(data as Cliente)
          return
        }
      }

      let successMsg = 'Salvo com sucesso!'
      if (diaVencimentoMudou && assinaturaAtualizada) {
        successMsg += ' Assinatura Asaas atualizada.'
      }

      setMessage({ type: 'success', text: successMsg })
      onSaved(data as Cliente)
      setTimeout(() => setMessage(null), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Erro de conexão' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full font-body">
      {/* Header Bar */}
      <div className="opacity-0 animate-fade-in-up [animation-delay:50ms] flex items-center justify-between bg-white dark:bg-[#060e20] px-6 py-5 rounded-2xl border border-brand-100/50 dark:border-white/5 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-600 dark:bg-primary-container text-white dark:text-on-primary-container flex items-center justify-center font-bold text-xl shadow-inner">
            {form.descricao.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-extrabold font-headline text-brand-950 dark:text-on-surface tracking-tight">{form.descricao}</h2>
            <p className="text-sm text-gray-500 dark:text-outline-variant">Editar informações do cliente</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {message.text}
            </div>
          )}
          <button
            onClick={() => setConfirmToggleAtivo(true)}
            disabled={togglingAtivo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 ${
              isAtivo
                ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50'
            }`}
          >
            <Power size={13} />
            {isAtivo ? 'Desativar Cliente' : 'Ativar Cliente'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 bg-gradient-to-r from-brand-600 to-brand-800 dark:from-primary dark:to-primary-container dark:text-on-primary"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar</>}
          </button>
        </div>
      </div>

      {/* Modal de confirmação Desativar/Ativar */}
      {confirmToggleAtivo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => !togglingAtivo && setConfirmToggleAtivo(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0b1326] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 overflow-hidden"
          >
            <div className={`px-6 py-5 flex items-center gap-3 border-b border-gray-100 dark:border-white/5 ${
              isAtivo ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isAtivo ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              }`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold font-headline text-gray-900 dark:text-on-surface">
                  {isAtivo ? 'Desativar cliente?' : 'Ativar cliente?'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-outline-variant">Essa ação pode ser revertida depois</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 dark:text-on-surface-variant">
                {isAtivo ? (
                  <>
                    Tem certeza que deseja desativar <strong className="text-gray-900 dark:text-on-surface">{cliente.descricao}</strong>?
                    <br />
                    <span className="text-xs text-gray-500 dark:text-outline-variant mt-2 block">
                      O cliente deixará de aparecer nos lançamentos mensais e todas as cobranças <strong>pendentes</strong> (cartão, boleto ou pix) serão removidas do Asaas.
                    </span>
                  </>
                ) : (
                  <>
                    Tem certeza que deseja ativar <strong className="text-gray-900 dark:text-on-surface">{cliente.descricao}</strong>?
                    <br />
                    <span className="text-xs text-gray-500 dark:text-outline-variant mt-2 block">
                      O cliente voltará a aparecer nos lançamentos mensais.
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#060e20] flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={() => setConfirmToggleAtivo(false)}
                disabled={togglingAtivo}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-on-surface-variant hover:bg-gray-100 dark:hover:bg-white/5 transition-all disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleAtivo}
                disabled={togglingAtivo}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  isAtivo
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {togglingAtivo ? (
                  <><Loader2 size={14} className="animate-spin" /> Processando...</>
                ) : (
                  <><Power size={14} /> {isAtivo ? 'Sim, desativar' : 'Sim, ativar'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
        
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Informações da Empresa */}
          <div className="opacity-0 animate-fade-in-up [animation-delay:150ms] bg-white dark:bg-surface-container-low rounded-2xl p-6 md:p-8 border border-brand-100/50 dark:border-white/5 dark:glass-panel shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 dark:bg-primary-container opacity-50 transition-all duration-500 ease-out group-hover:w-1.5 focus-within:w-1.5"></div>
            <h3 className="text-lg font-bold font-headline text-brand-700 dark:text-primary mb-6 flex items-center">
              <Building2 className="mr-2 text-sm w-5 h-5" /> Informações da Empresa
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider">
                  Empresa (Client Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface placeholder:text-gray-400 dark:placeholder:text-outline/50 transition-all p-3 text-sm"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider">
                  CPF ou CNPJ
                </label>
                <input
                  type="text"
                  value={form.cnpj_cpf}
                  onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value })}
                  className="bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface placeholder:text-gray-400 dark:placeholder:text-outline/50 transition-all p-3 text-sm"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-outline-variant" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface placeholder:text-gray-400 dark:placeholder:text-outline/50 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider">
                  CEP
                </label>
                <input
                  type="text"
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: e.target.value })}
                  className="bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface placeholder:text-gray-400 dark:placeholder:text-outline/50 transition-all p-3 text-sm"
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          {/* Ponto de Contato */}
          <div className="opacity-0 animate-fade-in-up [animation-delay:250ms] bg-white dark:bg-surface-container-low rounded-2xl p-6 md:p-8 border border-brand-100/50 dark:border-white/5 dark:glass-panel shadow-sm relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-500">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 dark:bg-secondary opacity-50 transition-all duration-500 ease-out group-hover:w-1.5 focus-within:w-1.5"></div>
            <h3 className="text-lg font-bold font-headline text-emerald-700 dark:text-secondary mb-6 flex items-center">
              <User className="mr-2 text-sm w-5 h-5" /> Ponto de Contato
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider">
                  Nome do Contato
                </label>
                <input
                  type="text"
                  value={form.contato}
                  onChange={(e) => setForm({ ...form, contato: e.target.value })}
                  className="bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-emerald-500/40 dark:focus:ring-secondary text-gray-900 dark:text-on-surface placeholder:text-gray-400 dark:placeholder:text-outline/50 transition-all p-3 text-sm"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-500 dark:text-on-surface-variant uppercase tracking-wider">
                  Celular (WhatsApp)
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-outline-variant" />
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-emerald-500/40 dark:focus:ring-secondary text-gray-900 dark:text-on-surface placeholder:text-gray-400 dark:placeholder:text-outline/50 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="opacity-0 animate-fade-in-up [animation-delay:350ms] bg-brand-50/30 dark:bg-surface-container-high rounded-2xl p-6 md:p-8 border border-brand-100/50 dark:border-white/5 dark:glass-panel shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-500">
            <h3 className="text-md font-bold font-headline text-brand-800 dark:text-on-surface mb-6 flex items-center">
              <Wallet className="mr-2 w-5 h-5 text-brand-600 dark:text-primary" /> Informações de Pagamento
            </h3>
            
            <div className="space-y-6">
              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                  Forma de Pagamento
                </label>
                <select
                  value={form.forma_de_pgt}
                  onChange={(e) => setForm({ ...form, forma_de_pgt: e.target.value })}
                  className="bg-white dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface p-3 text-sm cursor-pointer appearance-none transition-all"
                >
                  <option value="">Selecione</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão de Crédito</option>
                </select>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                  Dia do Vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dia_vencimento}
                  onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                  className="bg-white dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface p-3 text-sm transition-all"
                  placeholder="Ex: 5"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="font-label text-xs font-bold text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                  Canal de Envio
                </label>
                <select
                  value={form.canais}
                  onChange={(e) => setForm({ ...form, canais: e.target.value })}
                  className="bg-white dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-xl focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-primary text-gray-900 dark:text-on-surface p-3 text-sm cursor-pointer appearance-none transition-all"
                >
                  <option value="">Selecione</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp e Email">WhatsApp e Email</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
                <label className="font-label text-sm font-semibold text-gray-700 dark:text-on-surface-variant flex items-center gap-2">
                  <FileText size={16} className="text-gray-400 dark:text-outline-variant" />
                  Envia NF Automática
                </label>
                <div className="flex bg-white dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-lg p-1 shadow-sm">
                  <button
                    onClick={() => setForm({...form, envia_nf: true})}
                    className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                      form.envia_nf
                        ? 'bg-brand-100 text-brand-700 dark:bg-primary-container dark:text-on-primary-container shadow-sm'
                        : 'text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setForm({...form, envia_nf: false})}
                    className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                      !form.envia_nf
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-sm'
                        : 'text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-label text-sm font-semibold text-gray-700 dark:text-on-surface-variant flex items-center gap-2">
                      <Wallet size={16} className="text-gray-400 dark:text-outline-variant" />
                      Cobrança Automática (Asaas)
                    </label>
                    <p className="text-[11px] text-gray-400 dark:text-outline-variant leading-tight">
                      Quando desligada, o cliente continua no kanban mas não gera cobrança no Asaas nem envio. Baixa é manual.
                    </p>
                  </div>
                  <div className="flex bg-white dark:bg-surface-container-highest border border-gray-200 dark:border-none rounded-lg p-1 shadow-sm shrink-0">
                    <button
                      onClick={() => setForm({...form, cobranca_automatica: true})}
                      className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                        form.cobranca_automatica
                          ? 'bg-brand-100 text-brand-700 dark:bg-primary-container dark:text-on-primary-container shadow-sm'
                          : 'text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => {
                        if (form.cobranca_automatica && cliente.asaas_customer_id) {
                          setConfirmCobrancaAuto(false)
                        } else {
                          setForm({...form, cobranca_automatica: false})
                        }
                      }}
                      className={`px-4 py-1.5 text-xs rounded-md font-bold transition-all ${
                        !form.cobranca_automatica
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shadow-sm'
                          : 'text-gray-500 dark:text-on-surface-variant hover:text-gray-700 dark:hover:text-on-surface'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                {!form.cobranca_automatica && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>
                      Cliente marcado como <strong>pagamento direto</strong>. Lançamento mensal será gerado no kanban para baixa manual.
                      {cliente.asaas_customer_id && ' A assinatura no Asaas permanecerá ativa — cancele manualmente no painel Asaas se desejar.'}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação Cobrança Automática → false */}
      {confirmCobrancaAuto === false && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setConfirmCobrancaAuto(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0b1326] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md mx-4 overflow-hidden"
          >
            <div className="px-6 py-5 flex items-center gap-3 border-b border-gray-100 dark:border-white/5 bg-amber-50 dark:bg-amber-900/20">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold font-headline text-gray-900 dark:text-on-surface">
                  Desligar cobrança automática?
                </h3>
                <p className="text-xs text-gray-500 dark:text-outline-variant">Esse cliente tem cadastro no Asaas</p>
              </div>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700 dark:text-on-surface-variant">
              <p>
                A partir de agora, o sistema vai gerar o lançamento mensal de <strong>{cliente.descricao}</strong> direto no kanban, sem criar cobrança no Asaas e sem envio automático.
              </p>
              <p className="mt-3 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 p-3 rounded-lg">
                <strong>Importante:</strong> a assinatura ativa no Asaas <strong>NÃO será removida</strong>. Se quiser parar de cobrar pelo Asaas também, cancele a assinatura manualmente no painel deles.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#060e20] flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={() => setConfirmCobrancaAuto(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-on-surface-variant hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setForm({...form, cobranca_automatica: false}); setConfirmCobrancaAuto(null) }}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white shadow-sm active:scale-95 transition-all bg-amber-600 hover:bg-amber-700"
              >
                <Wallet size={14} /> Sim, desligar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
