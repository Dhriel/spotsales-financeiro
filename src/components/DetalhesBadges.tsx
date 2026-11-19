const badge = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium'

export function CanalBadges({ canal }: { canal: string | null | undefined }) {
  if (!canal) return <span className={`${badge} border-gray-200 bg-gray-50 text-gray-500`}>Canal não informado</span>
  const texto = canal.toLowerCase()
  const whatsapp = texto.includes('whats')
  const email = /e-?mail/.test(texto)
  if (!whatsapp && !email) return <span className={`${badge} border-gray-200 bg-gray-50 text-gray-600`}>{canal}</span>
  return <>{whatsapp && <span className={`${badge} border-emerald-200 bg-emerald-50 text-emerald-800`}>💬 WhatsApp</span>}{email && <span className={`${badge} border-sky-200 bg-sky-50 text-sky-800`}>✉️ E-mail</span>}</>
}

export function FormaBadge({ forma }: { forma: string | null | undefined }) {
  if (!forma) return null
  const texto = forma.toLowerCase()
  const pix = texto.includes('pix')
  const boleto = texto.includes('boleto')
  const cartao = texto.includes('cart')
  return <span className={`${badge} ${pix ? 'border-teal-200 bg-teal-50 text-teal-800' : boleto ? 'border-indigo-200 bg-indigo-50 text-indigo-800' : cartao ? 'border-violet-200 bg-violet-50 text-violet-800' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>{pix ? '◆' : boleto ? '▤' : cartao ? '💳' : '💰'} {forma}</span>
}

export function OrigemBadge({ origem }: { origem: string | null | undefined }) {
  if (!origem) return <span className={`${badge} border-gray-200 bg-gray-50 text-gray-500`}>Origem não informada</span>
  return <span className={`${badge} ${origem === 'manual' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>{origem === 'manual' ? '✋ Manual' : origem === 'automatico' ? '⚙️ Automático' : origem}</span>
}

export function SituacaoEnvioBadge({ status }: { status: string | null | undefined }) {
  const config: Record<string, [string, string]> = {
    erro: ['⚠️ Erro no envio', 'border-red-200 bg-red-50 text-red-800'],
    enviado: ['Enviado (registrado)', 'border-blue-200 bg-blue-50 text-blue-800'],
    enviado_api: ['Aceito pela plataforma', 'border-blue-200 bg-blue-50 text-blue-800'],
    entregue: ['✓ Entrega confirmada', 'border-emerald-200 bg-emerald-50 text-emerald-800'],
    pendente: ['⏳ Pendente', 'border-gray-200 bg-gray-50 text-gray-700'],
    tentando: ['⏳ Em tentativa', 'border-gray-200 bg-gray-50 text-gray-700'],
    nao_enviar: ['Não enviar', 'border-gray-200 bg-gray-50 text-gray-700'],
  }
  const [label, cores] = config[status || ''] || [status || 'Situação não informada', 'border-gray-200 bg-gray-50 text-gray-600']
  return <span className={`${badge} ${cores}`}>{label}</span>
}
