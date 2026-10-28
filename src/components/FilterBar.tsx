import { useState } from 'react'
import { Search, Filter, Calendar, ChevronDown, X } from 'lucide-react'
import type { FiltrosState } from '../types'

interface FilterBarProps {
  filtros: FiltrosState
  onChange: (f: FiltrosState) => void
  onPreset: (preset: string) => void
}

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

const presets = [
  { id: 'today', label: 'Hoje' },
  { id: 'this_month', label: 'Este mês' },
  { id: 'last_month', label: 'Mês passado' },
  { id: 'last_3_months', label: 'Últimos 3 meses' },
  { id: 'this_year', label: 'Este ano' },
]

export default function FilterBar({ filtros, onChange, onPreset }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const update = (key: keyof FiltrosState, value: any) => {
    onChange({ ...filtros, [key]: value })
  }

  const hasActiveFilters =
    filtros.status_pagamento ||
    filtros.status_envio ||
    filtros.forma_pgt ||
    filtros.plataforma ||
    filtros.canais ||
    filtros.envia_nf ||
    filtros.dia_vencimento

  return (
    <div className="space-y-3">
      {/* Top row: search + presets + month/year */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={filtros.cliente}
            onChange={(e) => update('cliente', e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-brand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
          />
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => onPreset(p.id)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium rounded-lg border border-brand-200 bg-white text-gray-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 transition-all whitespace-nowrap"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Month/Year selectors */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={filtros.mes || ''}
              onChange={(e) => update('mes', e.target.value ? Number(e.target.value) : null)}
              className="pl-8 pr-8 py-2.5 bg-white border border-brand-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 cursor-pointer"
            >
              <option value="">Todos os meses</option>
              {meses.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filtros.ano || ''}
              onChange={(e) => update('ano', e.target.value ? Number(e.target.value) : null)}
              className="pl-3 pr-8 py-2.5 bg-white border border-brand-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Advanced filter toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border transition-all
            ${hasActiveFilters
              ? 'bg-brand-700 text-white border-brand-700'
              : 'bg-white text-gray-600 border-brand-200 hover:bg-brand-50 hover:text-brand-700'
            }
          `}
        >
          <Filter size={14} />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 w-5 h-5 bg-white/20 rounded-full text-[10px] flex items-center justify-center font-bold">
              {[filtros.status_pagamento, filtros.status_envio, filtros.forma_pgt, filtros.plataforma, filtros.canais, filtros.envia_nf, filtros.dia_vencimento].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="bg-white rounded-xl border border-brand-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-950">Filtros Avançados</h3>
            {hasActiveFilters && (
              <button
                onClick={() =>
                  onChange({
                    ...filtros,
                    status_pagamento: '',
                    status_envio: '',
                    forma_pgt: '',
                    plataforma: '',
                    canais: '',
                    envia_nf: '',
                    dia_vencimento: '',
                  })
                }
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <X size={12} /> Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <FilterSelect
              label="Status Pagamento"
              value={filtros.status_pagamento}
              onChange={(v) => update('status_pagamento', v)}
              options={[
                { value: 'pago', label: 'Pago' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'atrasado', label: 'Atrasado' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />
            <FilterSelect
              label="Status Envio"
              value={filtros.status_envio}
              onChange={(v) => update('status_envio', v)}
              options={[
                { value: 'enviado', label: 'Enviado' },
                { value: 'erro', label: 'Erro' },
                { value: 'nao_enviar', label: 'Não Enviar' },
              ]}
            />
            <FilterSelect
              label="Forma de Pagamento"
              value={filtros.forma_pgt}
              onChange={(v) => update('forma_pgt', v)}
              options={[
                { value: 'Pix', label: 'Pix' },
                { value: 'Boleto', label: 'Boleto' },
                { value: 'Cartão', label: 'Cartão' },
              ]}
            />
            <FilterInput label="Plataforma" value={filtros.plataforma} onChange={(v) => update('plataforma', v)} placeholder="Ex: Hotmart" />
            <FilterSelect
              label="Canais"
              value={filtros.canais}
              onChange={(v) => update('canais', v)}
              options={[
                { value: 'WhatsApp', label: 'WhatsApp' },
                { value: 'Email', label: 'Email' },
                { value: 'WhatsApp e Email', label: 'WhatsApp e Email' },
              ]}
            />
            <FilterSelect
              label="Envia NF"
              value={filtros.envia_nf}
              onChange={(v) => update('envia_nf', v)}
              options={[
                { value: 'true', label: 'Sim' },
                { value: 'false', label: 'Não' },
              ]}
            />
            <FilterInput label="Dia Vencimento" value={filtros.dia_vencimento} onChange={(v) => update('dia_vencimento', v)} placeholder="Ex: 10" />
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-brand-50/50 border border-brand-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 cursor-pointer"
        >
          <option value="">Todos</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function FilterInput({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-brand-50/50 border border-brand-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
      />
    </div>
  )
}
