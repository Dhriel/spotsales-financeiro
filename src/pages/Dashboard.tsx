import { useState } from 'react'
import {
  Users, FileText, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  DollarSign, Send, UserCheck, UserX, X,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts'
import { useDashboardStats, useLancamentos } from '../hooks/useSupabase'
import { formatCurrency, formatDate, getDefaultFilters, getDateRange } from '../lib/utils'
import { StatusPagamentoBadge } from '../components/StatusBadge'
import FilterBar from '../components/FilterBar'
import ClientesListModal from '../components/ClientesListModal'
import ClienteDetailModal from '../components/ClienteDetailModal'
import type { FiltrosState } from '../types'

export default function Dashboard() {
  const [filtros, setFiltros] = useState<FiltrosState>(getDefaultFilters())
  const [showClientes, setShowClientes] = useState(false)
  const [showLancamentos, setShowLancamentos] = useState<string | null>(null)
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const { stats, chartData, loading } = useDashboardStats(filtros)
  const { lancamentos } = useLancamentos(filtros)

  const lancamentosFiltrados = showLancamentos
    ? lancamentos.filter((l: any) => l.status_pagamento === showLancamentos)
    : []

  const statusLabels: Record<string, string> = {
    pago: 'Pagos',
    pendente: 'Pendentes',
    atrasado: 'Atrasados',
  }

  const handlePreset = (preset: string) => {
    const range = getDateRange(preset)
    setFiltros({
      ...filtros,
      mes: null,
      ano: null,
      dataInicio: range.start,
      dataFim: range.end,
    })
  }

  const cards = stats ? [
    { label: 'Total Clientes', value: stats.total_clientes, icon: Users, color: 'text-brand-700', bg: 'bg-brand-50', clickable: true, action: () => setShowClientes(true) },
    { label: 'Lançamentos', value: stats.total_lancamentos, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pagos', value: stats.total_pago, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', clickable: true, action: () => setShowLancamentos('pago') },
    { label: 'Pendentes', value: stats.total_pendente, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', clickable: true, action: () => setShowLancamentos('pendente') },
    { label: 'Atrasados', value: stats.total_atrasado, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', clickable: true, action: () => setShowLancamentos('atrasado') },
    { label: 'Valor Previsto', value: formatCurrency(stats.valor_previsto), icon: TrendingUp, color: 'text-brand-700', bg: 'bg-brand-50', big: true },
    { label: 'Valor Recebido', value: formatCurrency(stats.valor_recebido), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', big: true },
    { label: 'Total Envios', value: stats.total_envios, icon: Send, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Com Envio', value: stats.clientes_com_envio, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sem Envio', value: stats.clientes_sem_envio, icon: UserX, color: 'text-gray-500', bg: 'bg-gray-50' },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-brand-950">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Visão geral financeira da SpotSales</p>
      </div>

      {/* Filters */}
      <FilterBar filtros={filtros} onChange={setFiltros} onPreset={handlePreset} />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {cards.map((card: any) => (
              <div
                key={card.label}
                onClick={card.action ? card.action : undefined}
                className={`card hover:shadow-md transition-shadow group ${card.clickable ? 'cursor-pointer ring-1 ring-brand-200 hover:ring-brand-400' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${card.bg} group-hover:scale-110 transition-transform`}>
                    <card.icon size={18} className={card.color} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                  <p className={`font-bold text-brand-950 mt-0.5 ${card.big ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'}`}>
                    {card.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          {chartData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Revenue Bar Chart */}
              <div className="card">
                <h3 className="text-base font-semibold text-brand-950 mb-4">Receita por Período</h3>
                <div className="h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.monthlyData} barGap={4} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value)]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E9D5FF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="previsto" name="Previsto" fill="#DDD6FE" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="previsto" position="top" formatter={(v: number) => v > 0 ? `R$${(v/1000).toFixed(0)}k` : ''} style={{ fontSize: 10, fill: '#9ca3af' }} />
                      </Bar>
                      <Bar dataKey="recebido" name="Recebido" fill="#7C3AED" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="recebido" position="top" formatter={(v: number) => v > 0 ? `R$${(v/1000).toFixed(0)}k` : ''} style={{ fontSize: 10, fill: '#7C3AED' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Status Pie */}
              <div className="card">
                <h3 className="text-base font-semibold text-brand-950 mb-4">Status de Pagamento</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.statusChart.filter((d: any) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        strokeWidth={0}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                      >
                        {chartData.statusChart.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E9D5FF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payments per month */}
              <div className="card">
                <h3 className="text-base font-semibold text-brand-950 mb-4">Pagamentos por Período</h3>
                <div className="h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.monthlyData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E9D5FF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="pagamentos" name="Pagamentos" fill="#10b981" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="pagamentos" position="top" formatter={(v: number) => v > 0 ? `${v} pag.` : ''} style={{ fontSize: 10, fill: '#059669', fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Envio Status Pie */}
              <div className="card">
                <h3 className="text-base font-semibold text-brand-950 mb-4">Status de Envio</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.envioStatusChart.filter((d: any) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        strokeWidth={0}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                      >
                        {chartData.envioStatusChart.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E9D5FF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ClientesListModal open={showClientes} onClose={() => setShowClientes(false)} filtros={filtros} />

      {/* Modal de lançamentos por status */}
      {showLancamentos && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setShowLancamentos(null)} />
          <div className="relative w-full max-w-3xl mx-2 sm:mx-4 bg-white rounded-2xl shadow-2xl border border-brand-100/50 z-10 animate-scale-in">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-brand-100/50" style={{ background: 'linear-gradient(135deg, #7C3AED08, #5B21B608)' }}>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-brand-950">
                  Lançamentos {statusLabels[showLancamentos] || showLancamentos}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{lancamentosFiltrados.length} lançamentos</p>
              </div>
              <button onClick={() => setShowLancamentos(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
              {lancamentosFiltrados.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Nenhum lançamento encontrado</p>
              ) : (
                <div className="space-y-2">
                  {lancamentosFiltrados.map((l: any) => (
                    <div
                      key={l.id}
                      onClick={() => { setSelectedClienteId(l.cliente_id); setShowLancamentos(null) }}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-brand-100/50 hover:bg-brand-50/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-brand-950 truncate">{l.descricao || l.cliente?.descricao || '—'}</p>
                          <p className="text-xs text-gray-500">Venc: {formatDate(l.vencimento)} · {l.forma_pgt || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <StatusPagamentoBadge status={l.status_pagamento} />
                        <span className="text-sm font-bold text-brand-700">{formatCurrency(l.valor)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ClienteDetailModal clienteId={selectedClienteId} onClose={() => setSelectedClienteId(null)} />
    </div>
  )
}
