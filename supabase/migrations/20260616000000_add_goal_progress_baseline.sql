alter table public.metas
  add column if not exists iniciar_hoje boolean not null default false,
  add column if not exists data_inicio_meta date,
  add column if not exists dias_abstinencia_inicio integer not null default 0,
  add column if not exists valor_economizado_inicio numeric(12, 2) not null default 0;
