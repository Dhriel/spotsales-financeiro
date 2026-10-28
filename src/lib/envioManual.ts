import { formatCurrency, formatDate } from './utils'
import { supabase } from './supabase'
import type { Cliente, LancamentoMensal } from '../types'

// Webhook do n8n que dispara a mensagem.
export const ENVIOS_WEBHOOK_URL = 'https://n8n.spotsales.ai/webhook/d85c68dd-envia-disparo-cobranca'

export type Canal = 'whatsapp' | 'email'

// Variáveis posicionais dos templates: vars[0] preenche {{1}}, vars[1] preenche {{2}}, ...
type VarNome = 'nome' | 'valor' | 'vencimento' | 'empresa' | 'link'

export interface Template {
  id: string
  label: string
  vars: VarNome[]
  // WhatsApp (template aprovado): {{n}} = vars[n-1]
  texto: string
  // E-mail: mesmo conteúdo em HTML. {{n}} = vars[n-1]; o link de pagamento fica como {link},
  // para o n8n substituir pela variável do link.
  assunto: string
  html: string
}

const P = (conteudo: string) => `<p>${conteudo}</p>`

export const TEMPLATES: Template[] = [
  {
    id: 'cobranca_antecipada',
    label: 'Cobrança antecipada',
    vars: ['nome', 'valor', 'vencimento', 'empresa', 'link'],
    texto:
      'Olá {{1}}, tudo bem?\n\nGostaríamos de solicitar o pagamento referente à mensalidade da plataforma + suporte.\n\n💳 *Valor:* {{2}}\n📅 *Vencimento:* {{3}}\n👤 *Empresa:* {{4}}\n\nPara facilitar, seguem os dados de pagamento:\n👉{{5}}\n\nQualquer dúvida, estamos à disposição!',
    assunto: 'Mensalidade Spotsales a vencer',
    html: ([
      P('Olá {{1}}, tudo bem?'),
      P('Gostaríamos de solicitar o pagamento referente à mensalidade da plataforma + suporte.'),
      P('💳 <strong>Valor:</strong> {{2}}<br>📅 <strong>Vencimento:</strong> {{3}}<br>👤 <strong>Empresa:</strong> {{4}}'),
      P('Para facilitar, seguem os dados de pagamento:<br>👉 {link}'),
      P('Qualquer dúvida, estamos à disposição!'),
    ].join('\n')),
  },
  {
    id: 'vencehoje_pix',
    label: 'Vence hoje',
    vars: ['nome', 'valor', 'vencimento', 'empresa', 'link'],
    texto:
      'Olá {{1}}! Tudo bem? 👋\n\nPassando só pra lembrar que hoje é o vencimento da sua assinatura da Spotsales.\n\n💳 *Valor:* {{2}}\n📅 *Vencimento:* {{3}}\n👤 *Empresa:* {{4}}\n\nPara facilitar, seguem os dados de pagamento:\n{{5}}\n\nQualquer dúvida, estamos à disposição!',
    assunto: 'Sua assinatura Spotsales vence hoje',
    html: ([
      P('Olá {{1}}! Tudo bem? 👋'),
      P('Passando só pra lembrar que hoje é o vencimento da sua assinatura da Spotsales.'),
      P('💳 <strong>Valor:</strong> {{2}}<br>📅 <strong>Vencimento:</strong> {{3}}<br>👤 <strong>Empresa:</strong> {{4}}'),
      P('Para facilitar, seguem os dados de pagamento:<br>{link}'),
      P('Qualquer dúvida, estamos à disposição!'),
    ].join('\n')),
  },
  {
    id: 'atraso_1dia',
    label: 'Atraso 1 dia',
    vars: ['nome', 'vencimento', 'link'],
    texto:
      'Oi {{1}}, bom dia!\n\nNotamos que o pagamento da sua assinatura ainda não foi identificado. O vencimento foi ontem ({{2}}).\n\nSe precisar do link de pagamento novamente, aqui está:\n👉 {{3}}\n\nQualquer dúvida, estamos à disposição!',
    assunto: 'Pagamento da assinatura não identificado',
    html: ([
      P('Oi {{1}}, bom dia!'),
      P('Notamos que o pagamento da sua assinatura ainda não foi identificado. O vencimento foi ontem ({{2}}).'),
      P('Se precisar do link de pagamento novamente, aqui está:<br>👉 {link}'),
      P('Qualquer dúvida, estamos à disposição!'),
    ].join('\n')),
  },
  {
    id: 'atraso_2dia',
    label: 'Atraso 2 dias',
    vars: ['nome', 'link'],
    texto:
      'Olá {{1}}! Como você está?\n\nEstamos passando para lembrar que sua fatura está em aberto há dois dias.\n\n👉 {{2}}\n\nPara evitar a suspensão do serviço, pedimos que regularize o quanto antes',
    assunto: 'Fatura em aberto - Spotsales',
    html: ([
      P('Olá {{1}}! Como você está?'),
      P('Estamos passando para lembrar que sua fatura está em aberto há dois dias.'),
      P('👉 {link}'),
      P('Para evitar a suspensão do serviço, pedimos que regularize o quanto antes'),
    ].join('\n')),
  },
  {
    id: 'atraso_3dia',
    label: 'Atraso 3 dias',
    vars: ['nome', 'link'],
    texto:
      'Olá {{1}}, sua conta continua com pendência de pagamento.\n\n👉 {{2}}\n\nPara evitar a suspensão do serviço e bloqueio dos acessos, pedimos que regularize o quanto antes, por favor.',
    assunto: 'Pendência de pagamento - Spotsales',
    html: ([
      P('Olá {{1}}, sua conta continua com pendência de pagamento.'),
      P('👉 {link}'),
      P('Para evitar a suspensão do serviço e bloqueio dos acessos, pedimos que regularize o quanto antes, por favor.'),
    ].join('\n')),
  },
  {
    id: 'atraso_4dia',
    label: 'Atraso 4 dias',
    vars: ['nome', 'link'],
    texto:
      'Olá {{1}}!\n\nEste é um *lembrete final:* se o pagamento não for identificado até hoje, sua conta será temporariamente suspensa a partir de amanhã.\n\nPara evitar o bloqueio, regularize até hoje no link abaixo:\n👉 {{2}}\n\nEquipe Spotsales',
    assunto: 'Lembrete final: regularize até hoje',
    html: ([
      P('Olá {{1}}!'),
      P('Este é um <strong>lembrete final:</strong> se o pagamento não for identificado até hoje, sua conta será temporariamente suspensa a partir de amanhã.'),
      P('Para evitar o bloqueio, regularize até hoje no link abaixo:<br>👉 {link}'),
      P('Equipe Spotsales'),
    ].join('\n')),
  },
  {
    id: 'suspenso',
    label: 'Conta suspensa',
    vars: ['nome', 'link'],
    texto:
      'Olá {{1}}. Tudo bem?\n\nConforme avisamos anteriormente, sua conta foi temporariamente suspensa por falta de pagamento. 😔\n\nAssim que o pagamento for confirmado, vamos liberar o acesso o quanto antes.\n👉 {{2}}\n\nSe precisar de ajuda ou quiser conversar com a gente, estamos por aqui.',
    assunto: 'Conta Spotsales suspensa por falta de pagamento',
    html: ([
      P('Olá {{1}}. Tudo bem?'),
      P('Conforme avisamos anteriormente, sua conta foi temporariamente suspensa por falta de pagamento. 😔'),
      P('Assim que o pagamento for confirmado, vamos liberar o acesso o quanto antes.<br>👉 {link}'),
      P('Se precisar de ajuda ou quiser conversar com a gente, estamos por aqui.'),
    ].join('\n')),
  },
]

