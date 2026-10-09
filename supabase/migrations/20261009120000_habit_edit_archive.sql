-- Online editing with optimistic concurrency. ativo remains the only archive flag.
begin;
alter table public.vicios add column revision integer not null default 1 check (revision > 0);

create function public.habit_start_editable(habit public.vicios)
returns boolean language sql stable security definer set search_path = '' as $$
  select habit.data_ultima_recaida is null
    and not exists(select 1 from public.registros_diarios where vicio_id = habit.id)
    and not exists(select 1 from public.historico_recaidas where vicio_id = habit.id)
    and not exists(select 1 from public.eventos_vontade where vicio_id = habit.id)
    and not exists(select 1 from public.metas where vicio_id = habit.id)
    and not exists(select 1 from public.marcos where vicio_id = habit.id)
    and not exists(select 1 from public.conquistas_permanentes where vicio_id = habit.id)
    and not exists(select 1 from public.segmentos_economia where vicio_id = habit.id and origem = 'prospective_edit');
$$;

create function public.guard_vicio_edit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.data_inicio is distinct from old.data_inicio then
    if new.data_inicio is null or new.data_inicio > (now() at time zone 'UTC') then
      raise exception using errcode = 'P0001', message = 'DATA_INICIO_INVALIDA';
    end if;
    if not public.habit_start_editable(old) then
      raise exception using errcode = 'P0001', message = 'INICIO_COM_HISTORICO';
    end if;
    update public.progresso_ancoras set started_at = new.data_inicio at time zone 'UTC' where vicio_id = old.id;
    update public.progresso_periodos set started_at = new.data_inicio at time zone 'UTC' where vicio_id = old.id;
    update public.segmentos_economia set effective_from = new.data_inicio at time zone 'UTC' where vicio_id = old.id;
  end if;
  new.revision := old.revision + 1;
  return new;
end;
$$;
create trigger vicios_guard_edit before update on public.vicios
  for each row execute function public.guard_vicio_edit();

-- Lock the same habit as PATCH so legacy writers and in-flight mutations cannot
-- insert dependent events after archival or race an allowed start-date correction.
create function public.require_active_habit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_active boolean;
begin
  if new.vicio_id is null then return new; end if;
  select ativo into v_active from public.vicios where id = new.vicio_id for update;
  if v_active is false then
    raise exception using errcode = 'P0001', message = 'HABITO_ARQUIVADO';
  end if;
  return new;
end;
$$;
create trigger registros_require_active before insert on public.registros_diarios for each row execute function public.require_active_habit();
create trigger recaidas_require_active before insert on public.historico_recaidas for each row execute function public.require_active_habit();
create trigger vontades_require_active before insert on public.eventos_vontade for each row execute function public.require_active_habit();
create trigger metas_require_active before insert on public.metas for each row execute function public.require_active_habit();

create function public.lock_habit_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.vicio_id is not null then perform id from public.vicios where id = new.vicio_id for update; end if;
  return new;
end;
$$;
create trigger marcos_lock_habit before insert on public.marcos for each row execute function public.lock_habit_history();
create trigger conquistas_lock_habit before insert on public.conquistas_permanentes for each row execute function public.lock_habit_history();

