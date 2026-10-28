export interface Cliente {
  id: number
  id_empresa: number
  descricao: string
  contato: string
  whatsapp: string
  email: string
  cnpj_cpf: string
  dia_vencimento: number
  envia_nf: boolean
  forma_de_pgt?: string | null
  canais?: string | null
  valor?: number | null
  ativo?: boolean | null
  asaas_customer_id?: string | null
  cep?: string | null
  notificar?: boolean | null
  cobranca_automatica?: boolean
}

export interface LancamentoMensal {
  id: number
  cliente_id: number
  descricao: string | null
  data: string
  vencimento: string
  valor: number
  forma_pgt: string
  canais: string
  plataforma: string
  nf: string
  status_pagamento: StatusPagamento
  data_pagamento: string | null
  asaas_id?: string | null
  notificar_baixa?: boolean
}

export interface EnvioLancamento {
  id: number
  lancamento_id: number
  data_envio: string
  status_envio: StatusEnvio
  canal_envio: string
  observacao: string | null
  origem: OrigemEnvio
}

export type OrigemEnvio = 'automatico' | 'manual'

export type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
export type StatusEnvio = 'enviado' | 'erro' | 'nao_enviar'

export interface LancamentoComCliente extends LancamentoMensal {
  cliente: Cliente
  envios_count: number
  ultimo_envio: string | null
  ultimo_status_envio: StatusEnvio | null
  ultima_origem_envio: OrigemEnvio | null
  ultimo_template_envio: string | null
}

export interface KanbanCard {
  lancamento: LancamentoMensal
  cliente: Cliente
  envios_count: number
  ultimo_envio: string | null
  ultima_origem_envio: OrigemEnvio | null
  envios_origens: OrigemEnvio[]
  dias_vencimento: number
}

export interface DashboardStats {
  total_clientes: number
  total_lancamentos: number
  total_pago: number
  total_pendente: number
  total_atrasado: number
  valor_previsto: number
  valor_recebido: number
  total_envios: number
  clientes_com_envio: number
  clientes_sem_envio: number
}

export interface FiltrosState {
  mes: number | null
  ano: number | null
  dataInicio: string | null
  dataFim: string | null
  cliente: string
  status_pagamento: StatusPagamento | ''
  status_envio: StatusEnvio | ''
  forma_pgt: string
  plataforma: string
  canais: string
  envia_nf: string
  dia_vencimento: string
}
