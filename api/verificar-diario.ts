// Roda todo dia às 11h (Brasília) via Vercel Cron: lista os lançamentos que vencem hoje,
// ainda em aberto e sem nenhum envio registrado (só clientes com envio automático), e manda para o webhook do n8n.
const WEBHOOK_URL = 'https://n8n.spotsales.ai/webhook/f5cd2f33-7738-verificardiario'

export default async function handler(req: any, res: any) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return res.status(500).json({ error: 'SUPABASE_URL/SUPABASE_ANON_KEY não configuradas' })

  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Accept-Profile': 'spotsales' }
  const get = async (path: string) => {
    const r = await fetch(`${url}/rest/v1/${path}`, { headers })
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`)
    return r.json()
  }

  try {
    // Data de hoje em Brasília (UTC-3)
    const hoje = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const lancs: any[] = await get(
      `lancamentos_mensais?select=id,cliente_id,vencimento,valor,forma_pgt,canais,status_pagamento,cliente:clientes(descricao,contato,whatsapp,email,ativo,cobranca_automatica)` +
        `&vencimento=eq.${hoje}&status_pagamento=in.(pendente,atrasado)`
    )
    const ativos = lancs.filter((l) => l.cliente?.ativo !== false && l.cliente?.cobranca_automatica !== false)

    let semEnvio = ativos
    if (ativos.length > 0) {
      const envios: any[] = await get(
        `envios_lancamentos?select=lancamento_id&lancamento_id=in.(${ativos.map((l) => l.id).join(',')})&limit=5000`
      )
      const comEnvio = new Set(envios.map((e) => e.lancamento_id))
      semEnvio = ativos.filter((l) => !comEnvio.has(l.id))
    }

    const clientes = semEnvio.map((l) => ({
      lancamento_id: l.id,
      cliente_id: l.cliente_id,
      empresa: l.cliente?.descricao ?? null,
      contato: l.cliente?.contato ?? null,
      whatsapp: l.cliente?.whatsapp ?? null,
      email: l.cliente?.email ?? null,
      vencimento: l.vencimento,
      valor: l.valor,
      forma_pgt: l.forma_pgt,
      canais: l.canais,
    }))

    // Só avisa quando há alguém sem envio
    if (clientes.length === 0) return res.status(200).json({ data: hoje, total: 0, enviado: false })

    const r = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento: 'verificacao_diaria_envios', data: hoje, hora: '11:00', total: clientes.length, clientes }),
    })
    return res.status(r.ok ? 200 : 502).json({ data: hoje, total: clientes.length, enviado: r.ok, webhook_status: r.status })
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message ?? e) })
  }
}
