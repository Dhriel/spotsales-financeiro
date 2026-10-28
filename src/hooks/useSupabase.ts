import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  Cliente,
  LancamentoMensal,
  EnvioLancamento,
  LancamentoComCliente,
  DashboardStats,
  FiltrosState,
} from '../types'
import { getDateRange } from '../lib/utils'

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('clientes').select('*').order('descricao')
    setClientes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { clientes, loading, refetch: fetch }
}

export function useLancamentos(filtros: FiltrosState) {
  const [lancamentos, setLancamentos] = useState<LancamentoComCliente[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    let startDate: string
    let endDate: string

    if (filtros.dataInicio && filtros.dataFim) {
      startDate = filtros.dataInicio
      endDate = filtros.dataFim
    } else if (filtros.mes && filtros.ano) {
      const m = filtros.mes.toString().padStart(2, '0')
      startDate = `${filtros.ano}-${m}-01`
      const lastDay = new Date(filtros.ano, filtros.mes, 0).getDate()
      endDate = `${filtros.ano}-${m}-${lastDay}`
    } else {
      const range = getDateRange('this_month')
      startDate = range.start
      endDate = range.end
    }

    let query = supabase
      .from('lancamentos_mensais')
      .select('*, cliente:clientes(*)')
      .gte('vencimento', startDate)
      .lte('vencimento', endDate)
      .order('vencimento', { ascending: true })

    if (filtros.status_pagamento) {
      query = query.eq('status_pagamento', filtros.status_pagamento)
    }
    if (filtros.plataforma) {
      query = query.eq('plataforma', filtros.plataforma)
    }

    const { data: lancamentosData } = await query

    if (!lancamentosData) {
      setLancamentos([])
      setLoading(false)
      return
    }

    const lancIds = lancamentosData.map((l: any) => l.id)

    let enviosMap: Record<number, { count: number; ultimo: string | null; status: string | null; origem: string | null; template: string | null }> = {}

    if (lancIds.length > 0) {
      const { data: enviosData } = await supabase
        .from('envios_lancamentos')
        .select('*')
        .in('lancamento_id', lancIds)
        .order('data_envio', { ascending: false })

      if (enviosData) {
        for (const e of enviosData) {
          if (!enviosMap[e.lancamento_id]) {
            enviosMap[e.lancamento_id] = { count: 0, ultimo: null, status: null, origem: null, template: null }
          }
          enviosMap[e.lancamento_id].count++
          if (!enviosMap[e.lancamento_id].ultimo) {
            enviosMap[e.lancamento_id].ultimo = e.data_envio
            enviosMap[e.lancamento_id].status = e.status_envio
            enviosMap[e.lancamento_id].origem = e.origem
            enviosMap[e.lancamento_id].template = e.observacao
          }
        }
      }
    }

    let result: LancamentoComCliente[] = lancamentosData
      .filter((l: any) => l.cliente?.ativo !== false)
      .map((l: any) => ({
        ...l,
        cliente: l.cliente,
        envios_count: enviosMap[l.id]?.count || 0,
        ultimo_envio: enviosMap[l.id]?.ultimo || null,
        ultimo_status_envio: enviosMap[l.id]?.status || null,
        ultima_origem_envio: enviosMap[l.id]?.origem || null,
        ultimo_template_envio: enviosMap[l.id]?.template || null,
      }))

    if (filtros.envia_nf) {
      const envNfValue = filtros.envia_nf === 'true'
      result = result.filter((l: any) => l.cliente?.envia_nf === envNfValue)
    }

    if (filtros.canais) {
      result = result.filter((l: any) => l.cliente?.canais === filtros.canais)
    }

    if (filtros.forma_pgt) {
      result = result.filter((l: any) => l.cliente?.forma_de_pgt === filtros.forma_pgt)
    }

    if (filtros.status_envio) {
      result = result.filter((l: any) => l.ultimo_status_envio === filtros.status_envio)
    }

    if (filtros.dia_vencimento) {
      const diaVenc = parseInt(filtros.dia_vencimento)
      result = result.filter((l: any) => l.cliente?.dia_vencimento === diaVenc)
    }

    if (filtros.cliente) {
      const search = filtros.cliente.toLowerCase()
      const filtered = result.filter(
        (l) => l.cliente?.descricao?.toLowerCase().includes(search)
      )
      setLancamentos(filtered)
    } else {
      setLancamentos(result)
    }

    setLoading(false)
  }, [filtros])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { lancamentos, loading, refetch: fetch }
}