// O link de pagamento é resolvido pelo n8n a partir do asaas_id no momento do disparo.
const LINK_PLACEHOLDER = '(link de pagamento)'

function primeiroNome(cliente: Cliente | null): string {
  const contato = cliente?.contato?.trim()
  if (contato) return contato.split(' ')[0]
  return cliente?.descricao || ''
}

export function valoresDasVars(cliente: Cliente | null, lancamento: LancamentoMensal | null): Record<VarNome, string> {
  return {
    nome: primeiroNome(cliente),
    empresa: cliente?.descricao || '',
    valor: lancamento ? formatCurrency(lancamento.valor) : '',
    vencimento: lancamento ? formatDate(lancamento.vencimento) : '',
    link: LINK_PLACEHOLDER,
  }
}

function escaparHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// `escapar` evita que nome/empresa vindos do banco injetem HTML no e-mail.
export function preencher(
  modelo: string,
  template: Template,
  cliente: Cliente | null,
  lancamento: LancamentoMensal | null,
  escapar = false
): string {
  const valores = valoresDasVars(cliente, lancamento)
  return modelo.replace(/\{\{(\d+)\}\}/g, (m, n) => {
    const nome = template.vars[Number(n) - 1]
    if (!nome) return m
    return escapar ? escaparHtml(valores[nome]) : valores[nome]
  })
}

