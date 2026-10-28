-- ============================================================================
-- Sincronização automática de assinaturas do Asaas
-- ============================================================================
-- Cria a tabela de log, habilita extensões necessárias e agenda o cron job
-- para rodar todo dia 25 às 00:00 (horário de Brasília / 03:00 UTC) chamando
-- a Edge Function sync-asaas-subscriptions.
-- ============================================================================

-- 1. Tabela de log das sincronizações
create table if not exists spotsales.sync_logs (
  id bigserial primary key,
  tipo text not null,
  status text not null,
  iniciado_em timestamptz not null,
  finalizado_em timestamptz,
  clientes_processados int default 0,
  assinaturas_encontradas int default 0,
  lancamentos_criados int default 0,
  lancamentos_existentes int default 0,
  erros jsonb default '[]'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists sync_logs_tipo_idx on spotsales.sync_logs (tipo, criado_em desc);

-- 2. Extensões necessárias para o agendamento
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 3. Remove job anterior (se existir) para evitar duplicação
do $$
begin
  perform cron.unschedule('sync-asaas-subscriptions-monthly')
  where exists (
    select 1 from cron.job where jobname = 'sync-asaas-subscriptions-monthly'
  );
end $$;

-- 4. Agenda o cron job para dia 25 às 03:00 UTC (= 00:00 Brasília UTC-3)
-- O service_role_key é necessário para que o cron possa invocar a Edge Function
select cron.schedule(
  'sync-asaas-subscriptions-monthly',
  '0 3 25 * *',
  $$
  select net.http_post(
    url := 'https://eohugjtnhmcnedqzzpyy.supabase.co/functions/v1/sync-asaas-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