export function useClienteDetail(clienteId: number | null) {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [lancamentos, setLancamentos] = useState<LancamentoMensal[]>([])
  const [envios, setEnvios] = useState<Record<number, EnvioLancamento[]>>({})
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!clienteId) return
    setLoading(true)

    const { data: clienteData } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single()

    setCliente(clienteData)

    const { data: lancData } = await supabase
      .from('lancamentos_mensais')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('vencimento', { ascending: false })

    setLancamentos(lancData || [])

    if (lancData && lancData.length > 0) {
      const ids = lancData.map((l: any) => l.id)
      const { data: enviosData } = await supabase
        .from('envios_lancamentos')
        .select('*')
        .in('lancamento_id', ids)
        .order('data_envio', { ascending: false })

      const enviosGrouped: Record<number, EnvioLancamento[]> = {}
      if (enviosData) {
        for (const e of enviosData) {
          if (!enviosGrouped[e.lancamento_id]) enviosGrouped[e.lancamento_id] = []
          enviosGrouped[e.lancamento_id].push(e)
        }
      }
      setEnvios(enviosGrouped)
    }

    setLoading(false)
  }, [clienteId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { cliente, lancamentos, envios, loading, refetch: fetchData }
}

export function useDashboardStats(filtros: FiltrosState) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      setLoading(true)

      let startDate: string
      let endDate: string

      if (filtros.dataInicio && filtros.dataFim) {
        startDate = filtros.dataInicio
        endDate = filtros.dataFim
      } else if (filtros.mes && filtros.ano) {
        const m = filtros.mes.toString().padStart(2, '0')
        startDate = `${filtros.ano}-${m}-01`
        const lastDay = new Date(filtros.ano, filtros.mes, 0).getDate()
        endDate = `${filtros.ano}-${m}-${lastDay}`
      } else {
        const range = getDateRange('this_month')
        startDate = range.start
        endDate = range.end
      }

      let { data: clientesData } = await supabase.from('clientes').select('*').neq('ativo', false)
      let clientes = clientesData || []

      if (filtros.envia_nf) {
        const envNfValue = filtros.envia_nf === 'true'
        clientes = clientes.filter((c: any) => c.envia_nf === envNfValue)
      }

      if (filtros.canais) {
        clientes = clientes.filter((c: any) => c.canais === filtros.canais)
      }

      if (filtros.forma_pgt) {
        clientes = clientes.filter((c: any) => c.forma_de_pgt === filtros.forma_pgt)
      }

      if (filtros.dia_vencimento) {
        const diaVenc = parseInt(filtros.dia_vencimento)
        clientes = clientes.filter((c: any) => c.dia_vencimento === diaVenc)
      }

      const clienteIds = clientes.map((c: any) => c.id)
      const totalClientes = clientes.length

      let lancQuery = supabase
        .from('lancamentos_mensais')
        .select('*, cliente:clientes(id, descricao, envia_nf, dia_vencimento)')
        .gte('vencimento', startDate)
        .lte('vencimento', endDate)

      if (clienteIds.length > 0) {
        lancQuery = lancQuery.in('cliente_id', clienteIds)
      } else {
        lancQuery = lancQuery.in('cliente_id', [-1])
      }

      if (filtros.status_pagamento) {
        lancQuery = lancQuery.eq('status_pagamento', filtros.status_pagamento)
      }
      if (filtros.plataforma) {
        lancQuery = lancQuery.eq('plataforma', filtros.plataforma)
      }

      const { data: lancData } = await lancQuery

      let lancs = lancData || []

      const lancIdsInitial = lancs.map((l: any) => l.id)
      let enviosData: any[] = []
      if (lancIdsInitial.length > 0) {
        const { data } = await supabase
          .from('envios_lancamentos')
          .select('*')
          .in('lancamento_id', lancIdsInitial)
        enviosData = data || []
      }

      if (filtros.status_envio) {
        const lancIdsComEnvioStatus = new Set(
          enviosData
            .filter((e: any) => e.status_envio === filtros.status_envio)
            .map((e: any) => e.lancamento_id)
        )
        lancs = lancs.filter((l: any) => lancIdsComEnvioStatus.has(l.id))
        const lancIdsFiltrados = new Set(lancs.map((l: any) => l.id))
        enviosData = enviosData.filter((e: any) => lancIdsFiltrados.has(e.lancamento_id))
      }

      const totalLancamentos = lancs.length
      const pagos = lancs.filter((l: any) => l.status_pagamento === 'pago')
      const pendentes = lancs.filter((l: any) => l.status_pagamento === 'pendente')
      const atrasados = lancs.filter((l: any) => l.status_pagamento === 'atrasado')

      const valorPrevisto = lancs.reduce((s: number, l: any) => s + (l.valor || 0), 0)
      const valorRecebido = pagos.reduce((s: number, l: any) => s + (l.valor || 0), 0)

      const clientesComEnvio = new Set(
        enviosData.map((e: any) => {
          const lanc = lancs.find((l: any) => l.id === e.lancamento_id)
          return lanc?.cliente_id
        }).filter(Boolean)
      )

      setStats({
        total_clientes: totalClientes,
        total_lancamentos: totalLancamentos,
        total_pago: pagos.length,
        total_pendente: pendentes.length,
        total_atrasado: atrasados.length,
        valor_previsto: valorPrevisto,
        valor_recebido: valorRecebido,
        total_envios: enviosData.length,
        clientes_com_envio: clientesComEnvio.size,
        clientes_sem_envio: totalClientes - clientesComEnvio.size,
      })

      // Chart data - status pagamento
      const statusChart = [
        { name: 'Pago', value: pagos.length, fill: '#10b981' },
        { name: 'Pendente', value: pendentes.length, fill: '#f59e0b' },
        { name: 'Atrasado', value: atrasados.length, fill: '#ef4444' },
        { name: 'Cancelado', value: lancs.filter((l: any) => l.status_pagamento === 'cancelado').length, fill: '#9ca3af' },
      ]

      // Chart data - envios por status
      const envioEnviado = enviosData.filter((e: any) => e.status_envio === 'enviado').length
      const envioErro = enviosData.filter((e: any) => e.status_envio === 'erro').length
      const envioNao = enviosData.filter((e: any) => e.status_envio === 'nao_enviar').length

      const envioStatusChart = [
        { name: 'Enviado', value: envioEnviado, fill: '#3b82f6' },
        { name: 'Erro', value: envioErro, fill: '#ef4444' },
        { name: 'Não Enviar', value: envioNao, fill: '#9ca3af' },
      ]

      // Monthly revenue (last 6 months)
      const monthlyData: { month: string; recebido: number; previsto: number; pagamentos: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const mStr = d.toLocaleString('pt-BR', { month: 'short' })
        const mStart = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01`
        const mEnd = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`

        const mLancs = lancs.filter((l: any) => l.vencimento >= mStart && l.vencimento <= mEnd)
        const mPagos = mLancs.filter((l: any) => l.status_pagamento === 'pago')

        monthlyData.push({
          month: mStr,
          recebido: mPagos.reduce((s: number, l: any) => s + (l.valor || 0), 0),
          previsto: mLancs.reduce((s: number, l: any) => s + (l.valor || 0), 0),
          pagamentos: mPagos.length,
        })
      }

      setChartData({ statusChart, envioStatusChart, monthlyData })
      setLoading(false)
    }

    fetch()
  }, [filtros])

  return { stats, chartData, loading }
}

