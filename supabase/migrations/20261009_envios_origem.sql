-- Distingue envio automático (n8n) de envio manual feito pela tela de Envios.
-- Default 'automatico' para que os inserts do n8n continuem funcionando sem mudança.
alter table spotsales.envios_lancamentos
  add column if not exists origem text not null default 'automatico'
  check (origem in ('automatico', 'manual'));
