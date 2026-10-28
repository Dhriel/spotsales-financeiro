-- Campos adicionais para a aba Monitoramento: data do lançamento,
-- origem (automático/manual) e descrição do último evento.
-- A view continua em security_invoker e não altera RLS.
create or replace view spotsales.monitoramento_cobrancas with (security_invoker = true) as
select
  l.id as lancamento_id,
  l.vencimento,
  l.valor,
  l.forma_pgt,
  l.status_envio as status_envio_lancamento,
  l.status_pagamento,
  c.id as cliente_id,
  c.descricao as cliente,
  c.canais,
  c.cobranca_automatica,
  ultimo.status_envio as ultimo_status_envio,
  ultimo.canal_envio as ultimo_canal_envio,
  ultimo.data_envio as ultimo_envio_em,
  ultimo.tentativas as ultimas_tentativas,
  ultimo.codigo_http as ultimo_codigo_http,
  ultimo.erro_detalhe as ultimo_erro,
  ultimo.provider_message_id,
  ultimo.entregue_em,
  case
    when c.cobranca_automatica is false then 'nao_automatico'
    when ultimo.status_envio = 'erro' then 'erro'
    when ultimo.status_envio = any (array['enviado', 'enviado_api', 'entregue']) then 'enviado'
    when l.status_pagamento = any (array['pago', 'cancelado']) then 'sem_envio'
    when l.vencimento <= (now() at time zone 'America/Sao_Paulo')::date then 'pendente_envio'
    else 'agendado'
  end as situacao_monitoramento,
  ultimo.origem as ultimo_origem_envio,
  ultimo.observacao as ultima_observacao,
  l.data as data_lancamento
from spotsales.lancamentos_mensais l
join spotsales.clientes c on c.id = l.cliente_id
left join lateral (
  select e.*
  from spotsales.envios_lancamentos e
  where e.lancamento_id = l.id
  order by e.data_envio desc, e.id desc
  limit 1
) ultimo on true;