export function useKanbanData() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    async function fetch() {
      // Recarga após um envio não deve piscar o spinner
      if (tick === 0) setLoading(true)

      const today = new Date()
      const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
      const endStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${lastDay}`

      const { data: lancData } = await supabase
        .from('lancamentos_mensais')
        .select('*, cliente:clientes(*)')
        .neq('status_pagamento', 'pago')
        .neq('status_pagamento', 'cancelado')
        .gte('vencimento', startStr)
        .lte('vencimento', endStr)
        .order('vencimento', { ascending: true })

      if (!lancData) {
        setData([])
        setLoading(false)
        return
      }

      const lancIds = lancData.map((l: any) => l.id)
      let enviosMap: Record<number, { count: number; ultimo: string | null; ultimo_status_envio: string | null; origem: string | null; origens: string[] }> = {}

      if (lancIds.length > 0) {
        const { data: enviosData } = await supabase
          .from('envios_lancamentos')
          .select('*')
          .in('lancamento_id', lancIds)
          .order('data_envio', { ascending: false })

        if (enviosData) {
          for (const e of enviosData) {
            if (!enviosMap[e.lancamento_id]) {
              enviosMap[e.lancamento_id] = { count: 0, ultimo: null, ultimo_status_envio: null, origem: null, origens: [] }
            }
            enviosMap[e.lancamento_id].count++
            // Lista vem do mais novo para o mais antigo; unshift deixa em ordem cronológica
            enviosMap[e.lancamento_id].origens.unshift(e.origem)
            if (!enviosMap[e.lancamento_id].ultimo) {
              enviosMap[e.lancamento_id].ultimo = e.data_envio
              enviosMap[e.lancamento_id].ultimo_status_envio = e.status_envio
              enviosMap[e.lancamento_id].origem = e.origem
            }
          }
        }
      }

      const result = lancData
        .filter((l: any) => l.cliente?.ativo !== false)
        .map((l: any) => ({
          lancamento: l,
          cliente: l.cliente,
          envios_count: enviosMap[l.id]?.count || 0,
          ultimo_envio: enviosMap[l.id]?.ultimo || null,
          ultimo_status_envio: enviosMap[l.id]?.ultimo_status_envio || null,
          ultima_origem_envio: enviosMap[l.id]?.origem || null,
          envios_origens: enviosMap[l.id]?.origens || [],
        }))

      setData(result)
      setLoading(false)
    }

    fetch()
  }, [tick])

  return { data, loading, refetch: () => setTick((t) => t + 1) }
}