export interface ResultadoEnvio {
  ok: boolean
  erro?: string
  // Webhook respondeu OK, mas o registro em envios_lancamentos falhou
  registroErro?: string
}

// Dispara o template via webhook do n8n e registra o envio no lançamento como manual.
export async function enviarCobranca(
  cliente: Cliente,
  cobranca: LancamentoMensal | null,
  template: Template,
  canal: Canal
): Promise<ResultadoEnvio> {
  const destinatario = canal === 'whatsapp' ? cliente.whatsapp : cliente.email
  if (!destinatario) {
    return { ok: false, erro: `Cliente sem ${canal === 'whatsapp' ? 'WhatsApp' : 'e-mail'} cadastrado.` }
  }

  try {
    const valores = valoresDasVars(cliente, cobranca)
    const mensagem = preencher(template.texto, template, cliente, cobranca)
    const mensagemHtml = preencher(template.html, template, cliente, cobranca, true)
    const res = await fetch(ENVIOS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: template.id,
        template_label: template.label,
        template_texto: template.texto,
        parametros: template.vars.map((v) => valores[v]),
        variaveis: Object.fromEntries(template.vars.map((v, i) => [`${i + 1}`, valores[v]])),
        mensagem,
        assunto: template.assunto,
        mensagem_html: mensagemHtml,
        canal,
        destinatario,
        empresa: {
          id: cliente.id,
          descricao: cliente.descricao,
          contato: cliente.contato || null,
          whatsapp: cliente.whatsapp || null,
          email: cliente.email || null,
          cnpj_cpf: cliente.cnpj_cpf || null,
          cep: cliente.cep || null,
          dia_vencimento: cliente.dia_vencimento ?? null,
          forma_de_pgt: cliente.forma_de_pgt ?? null,
          canais: cliente.canais ?? null,
          envia_nf: cliente.envia_nf ?? null,
          ativo: cliente.ativo ?? null,
          asaas_customer_id: cliente.asaas_customer_id ?? null,
        },
        cobranca: cobranca
          ? {
              lancamento_id: cobranca.id,
              valor: cobranca.valor,
              vencimento: formatDate(cobranca.vencimento),
              forma_pgt: cobranca.forma_pgt,
              status_pagamento: cobranca.status_pagamento,
              asaas_id: cobranca.asaas_id ?? null,
            }
          : null,
        cliente_id: cliente.id,
        lancamento_id: cobranca?.id ?? null,
        valor: cobranca?.valor ?? null,
        vencimento: cobranca ? formatDate(cobranca.vencimento) : null,
        asaas_id: cobranca?.asaas_id ?? null,
      }),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return { ok: false, erro: `Falha (HTTP ${res.status}). ${txt}`.trim() }
    }

    let registroErro: string | undefined
    if (cobranca) {
      const { error } = await supabase.from('envios_lancamentos').insert({
        lancamento_id: cobranca.id,
        cliente_id: cliente.id,
        data_envio: new Date().toISOString(),
        status_envio: 'enviado',
        canal_envio: canal === 'whatsapp' ? 'WhatsApp' : 'E-mail',
        observacao: template.label,
        origem: 'manual',
      })
      if (error) registroErro = error.message
    }
    return { ok: true, registroErro }
  } catch {
    return { ok: false, erro: 'Erro de conexão ao chamar o webhook.' }
  }
}
