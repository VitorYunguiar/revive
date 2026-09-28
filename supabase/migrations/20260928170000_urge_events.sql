-- Structured urge events are separate from diary entries and relapses.
create or replace function public.valid_urge_trigger_codes(p_codes text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_codes is not null
     and cardinality(p_codes) <= 10
     and cardinality(p_codes) = (select count(distinct code) from pg_catalog.unnest(p_codes) as codes(code))
     and not exists (
       select 1 from pg_catalog.unnest(p_codes) as codes(code)
        where code !~ '^[a-z][a-z0-9_]{0,39}$'
     );
$$;
revoke all on function public.valid_urge_trigger_codes(text[]) from public, anon, authenticated;
grant execute on function public.valid_urge_trigger_codes(text[]) to service_role;

create unique index if not exists vicios_id_usuario_id_unique
  on public.vicios (id, usuario_id);

create table public.eventos_vontade (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  vicio_id uuid not null,
  occurred_at timestamptz not null,
  timezone text not null,
  intensidade smallint not null check (intensidade between 0 and 10),
  gatilhos text[] not null default '{}',
  nota text,
  acao_realizada text,
  resultado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_vontade_habit_owner_fk
    foreign key (vicio_id, usuario_id) references public.vicios(id, usuario_id) on delete cascade,
  constraint eventos_vontade_gatilhos_check
    check (public.valid_urge_trigger_codes(gatilhos)),
  constraint eventos_vontade_timezone_length_check
    check (length(timezone) between 1 and 100),
  constraint eventos_vontade_text_length_check
    check ((nota is null or length(nota) <= 1000)
      and (acao_realizada is null or length(acao_realizada) <= 1000)
      and (resultado is null or length(resultado) <= 1000))
);

create index eventos_vontade_user_habit_time_idx
  on public.eventos_vontade (usuario_id, vicio_id, occurred_at desc, id desc);

alter table public.eventos_vontade enable row level security;
revoke all on table public.eventos_vontade from public, anon, authenticated;
grant select, insert, update, delete on table public.eventos_vontade to service_role;

comment on table public.eventos_vontade is
  'Retrospective, structured urge events. These rows never represent or create a relapse.';
comment on column public.eventos_vontade.gatilhos is
  'Stable machine codes. Unknown well-formed codes are retained for forward compatibility.';

create or replace function public.execute_mobile_urge_mutation(
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
  v_habit_id uuid;
  v_event_time timestamptz;
  v_timezone text;
  v_intensity integer;
  v_triggers text[];
  v_event public.eventos_vontade%rowtype;
begin
  if p_operation is distinct from 'urge.create' then
    raise exception 'Unsupported mobile urge mutation type';
  end if;

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

  begin
    v_habit_id := nullif(btrim(p_payload->>'vicio_id'), '')::uuid;
    v_event_time := nullif(btrim(p_payload->>'occurred_at'), '')::timestamptz;
    v_intensity := nullif(p_payload->>'intensidade', '')::integer;
    v_timezone := nullif(btrim(p_payload->>'timezone'), '');
    if jsonb_typeof(p_payload->'gatilhos') = 'array'
       and not exists (
         select 1 from jsonb_array_elements(p_payload->'gatilhos') item
          where jsonb_typeof(item) <> 'string'
       ) then
      select coalesce(array_agg(value), '{}') into v_triggers
        from jsonb_array_elements_text(p_payload->'gatilhos') values_list(value);
    else
      v_triggers := null;
    end if;
  exception when others then
    v_habit_id := null;
    v_event_time := null;
    v_intensity := null;
    v_timezone := null;
    v_triggers := null;
  end;

  if v_habit_id is null or v_event_time is null or not isfinite(v_event_time)
     or v_event_time > now() + interval '5 minutes'
     or v_timezone is null
     or not exists (select 1 from pg_catalog.pg_timezone_names where name = v_timezone)
     or jsonb_typeof(p_payload->'intensidade') is distinct from 'number'
     or v_intensity is null or v_intensity not between 0 and 10
     or v_triggers is null or not public.valid_urge_trigger_codes(v_triggers)
     or (nullif(btrim(p_payload->>'nota'), '') is not null and length(btrim(p_payload->>'nota')) > 1000)
     or (nullif(btrim(p_payload->>'acao_realizada'), '') is not null and length(btrim(p_payload->>'acao_realizada')) > 1000)
     or (nullif(btrim(p_payload->>'resultado'), '') is not null and length(btrim(p_payload->>'resultado')) > 1000) then
    v_status := 422;
    v_body := jsonb_build_object('codigo', 'DADOS_INVALIDOS',
      'mensagem', 'Revise momento, fuso, intensidade, gatilhos e limites dos campos.',
      'request_id', p_request_id);
  else
    perform 1 from public.vicios
     where id = v_habit_id and usuario_id = p_usuario_id and ativo is distinct from false
     for update;
    if not found then
      v_status := 404;
      v_body := jsonb_build_object('codigo', 'VICIO_NAO_ENCONTRADO',
        'mensagem', 'Vicio ativo nao encontrado.', 'request_id', p_request_id);
    else
      insert into public.eventos_vontade
        (usuario_id, vicio_id, occurred_at, timezone, intensidade, gatilhos, nota, acao_realizada, resultado)
      values
        (p_usuario_id, v_habit_id, v_event_time, v_timezone, v_intensity, v_triggers,
         nullif(btrim(p_payload->>'nota'), ''),
         nullif(btrim(p_payload->>'acao_realizada'), ''),
         nullif(btrim(p_payload->>'resultado'), ''))
      returning * into v_event;
      v_status := 201;
      v_body := jsonb_build_object('mensagem', 'Vontade registrada com sucesso.', 'vontade', to_jsonb(v_event));
    end if;
  end if;

  update public.api_idempotency set status_code = v_status, response_body = v_body
   where usuario_id = p_usuario_id and idempotency_key = p_idempotency_key;
  return query select v_status, v_body;
end;
$$;

revoke all on function public.execute_mobile_urge_mutation(uuid, uuid, text, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.execute_mobile_urge_mutation(uuid, uuid, text, text, text, jsonb, text)
  to service_role;

create or replace function public.list_urge_events(
  p_usuario_id uuid,
  p_vicio_id uuid,
  p_inicio date,
  p_fim date,
  p_timezone text,
  p_limit integer,
  p_cursor_time timestamptz default null,
  p_cursor_id uuid default null
)
returns table(
  habit_found boolean,
  id uuid,
  usuario_id uuid,
  vicio_id uuid,
  occurred_at timestamptz,
  timezone text,
  intensidade smallint,
  gatilhos text[],
  nota text,
  acao_realizada text,
  resultado text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_inicio is null or p_fim is null or p_fim < p_inicio or p_fim - p_inicio > 3660
     or p_timezone is null
     or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone)
     or p_limit is null or p_limit not between 1 and 101
     or ((p_cursor_time is null) <> (p_cursor_id is null)) then
    raise exception using errcode = '22023', message = 'invalid urge event query';
  end if;

  return query
  with habit as (
    select 1 as found from public.vicios
     where id = p_vicio_id and usuario_id = p_usuario_id
  ), scoped as (
    select event.* from public.eventos_vontade event
    join habit on true
     where event.usuario_id = p_usuario_id
       and event.vicio_id = p_vicio_id
       and event.occurred_at >= (p_inicio::timestamp without time zone at time zone p_timezone)
       and event.occurred_at < ((p_fim + 1)::timestamp without time zone at time zone p_timezone)
  ), counts as (
    select count(*)::bigint as total_count from scoped
  ), page as (
    select event.* from scoped event
     where p_cursor_time is null or (event.occurred_at, event.id) < (p_cursor_time, p_cursor_id)
     order by event.occurred_at desc, event.id desc
     limit p_limit
  )
  select exists (select 1 from habit), page.id, page.usuario_id, page.vicio_id,
         page.occurred_at, page.timezone, page.intensidade, page.gatilhos,
         page.nota, page.acao_realizada, page.resultado, page.created_at,
         page.updated_at, counts.total_count
    from counts left join page on true;
end;
$$;

revoke all on function public.list_urge_events(uuid, uuid, date, date, text, integer, timestamptz, uuid)
  from public, anon, authenticated;
grant execute on function public.list_urge_events(uuid, uuid, date, date, text, integer, timestamptz, uuid)
  to service_role;
