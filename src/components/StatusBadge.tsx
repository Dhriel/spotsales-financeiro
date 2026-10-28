import { statusPagamentoConfig, statusEnvioConfig } from '../lib/utils'
import type { StatusPagamento, StatusEnvio, OrigemEnvio } from '../types'

export function StatusPagamentoBadge({ status }: { status: StatusPagamento }) {
  const config = statusPagamentoConfig[status]
  if (!config) return <span className="text-gray-400 text-xs">—</span>
  return (
    <span className={config.class}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
      {config.label}
    </span>
  )
}

export function StatusEnvioBadge({ status, origem }: { status: StatusEnvio | null; origem?: OrigemEnvio | null }) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>
  if (status === 'enviado' && origem === 'manual') {
    return <span className="badge-enviado-manual">Enviado</span>
  }
  const config = statusEnvioConfig[status]
  if (!config) return <span className="text-gray-400 text-xs">—</span>
  return <span className={config.class}>{config.label}</span>
}
