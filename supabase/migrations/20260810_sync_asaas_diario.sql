-- ============================================================================
-- Sincronização diária Asaas -> lançamentos
-- ============================================================================
-- Mantém os lançamentos existentes em dia com o Asaas: vincula o asaas_id que
-- ficou faltando, marca como pago o que já foi recebido e corrige o valor
-- quando o cliente tem add-ons. Não cria lançamentos novos — isso segue a
-- cargo do job mensal sync-asaas-subscriptions (dia 25).
-- ============================================================================

-- 1. Coluna para o relatório detalhado (valores alterados, pagos, órfãs).
-- As demais colunas de sync_logs são contadores fixos e não comportam isso.
alter table spotsales.sync_logs
  add column if not exists detalhes jsonb default '{}'::jsonb;

-- 2. Extensões necessárias para o agendamento (idempotente)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 3. Remove job anterior (se existir) para evitar duplicação
do $$
begin
  perform cron.unschedule('sync-asaas-diario')
  where exists (
    select 1 from cron.job where jobname = 'sync-asaas-diario'
  );
end $$;

-- 4. Agenda diariamente às 09:00 UTC (= 06:00 Brasília UTC-3)
select cron.schedule(
  'sync-asaas-diario',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/sync-asaas-diario',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
