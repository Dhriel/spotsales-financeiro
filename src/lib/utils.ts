import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { StatusPagamento, StatusEnvio, FiltrosState } from '../types'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatMonthYear(date: string | null): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), "MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatDateShort(date: string | null): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd/MM', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function getMonthName(month: number): string {
  const d = new Date(2024, month - 1, 1)
  return format(d, 'MMMM', { locale: ptBR })
}

export function diasParaVencimento(vencimento: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = parseISO(vencimento)
  venc.setHours(0, 0, 0, 0)
  return differenceInDays(venc, hoje)
}

export function getKanbanColumn(vencimento: string, ultimoStatusEnvio: string | null, enviosCount: number = 0): string {
  const dias = diasParaVencimento(vencimento)
  if (dias >= 1 && dias <= 5 && enviosCount >= 1 && ultimoStatusEnvio === 'enviado') return 'lembrete_antecipado'
  if (dias >= 1) return 'a_vencer'
  if (dias === 0) return 'vence_hoje'
  if (dias === -1) return '1_dia_atrasado'
  if (dias === -2) return '2_dias_atrasado'
  if (dias === -3) return '3_dias_atrasado'
  if (dias === -4) return '4_dias_atrasado'
  if (dias <= -5) return 'conta_suspensa'
  return ''
}

export const kanbanColumns = [
  { id: 'a_vencer', title: 'A Vencer', color: 'bg-cyan-500', lightColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { id: 'lembrete_antecipado', title: 'Lembrete Antecipado', color: 'bg-blue-500', lightColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'vence_hoje', title: 'Vence Hoje', color: 'bg-amber-500', lightColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: '1_dia_atrasado', title: '1 dia Atrasado', color: 'bg-orange-500', lightColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: '2_dias_atrasado', title: '2 dias Atrasado', color: 'bg-orange-600', lightColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: '3_dias_atrasado', title: '3 dias Atrasado', color: 'bg-red-400', lightColor: 'bg-red-50', borderColor: 'border-red-200' },
  { id: '4_dias_atrasado', title: '4 dias Atrasado', color: 'bg-red-500', lightColor: 'bg-red-50', borderColor: 'border-red-200' },
  { id: 'conta_suspensa', title: 'Conta Suspensa', color: 'bg-gray-700', lightColor: 'bg-gray-50', borderColor: 'border-gray-300' },
]

export const statusPagamentoConfig: Record<StatusPagamento, { label: string; class: string; dot: string }> = {
  pago: { label: 'Pago', class: 'badge-pago', dot: 'bg-emerald-500' },
  pendente: { label: 'Pendente', class: 'badge-pendente', dot: 'bg-amber-500' },
  atrasado: { label: 'Atrasado', class: 'badge-atrasado', dot: 'bg-red-500' },
  cancelado: { label: 'Cancelado', class: 'badge-cancelado', dot: 'bg-gray-400' },
}

export const statusEnvioConfig: Record<StatusEnvio, { label: string; class: string }> = {
  enviado: { label: 'Enviado', class: 'badge-enviado' },
  erro: { label: 'Erro', class: 'badge-erro' },
  nao_enviar: { label: 'Não Enviar', class: 'badge-nao_enviar' },
}

export function getDefaultFilters(): FiltrosState {
  const now = new Date()
  return {
    mes: now.getMonth() + 1,
    ano: now.getFullYear(),
    dataInicio: null,
    dataFim: null,
    cliente: '',
    status_pagamento: '',
    status_envio: '',
    forma_pgt: '',
    plataforma: '',
    canais: '',
    envia_nf: '',
    dia_vencimento: '',
  }
}

export function getDateRange(preset: string): { start: string; end: string } {
  const now = new Date()
  switch (preset) {
    case 'today':
      return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') }
    case 'this_month':
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
    case 'last_month': {
      const last = subMonths(now, 1)
      return { start: format(startOfMonth(last), 'yyyy-MM-dd'), end: format(endOfMonth(last), 'yyyy-MM-dd') }
    }
    case 'last_3_months': {
      const m3 = subMonths(now, 2)
      return { start: format(startOfMonth(m3), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
    }
    case 'this_year':
      return { start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
    default:
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') }
  }
}
