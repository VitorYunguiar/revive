-- Additive historical progress model. Legacy event intent/date confidence remains explicit.
alter table public.historico_recaidas
  add column if not exists resetar_contador boolean;
comment on column public.historico_recaidas.resetar_contador is
  'NULL means the legacy row did not say whether this event reset the streak; do not infer a reset.';

create table public.progresso_ancoras (
  vicio_id uuid primary key references public.vicios(id) on delete cascade,
  started_at timestamptz not null,
  cobertura text not null check (cobertura in ('confirmed','inferred','unknown')),
  created_at timestamptz not null default now()
);

create table public.progresso_periodos (
  id uuid primary key default gen_random_uuid(),
  vicio_id uuid not null references public.vicios(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  source text not null check (source in ('legacy_anchor','mobile_reset')),
  cobertura text not null check (cobertura in ('confirmed','inferred','unknown')),
  source_relapse_id uuid references public.historico_recaidas(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint progresso_periodos_dates_check check (ended_at is null or ended_at >= started_at),
  constraint progresso_periodos_source_relapse_check check
    ((source = 'legacy_anchor' and source_relapse_id is null) or
     (source = 'mobile_reset' and source_relapse_id is not null)),
  constraint progresso_periodos_relapse_unique unique (source_relapse_id)
);
create unique index progresso_periodos_one_open_idx on public.progresso_periodos (vicio_id) where ended_at is null;
create index progresso_periodos_history_idx on public.progresso_periodos (vicio_id, started_at, id);

create table public.segmentos_economia (
  id uuid primary key default gen_random_uuid(),
  vicio_id uuid not null references public.vicios(id) on delete cascade,
  effective_from timestamptz not null,
  effective_to timestamptz,
  valor_diario numeric(10,2) check (valor_diario is null or valor_diario >= 0),
  cobertura text not null check (cobertura in ('confirmed','inferred','unknown')),
  origem text not null check (origem in ('legacy_backfill','habit_creation','prospective_edit')),
  created_at timestamptz not null default now(),
  constraint segmentos_economia_dates_check check (effective_to is null or effective_to >= effective_from)
);
create unique index segmentos_economia_one_open_idx on public.segmentos_economia (vicio_id) where effective_to is null;
create unique index segmentos_economia_legacy_backfill_idx
  on public.segmentos_economia (vicio_id) where origem = 'legacy_backfill';
create index segmentos_economia_period_idx on public.segmentos_economia (vicio_id, effective_from, id);

create table public.conquistas_permanentes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  vicio_id uuid references public.vicios(id) on delete cascade,
  categoria text not null check (categoria in ('streak','savings','goals','consistency')),
  valor_alvo numeric(12,2) not null check (valor_alvo > 0),
  awarded_at timestamptz not null,
  origem text not null check (origem in ('legacy','period_threshold','snapshot_observation')),
  cobertura text not null check (cobertura in ('confirmed','inferred','unknown')),
  created_at timestamptz not null default now(),
  constraint conquistas_permanentes_scope_unique unique nulls not distinct
    (usuario_id, vicio_id, categoria, valor_alvo)
);
create index conquistas_permanentes_user_awarded_idx on public.conquistas_permanentes (usuario_id, categoria, awarded_at, id);
create index conquistas_permanentes_habit_awarded_idx on public.conquistas_permanentes (vicio_id, categoria, awarded_at, id);

insert into public.progresso_ancoras (vicio_id, started_at, cobertura)
select id,
       coalesce(data_ultima_recaida, data_inicio) at time zone 'UTC',
       case
         when data_ultima_recaida is not null then 'inferred'
         when exists (
           select 1 from public.historico_recaidas relapse
            where relapse.vicio_id = vicios.id
              and relapse.resetar_contador is null
         ) then 'unknown'
         else 'confirmed'
       end
  from public.vicios
on conflict (vicio_id) do nothing;

insert into public.progresso_periodos (vicio_id, started_at, source, cobertura)
select anchor.vicio_id, anchor.started_at, 'legacy_anchor', anchor.cobertura
  from public.progresso_ancoras anchor
on conflict do nothing;

-- The old daily value had no history. Preserve it as an estimate and label coverage inferred.
insert into public.segmentos_economia (vicio_id, effective_from, valor_diario, cobertura, origem)
select v.id, v.data_inicio at time zone 'UTC', v.valor_economizado_por_dia,
       'inferred', 'legacy_backfill'
  from public.vicios v
on conflict do nothing;

-- Existing persisted milestones remain permanent. Their saved timestamp is the only known award date.
insert into public.conquistas_permanentes
  (usuario_id, vicio_id, categoria, valor_alvo, awarded_at, origem, cobertura)
select v.usuario_id, m.vicio_id, 'streak', m.dias_abstinencia,
       m.data_marco at time zone 'UTC', 'legacy', 'confirmed'
  from public.marcos m
  join public.vicios v on v.id = m.vicio_id
 where m.dias_abstinencia > 0
on conflict (usuario_id, vicio_id, categoria, valor_alvo) do nothing;

create or replace function public.rebuild_vicio_progress_periods(p_vicio_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_anchor public.progresso_ancoras%rowtype;
begin
  select * into v_anchor from public.progresso_ancoras
   where vicio_id = p_vicio_id for update;
  if not found then return; end if;

  delete from public.progresso_periodos where vicio_id = p_vicio_id;
  with timeline as (
    select v_anchor.started_at as started_at, null::uuid as relapse_id,
           'legacy_anchor'::text as source, v_anchor.cobertura as cobertura
    union all
    select r.data_recaida at time zone 'UTC', r.id,
           'mobile_reset'::text, 'confirmed'::text
      from public.historico_recaidas r
     where r.vicio_id = p_vicio_id
       and r.resetar_contador is true
       and (r.data_recaida at time zone 'UTC') >= v_anchor.started_at
  ), ordered as (
    select started_at, relapse_id, source, cobertura,
           lead(started_at) over (order by started_at, relapse_id nulls first) as next_start
      from timeline
  )
  insert into public.progresso_periodos
    (vicio_id, started_at, ended_at, source, cobertura, source_relapse_id)
  select p_vicio_id, started_at, next_start, source, cobertura, relapse_id
    from ordered;
end;
$$;
revoke all on function public.rebuild_vicio_progress_periods(uuid) from public, anon, authenticated;
grant execute on function public.rebuild_vicio_progress_periods(uuid) to service_role;

create or replace function public.capture_vicio_progress_period()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and old.vicio_id is distinct from new.vicio_id
     and old.resetar_contador is true then
    perform public.rebuild_vicio_progress_periods(old.vicio_id);
  end if;
  if new.resetar_contador is true
     or (tg_op = 'UPDATE' and old.resetar_contador is true) then
    perform public.rebuild_vicio_progress_periods(new.vicio_id);
  end if;
  return new;
end;
$$;
revoke all on function public.capture_vicio_progress_period() from public, anon, authenticated;
grant execute on function public.capture_vicio_progress_period() to service_role;
create trigger historico_recaidas_progress_period
  after insert or update of vicio_id, data_recaida, resetar_contador on public.historico_recaidas
  for each row execute function public.capture_vicio_progress_period();

create or replace function public.initialize_vicio_progress_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.progresso_ancoras (vicio_id, started_at, cobertura)
  values (new.id, new.data_inicio at time zone 'UTC', 'confirmed')
  on conflict (vicio_id) do nothing;
  insert into public.progresso_periodos (vicio_id, started_at, source, cobertura)
  values (new.id, new.data_inicio at time zone 'UTC', 'legacy_anchor', 'confirmed')
  on conflict do nothing;
  insert into public.segmentos_economia
    (vicio_id, effective_from, valor_diario, cobertura, origem)
  values (new.id, new.data_inicio at time zone 'UTC', new.valor_economizado_por_dia,
          case when new.valor_economizado_por_dia is null then 'unknown' else 'confirmed' end,
          'habit_creation');
  return new;
end;
$$;
revoke all on function public.initialize_vicio_progress_history() from public, anon, authenticated;
grant execute on function public.initialize_vicio_progress_history() to service_role;
create trigger vicios_initialize_progress_history
  after insert on public.vicios
  for each row execute function public.initialize_vicio_progress_history();

create or replace function public.record_prospective_economy_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_effective_at timestamptz := now();
begin
  if new.valor_economizado_por_dia is not distinct from old.valor_economizado_por_dia then
    return new;
  end if;
  update public.segmentos_economia
     set effective_to = greatest(effective_from, v_effective_at)
   where vicio_id = new.id and effective_to is null;
  insert into public.segmentos_economia
    (vicio_id, effective_from, valor_diario, cobertura, origem)
  values (new.id, v_effective_at, new.valor_economizado_por_dia,
          case when new.valor_economizado_por_dia is null then 'unknown' else 'confirmed' end,
          'prospective_edit');
  return new;
end;
$$;
revoke all on function public.record_prospective_economy_change() from public, anon, authenticated;
grant execute on function public.record_prospective_economy_change() to service_role;
create trigger vicios_record_prospective_economy
  after update of valor_economizado_por_dia on public.vicios
  for each row execute function public.record_prospective_economy_change();

alter table public.progresso_ancoras enable row level security;
alter table public.progresso_periodos enable row level security;
alter table public.segmentos_economia enable row level security;
alter table public.conquistas_permanentes enable row level security;
revoke all on table public.progresso_ancoras, public.progresso_periodos,
  public.segmentos_economia, public.conquistas_permanentes from public, anon, authenticated;
grant select, insert, update, delete on table public.progresso_ancoras,
  public.progresso_periodos, public.segmentos_economia,
  public.conquistas_permanentes to service_role;

create or replace function public.execute_mobile_mutation(
  p_usuario_id uuid,
  p_idempotency_key uuid,
  p_request_hash text,
  p_legacy_request_hash text,
  p_operation text,
  p_payload jsonb,
  p_request_id text
)
returns table(status_code integer, response_body jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_receipt public.api_idempotency%rowtype;
  v_inserted integer;
  v_status integer;
  v_body jsonb;
  v_addiction public.vicios%rowtype;
  v_goal public.metas%rowtype;
  v_record public.registros_diarios%rowtype;
  v_relapse public.historico_recaidas%rowtype;
  v_addiction_id uuid;
  v_date date;
  v_event_time timestamptz;
  v_base_time timestamptz;
  v_lost_days integer;
  v_days integer;
  v_description text;
  v_days_goal integer;
  v_value_goal numeric;
  v_start_today boolean;
begin
  insert into public.api_idempotency
    (usuario_id, idempotency_key, request_hash, expires_at)
  values
    (p_usuario_id, p_idempotency_key, p_request_hash, 'infinity'::timestamptz)
  on conflict (usuario_id, idempotency_key) do nothing;
  get diagnostics v_inserted = row_count;

  select * into v_receipt from public.api_idempotency
   where usuario_id = p_usuario_id and idempotency_key = p_idempotency_key
   for update;

  if v_inserted = 0 then
    if v_receipt.request_hash not in (p_request_hash, p_legacy_request_hash) then
      return query select 409, jsonb_build_object(
        'codigo', 'IDEMPOTENCY_CONFLITO',
        'mensagem', 'A chave ja foi usada com outro conteudo.',
        'request_id', p_request_id);
      return;
    end if;
    if v_receipt.status_code is not null and v_receipt.response_body is not null then
      return query select v_receipt.status_code, v_receipt.response_body;
      return;
    end if;
    return query select 409, jsonb_build_object(
      'codigo', 'IDEMPOTENCY_EM_PROCESSAMENTO',
      'mensagem', 'Operacao ainda em processamento.',
      'request_id', p_request_id);
    return;
  end if;

  if p_operation = 'record.create' then
    begin
      v_addiction_id := nullif(btrim(p_payload->>'vicio_id'), '')::uuid;
    exception when invalid_text_representation then
      v_addiction_id := null;
    end;
    if v_addiction_id is null or coalesce(p_payload->>'data_registro', '') !~ '^\d{4}-\d{2}-\d{2}$' then
      v_status := 422;
      v_body := jsonb_build_object('codigo', 'DADOS_INVALIDOS', 'mensagem', 'Vicio e data valida sao obrigatorios.', 'request_id', p_request_id);
    else
      begin
        v_date := (p_payload->>'data_registro')::date;
      exception when others then
        v_date := null;
      end;
      if v_date is null or to_char(v_date, 'YYYY-MM-DD') <> p_payload->>'data_registro' then
        v_status := 422;
        v_body := jsonb_build_object('codigo', 'DADOS_INVALIDOS', 'mensagem', 'Vicio e data valida sao obrigatorios.', 'request_id', p_request_id);
      elsif v_date > (now() at time zone 'UTC')::date + 1 then
        v_status := 422;
        v_body := jsonb_build_object('codigo', 'DATA_FUTURA', 'mensagem', 'A data do registro nao pode estar no futuro.', 'request_id', p_request_id);
      else
        select * into v_addiction from public.vicios
         where id = v_addiction_id and usuario_id = p_usuario_id;
        if not found then
          v_status := 404;
          v_body := jsonb_build_object('codigo', 'VICIO_NAO_ENCONTRADO', 'mensagem', 'Vicio nao encontrado.', 'request_id', p_request_id);
        else
          insert into public.registros_diarios(vicio_id, data_registro, humor, gatilhos, conquistas, observacoes)
          values (v_addiction_id, v_date,
            nullif(left(btrim(p_payload->>'humor'), 100), ''),
            nullif(left(btrim(p_payload->>'gatilhos'), 500), ''),
            nullif(left(btrim(p_payload->>'conquistas'), 500), ''),
            nullif(left(btrim(p_payload->>'observacoes'), 1000), ''))
          returning * into v_record;
          v_status := 201;
          v_body := jsonb_build_object('mensagem', 'Registro criado com sucesso', 'registro', to_jsonb(v_record));
        end if;
      end if;
    end if;

  elsif p_operation = 'relapse.create' then
    begin
      v_addiction_id := nullif(btrim(p_payload->>'addictionId'), '')::uuid;
      v_event_time := coalesce(nullif(btrim(p_payload->>'occurred_at'), '')::timestamptz, now());
    exception when others then
      v_addiction_id := null;
      v_event_time := null;
    end;
    if v_addiction_id is null or v_event_time is null or not isfinite(v_event_time)
       or v_event_time > now() + interval '5 minutes' then
      v_status := 422;
      v_body := jsonb_build_object('codigo', 'DATA_INVALIDA', 'mensagem', 'Momento da recaida invalido.', 'request_id', p_request_id);
    else
      select * into v_addiction from public.vicios
       where id = v_addiction_id and usuario_id = p_usuario_id
       for update;
      if not found then
        v_status := 404;
        v_body := jsonb_build_object('codigo', 'VICIO_NAO_ENCONTRADO', 'mensagem', 'Vicio nao encontrado.', 'request_id', p_request_id);
      else
        v_base_time := coalesce(v_addiction.data_ultima_recaida, v_addiction.data_inicio)::timestamptz;
        v_lost_days := greatest(0, floor(extract(epoch from (v_event_time - v_base_time)) / 86400)::integer);
        insert into public.historico_recaidas(vicio_id, data_recaida, motivo, dias_abstinencia_perdidos, resetar_contador)
        values (v_addiction.id, v_event_time, nullif(left(btrim(p_payload->>'motivo'), 1000), ''), v_lost_days, case when jsonb_typeof(p_payload->'resetarContador') = 'boolean' then (p_payload->>'resetarContador')::boolean else false end)
        returning * into v_relapse;
        if p_payload->'resetarContador' = 'true'::jsonb then
          update public.vicios set data_ultima_recaida = greatest(coalesce(data_ultima_recaida, v_event_time at time zone 'UTC'), v_event_time at time zone 'UTC')
           where id = v_addiction.id and usuario_id = p_usuario_id
          returning * into v_addiction;
        end if;
        v_status := 201;
        v_body := jsonb_build_object('mensagem', 'Recaida registrada.',
          'dias_abstinencia_anteriores', v_lost_days,
          'recaida', to_jsonb(v_relapse), 'vicio', to_jsonb(v_addiction));
      end if;
    end if;

  elsif p_operation = 'goal.create' then
    v_description := nullif(btrim(p_payload->>'descricao_meta'), '');
    begin
      v_addiction_id := nullif(btrim(p_payload->>'vicio_id'), '')::uuid;
      v_days_goal := nullif(p_payload->>'dias_objetivo', '')::numeric::integer;
      v_value_goal := nullif(p_payload->>'valor_objetivo', '')::numeric;
    exception when others then
      v_addiction_id := null;
      v_days_goal := null;
      v_value_goal := null;
    end;
    if v_description is null or length(v_description) > 240 or v_addiction_id is null then
      v_status := 422;
      v_body := jsonb_build_object('codigo', 'DADOS_INVALIDOS', 'mensagem', 'Descricao e vicio sao obrigatorios.', 'request_id', p_request_id);
    elsif (nullif(p_payload->>'dias_objetivo', '') is not null and (v_days_goal is null or v_days_goal <= 0))
       or (nullif(p_payload->>'valor_objetivo', '') is not null and (v_value_goal is null or v_value_goal <= 0)) then
      v_status := 422;
      v_body := jsonb_build_object('codigo', 'OBJETIVO_INVALIDO', 'mensagem', 'Objetivos devem ser numeros positivos.', 'request_id', p_request_id);
    else
      select * into v_addiction from public.vicios
       where id = v_addiction_id and usuario_id = p_usuario_id;
      if not found then
        v_status := 404;
        v_body := jsonb_build_object('codigo', 'VICIO_NAO_ENCONTRADO', 'mensagem', 'Vicio nao encontrado.', 'request_id', p_request_id);
      else
        v_start_today := coalesce(p_payload->'iniciar_hoje' = 'true'::jsonb, false);
        v_days := greatest(0, floor(extract(epoch from (now() - coalesce(v_addiction.data_ultima_recaida, v_addiction.data_inicio)::timestamptz)) / 86400)::integer);
        insert into public.metas(usuario_id, vicio_id, descricao_meta, dias_objetivo, valor_objetivo,
          iniciar_hoje, data_inicio_meta, dias_abstinencia_inicio, valor_economizado_inicio)
        values (p_usuario_id, v_addiction_id, v_description, v_days_goal, v_value_goal,
          v_start_today,
          case when v_start_today then coalesce(nullif(p_payload->>'data_inicio_meta', '')::date, (now() at time zone 'UTC')::date) else null end,
          case when v_start_today then v_days else 0 end,
          case when v_start_today then round(v_days * coalesce(v_addiction.valor_economizado_por_dia, 0), 2) else 0 end)
        returning * into v_goal;
        v_status := 201;
        v_body := jsonb_build_object('mensagem', 'Meta criada com sucesso', 'meta', to_jsonb(v_goal));
      end if;
    end if;

  elsif p_operation = 'goal.complete' then
    begin
      v_addiction_id := nullif(btrim(p_payload->>'goalId'), '')::uuid;
    exception when invalid_text_representation then
      v_addiction_id := null;
    end;
    if jsonb_typeof(p_payload->'concluida') is distinct from 'boolean' then
      v_status := 422;
      v_body := jsonb_build_object('codigo', 'DADOS_INVALIDOS', 'mensagem', 'Status de conclusao invalido.', 'request_id', p_request_id);
    elsif v_addiction_id is null then
      v_status := 404;
      v_body := jsonb_build_object('codigo', 'META_NAO_ENCONTRADA', 'mensagem', 'Meta nao encontrada.', 'request_id', p_request_id);
    else
      update public.metas set concluida = (p_payload->>'concluida')::boolean
       where id = v_addiction_id and usuario_id = p_usuario_id
      returning * into v_goal;
      if not found then
        v_status := 404;
        v_body := jsonb_build_object('codigo', 'META_NAO_ENCONTRADA', 'mensagem', 'Meta nao encontrada.', 'request_id', p_request_id);
      else
        v_status := 200;
        v_body := jsonb_build_object('mensagem', 'Meta atualizada com sucesso', 'meta', to_jsonb(v_goal));
      end if;
    end if;
  else
    raise exception 'Unsupported mobile mutation type';
  end if;

  update public.api_idempotency set status_code = v_status, response_body = v_body
   where usuario_id = p_usuario_id and idempotency_key = p_idempotency_key;
  return query select v_status, v_body;
end;
$$;