create function public.edit_revive_habit(p_usuario_id uuid, p_vicio_id uuid, p_revision integer, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_habit public.vicios%rowtype;
begin
  select * into v_habit from public.vicios where id = p_vicio_id and usuario_id = p_usuario_id for update;
  if not found then return jsonb_build_object('status', 404, 'codigo', 'VICIO_NAO_ENCONTRADO'); end if;
  if p_revision is null or p_revision < 1 then return jsonb_build_object('status', 422, 'codigo', 'DADOS_INVALIDOS'); end if;
  if v_habit.revision <> p_revision then return jsonb_build_object('status', 409, 'codigo', 'REVISAO_CONFLITO'); end if;
  if jsonb_typeof(p_patch) is distinct from 'object' or p_patch = '{}'::jsonb
     or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('nome_vicio','data_inicio','valor_economizado_por_dia','ativo'))
     or (p_patch ? 'nome_vicio' and (jsonb_typeof(p_patch->'nome_vicio') <> 'string' or length(btrim(p_patch->>'nome_vicio')) not between 2 and 120))
     or (p_patch ? 'ativo' and jsonb_typeof(p_patch->'ativo') <> 'boolean')
     or (p_patch ? 'valor_economizado_por_dia' and (jsonb_typeof(p_patch->'valor_economizado_por_dia') <> 'number'
       or (p_patch->>'valor_economizado_por_dia')::numeric not between 0 and 99999999.99
       or (p_patch->>'valor_economizado_por_dia')::numeric <> round((p_patch->>'valor_economizado_por_dia')::numeric, 2))) then
    return jsonb_build_object('status', 422, 'codigo', 'DADOS_INVALIDOS');
  end if;
  if p_patch ? 'data_inicio' then
    if jsonb_typeof(p_patch->'data_inicio') <> 'string' or (p_patch->>'data_inicio') !~ '^\d{4}-\d{2}-\d{2}$'
       or (p_patch->>'data_inicio')::date > (now() at time zone 'UTC')::date then
      return jsonb_build_object('status', 422, 'codigo', 'DATA_INICIO_INVALIDA');
    end if;
  end if;
  update public.vicios set
    nome_vicio = case when p_patch ? 'nome_vicio' then btrim(p_patch->>'nome_vicio') else nome_vicio end,
    valor_economizado_por_dia = case when p_patch ? 'valor_economizado_por_dia' then (p_patch->>'valor_economizado_por_dia')::numeric else valor_economizado_por_dia end,
    data_inicio = case when p_patch ? 'data_inicio' then (p_patch->>'data_inicio')::date else data_inicio end,
    ativo = case when p_patch ? 'ativo' then (p_patch->>'ativo')::boolean else ativo end
  where id = p_vicio_id and usuario_id = p_usuario_id returning * into v_habit;
  return jsonb_build_object('status', 200, 'vicio', to_jsonb(v_habit));
exception
  when sqlstate 'P0001' then
    if sqlerrm = 'INICIO_COM_HISTORICO' then return jsonb_build_object('status', 409, 'codigo', sqlerrm); end if;
    raise;
  when invalid_datetime_format or datetime_field_overflow or invalid_text_representation or numeric_value_out_of_range then
    return jsonb_build_object('status', 422, 'codigo', 'DADOS_INVALIDOS');
end;
$$;
revoke all on function public.lock_habit_history(), public.habit_start_editable(public.vicios), public.guard_vicio_edit(), public.require_active_habit(), public.edit_revive_habit(uuid,uuid,integer,jsonb) from public, anon, authenticated;
grant execute on function public.lock_habit_history(), public.habit_start_editable(public.vicios), public.guard_vicio_edit(), public.require_active_habit(), public.edit_revive_habit(uuid,uuid,integer,jsonb) to service_role;

-- Keep new goal baselines consistent with prospective financial segments.
create function public.current_habit_savings(p_vicio_id uuid)
returns numeric language plpgsql security definer set search_path = '' as $$
declare v_period public.progresso_periodos%rowtype; v_segment public.segmentos_economia%rowtype;
  v_now timestamptz := now(); v_cursor timestamptz; v_start timestamptz; v_end timestamptz; v_total numeric := 0;
begin
  select * into v_period from public.progresso_periodos where vicio_id = p_vicio_id and ended_at is null;
  if not found or v_period.cobertura = 'unknown' then return null; end if;
  -- Match the API progress contract: only complete 24-hour days are valued.
  v_now := v_period.started_at + greatest(0, floor(extract(epoch from (v_now - v_period.started_at)) / 86400)) * interval '24 hours';
  v_cursor := v_period.started_at;
  if v_cursor >= v_now then return 0; end if;
  for v_segment in select * from public.segmentos_economia where vicio_id = p_vicio_id
    and effective_from < v_now and coalesce(effective_to, v_now) > v_period.started_at order by effective_from, id loop
    if v_segment.effective_from > v_cursor then return null; end if;
    v_start := greatest(v_cursor, v_segment.effective_from);
    v_end := least(v_now, coalesce(v_segment.effective_to, v_now));
    if v_end > v_start then
      if v_segment.valor_diario is null or v_segment.cobertura = 'unknown' then return null; end if;
      v_total := v_total + extract(epoch from (v_end - v_start)) / 86400 * v_segment.valor_diario;
      v_cursor := v_end;
    end if;
  end loop;
  if v_cursor < v_now then return null; end if;
  return round(v_total, 2);
end;
$$;
revoke all on function public.current_habit_savings(uuid) from public, anon, authenticated;
grant execute on function public.current_habit_savings(uuid) to service_role;

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
          case when v_start_today then coalesce(public.current_habit_savings(v_addiction.id), 0) else 0 end)
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

commit;
