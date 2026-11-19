import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, FileText, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  DollarSign, Send, UserCheck, UserX, X,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts'
import { useDashboardStats, useLancamentos } from '../hooks/useSupabase'
import { formatCurrency, formatDate, getDefaultFilters, getDateRange } from '../lib/utils'
import { StatusPagamentoBadge } from '../components/StatusBadge'
import { CanalBadges, FormaBadge, OrigemBadge, SituacaoEnvioBadge } from '../components/DetalhesBadges'
import FilterBar from '../components/FilterBar'
import ClientesListModal from '../components/ClientesListModal'
import ClienteDetailModal from '../components/ClienteDetailModal'
import type { FiltrosState } from '../types'

export default function Dashboard() {
  const [filtros, setFiltros] = useState<FiltrosState>(getDefaultFilters())
  const [showClientes, setShowClientes] = useState(false)
  const [showLancamentos, setShowLancamentos] = useState<string | null>(null)
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const [mesesGrafico, setMesesGrafico] = useState(12)
  const { stats, chartData, chartError, loading } = useDashboardStats(filtros, mesesGrafico)
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
                <div className="flex items-center justify-between gap-3 mb-2"><h3 className="text-base font-semibold text-brand-950">Receita por Período</h3><select aria-label="Período dos gráficos financeiros" value={mesesGrafico} onChange={e => setMesesGrafico(Number(e.target.value))} className="border rounded-lg px-2 py-1 text-sm"><option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option><option value={24}>Últimos 24 meses</option></select></div><p className="text-xs text-gray-500 mb-3">Visão geral independente dos filtros acima. Previsto pelo vencimento; recebido pela data do pagamento.</p>{chartError && <p role="alert" className="text-red-600 text-sm">{chartError}</p>}
                <div className="h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.monthlyData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value)]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E9D5FF', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      />
                      <Legend />
                      <Line type="linear" dataKey="previsto" name="Previsto" stroke="#A78BFA" strokeWidth={2} dot={false} />
                      <Line type="linear" dataKey="recebido" name="Recebido" stroke="#6D28D9" strokeWidth={2} dot={false} />
                    </LineChart>
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
                <h3 className="text-base font-semibold text-brand-950 mb-2">Pagamentos por Período</h3><p className="text-xs text-gray-500 mb-3">Quantidade por data efetiva de pagamento, no período selecionado acima.</p>
                {chartError ? <p role="alert" className="text-sm text-red-700 mb-3">{chartError}</p> : <div className="inline-flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-2 mb-3"><span aria-hidden="true">💰</span><div><p className="text-xs text-emerald-700">Total recebido no período</p><p className="text-lg font-bold text-emerald-800">{formatCurrency(chartData.monthlyData.reduce((total: number, mes: any) => total + mes.recebido, 0))}</p></div></div>}
                {chartData.semDataPagamento > 0 && <p className="text-xs text-amber-700 mb-2">{chartData.semDataPagamento} lançamento(s) pago(s) sem data de pagamento não entram nos valores recebidos.</p>}
                <div className="h-56 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.monthlyData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="rounded-xl border border-brand-100 bg-white px-4 py-3 shadow-lg text-sm"><p className="font-semibold text-brand-950 mb-1">{label}</p><p className="text-gray-600">Pagamentos: {payload[0].payload.pagamentos}</p><p className="font-semibold text-emerald-700">Total recebido: {formatCurrency(payload[0].payload.recebido)}</p></div> : null} />
                      <Bar dataKey="pagamentos" name="Pagamentos" fill="#10b981" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="pagamentos" position="top" formatter={(v: number) => v > 0 ? `${v} pag.` : ''} style={{ fontSize: 10, fill: '#059669', fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card space-y-4">
                <div><h3 className="text-base font-semibold text-brand-950">Precisam de atenção</h3><p className="text-xs text-gray-500 mt-1">Erros associados aos lançamentos do filtro acima.</p></div>
                <Link to="/monitoramento" className="flex justify-between items-center rounded-lg bg-red-50 text-red-800 px-3 py-3 text-sm"><span>Envios registrados com erro</span><strong>{chartData.erros}</strong></Link>
                <p className="text-xs text-gray-500">Consulte o monitoramento para revisar pendências e resultados incertos. Os registros dependem do fluxo de envio.</p>
                <Link to="/monitoramento" className="text-sm text-brand-700 font-medium">Abrir monitoramento →</Link>
              </div>
              <div className="card lg:col-span-2">
                <div className="flex justify-between items-center mb-3"><div><h3 className="text-base font-semibold text-brand-950">Atividades recentes</h3><p className="text-xs text-gray-500">Últimos registros de envio, independentemente dos filtros.</p></div><Link className="text-sm text-brand-700" to="/monitoramento">Ver todos →</Link></div>
                {chartData.erroAtividades ? <p className="text-sm text-red-700">Não foi possível carregar as atividades.</p> : chartData.atividades.length === 0 ? <p className="text-sm text-gray-500">Nenhuma atividade registrada.</p> : <ul className="space-y-2">{chartData.atividades.map((e: any) => <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm"><div className="flex min-w-0 items-start gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg">👤</span><div className="min-w-0"><p className="font-semibold text-brand-950 truncate">{e.lancamento?.cliente?.descricao || e.lancamento?.descricao || 'Cliente não identificado'}</p><div className="mt-2 flex flex-wrap gap-1.5"><CanalBadges canal={e.canal_envio} /><FormaBadge forma={e.lancamento?.forma_pgt} /><OrigemBadge origem={e.origem} /><SituacaoEnvioBadge status={e.status_envio} />{e.lancamento?.status_pagamento && <StatusPagamentoBadge status={e.lancamento.status_pagamento} />}</div></div></div><time className="text-xs text-gray-500 whitespace-nowrap">{e.data_envio ? new Date(e.data_envio).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}) : '—'}</time></li>)}</ul>}
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
