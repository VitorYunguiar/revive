-- Additive rollout: old signed web tokens are accepted only at version zero.
begin;
alter table public.usuarios add column if not exists credential_version bigint not null default 0
  check (credential_version >= 0);

create table public.password_recovery_requests (
  id uuid primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  email_key text not null check (email_key ~ '^[0-9a-f]{64}$'),
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  attempts smallint not null default 0 check (attempts between 0 and 5),
  consumed_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create index password_recovery_user_idx on public.password_recovery_requests(usuario_id);
create index password_recovery_expiry_idx on public.password_recovery_requests(expires_at);

create table public.password_recovery_limits (
  kind text not null,
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_at timestamptz not null,
  hits integer not null check (hits > 0),
  last_accepted_at timestamptz not null,
  primary key(kind, key_hash, window_at)
);
create index password_recovery_limits_window_idx on public.password_recovery_limits(window_at);
alter table public.password_recovery_requests enable row level security;
alter table public.password_recovery_limits enable row level security;
revoke all on public.password_recovery_requests, public.password_recovery_limits from public, anon, authenticated;
grant all on public.password_recovery_requests, public.password_recovery_limits to service_role;

create function public.take_recovery_limit(p_kind text, p_key text, p_window integer, p_max integer, p_cooldown integer default 0)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  now_at timestamptz;
  starts_at timestamptz;
  counter public.password_recovery_limits%rowtype;
  last_accepted timestamptz;
begin
  -- Serialize this key across windows so resend cannot bypass the cooldown
  -- at an hour boundary. Rejected attempts never move the accepted timestamp.
  perform pg_advisory_xact_lock(hashtextextended(p_kind || ':' || p_key, 0));
  now_at := clock_timestamp();
  select max(last_accepted_at) into last_accepted from public.password_recovery_limits
    where kind=p_kind and key_hash=p_key;
  starts_at := to_timestamp(floor(extract(epoch from now_at) / p_window) * p_window);
  insert into public.password_recovery_limits(kind,key_hash,window_at,hits,last_accepted_at)
    values (p_kind,p_key,starts_at,1,coalesce(last_accepted, '-infinity'::timestamptz))
    on conflict(kind,key_hash,window_at) do update set hits = public.password_recovery_limits.hits + 1
    returning * into counter;
  if counter.hits > p_max then return false; end if;
  if p_cooldown > 0 and last_accepted > now_at - make_interval(secs => p_cooldown) then return false; end if;
  update public.password_recovery_limits set last_accepted_at=now_at
    where kind=p_kind and key_hash=p_key and window_at=starts_at;
  return true;
end;
$$;
revoke all on function public.take_recovery_limit(text,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.take_recovery_limit(text,text,integer,integer,integer) to service_role;

create function public.request_password_recovery(p_email text, p_email_key text, p_origin_key text, p_request_id uuid, p_code_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare account public.usuarios%rowtype;
begin
  if not public.take_recovery_limit('request_origin',p_origin_key,900,20)
     or not public.take_recovery_limit('request_email',p_email_key,3600,6,60) then
    return jsonb_build_object('status','limited');
  end if;
  select * into account from public.usuarios where email=p_email for update;
  if not found then return jsonb_build_object('status','absent'); end if;
  update public.password_recovery_requests set consumed_at=clock_timestamp()
    where usuario_id=account.id and consumed_at is null;
  insert into public.password_recovery_requests(id,usuario_id,email_key,code_hash,expires_at)
    values(p_request_id,account.id,p_email_key,p_code_hash,clock_timestamp()+interval '10 minutes');
  return jsonb_build_object('status','created','email',account.email);
end;
$$;

create function public.confirm_password_recovery(p_email_key text, p_origin_key text, p_request_id uuid, p_code_hash text, p_password_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  recovery public.password_recovery_requests%rowtype;
  account_id uuid;
begin
  if not public.take_recovery_limit('confirm_origin',p_origin_key,3600,60)
     or not public.take_recovery_limit('confirm_email',p_email_key,3600,30) then
    return jsonb_build_object('status','limited');
  end if;
  select usuario_id into account_id from public.password_recovery_requests
    where id=p_request_id and email_key=p_email_key;
  if not found then return jsonb_build_object('status','invalid'); end if;
  -- All credential operations use account -> request/session lock order.
  perform 1 from public.usuarios where id=account_id for update;
  if not found then return jsonb_build_object('status','invalid'); end if;
  select * into recovery from public.password_recovery_requests where id=p_request_id for update;
  if recovery.consumed_at is not null or recovery.expires_at <= clock_timestamp() or recovery.attempts >= 5 then
    return jsonb_build_object('status','invalid');
  end if;
  if recovery.code_hash <> p_code_hash then
    update public.password_recovery_requests set attempts=attempts+1,
      consumed_at=case when attempts+1 >= 5 then clock_timestamp() else null end where id=p_request_id;
    return jsonb_build_object('status','invalid');
  end if;
  if p_password_hash !~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$' then
    raise exception 'Invalid password hash';
  end if;
  update public.usuarios set senha_hash=p_password_hash where id=account_id;
  update public.password_recovery_requests set consumed_at=clock_timestamp()
    where usuario_id=account_id and consumed_at is null;
  return jsonb_build_object('status','changed');
end;
$$;
revoke all on function public.request_password_recovery(text,text,text,uuid,text),
  public.confirm_password_recovery(text,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.request_password_recovery(text,text,text,uuid,text),
  public.confirm_password_recovery(text,text,uuid,text,text) to service_role;

create function public.advance_credential_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.senha_hash is distinct from old.senha_hash then
    new.credential_version := old.credential_version + 1;
    update public.password_recovery_requests set consumed_at=clock_timestamp()
      where usuario_id=new.id and consumed_at is null;
  end if;
  return new;
end;
$$;
revoke all on function public.advance_credential_version() from public, anon, authenticated;
grant execute on function public.advance_credential_version() to service_role;
create trigger advance_credential_version before update of senha_hash on public.usuarios
  for each row execute function public.advance_credential_version();
-- The existing AFTER password-change trigger revokes app_sessions in this transaction.

create function public.create_mobile_session(p_usuario_id uuid, p_expected_hash text, p_id uuid, p_refresh_hash text, p_family_id uuid, p_user_agent text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare account public.usuarios%rowtype;
begin
  select * into account from public.usuarios where id=p_usuario_id for update;
  if not found or account.senha_hash <> p_expected_hash then return jsonb_build_object('status','invalid'); end if;
  insert into public.app_sessions(id,usuario_id,refresh_token_hash,family_id,expires_at,user_agent)
    values(p_id,account.id,p_refresh_hash,p_family_id,clock_timestamp()+interval '30 days',p_user_agent);
  return jsonb_build_object('status','created','credential_version',account.credential_version);
end;
$$;
revoke all on function public.create_mobile_session(uuid,text,uuid,text,uuid,text) from public, anon, authenticated;
grant execute on function public.create_mobile_session(uuid,text,uuid,text,uuid,text) to service_role;

create or replace function public.rotate_mobile_session(p_refresh_token_hash text, p_replacement_id uuid, p_replacement_hash text, p_user_agent text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_session public.app_sessions%rowtype;
  account public.usuarios%rowtype;
  owner_id uuid;
  now_at timestamptz;
begin
  select usuario_id into owner_id from public.app_sessions where refresh_token_hash=p_refresh_token_hash;
  if not found then return jsonb_build_object('status','invalid'); end if;
  select * into account from public.usuarios where id=owner_id for update;
  if not found then return jsonb_build_object('status','invalid'); end if;
  select * into current_session from public.app_sessions where refresh_token_hash=p_refresh_token_hash for update;
  if not found then return jsonb_build_object('status','invalid'); end if;
  now_at := clock_timestamp();
  if current_session.revoked_at is not null then
    if current_session.replaced_by is not null then
      update public.app_sessions set revoked_at=now_at where family_id=current_session.family_id and revoked_at is null;
      return jsonb_build_object('status','reused');
    end if;
    return jsonb_build_object('status','invalid');
  end if;
  if current_session.expires_at <= now_at then
    update public.app_sessions set revoked_at=now_at where id=current_session.id;
    return jsonb_build_object('status','expired');
  end if;
  insert into public.app_sessions(id,usuario_id,refresh_token_hash,family_id,expires_at,user_agent)
    values(p_replacement_id,owner_id,p_replacement_hash,current_session.family_id,now_at+interval '30 days',p_user_agent);
  update public.app_sessions set revoked_at=now_at,replaced_by=p_replacement_id,last_used_at=now_at where id=current_session.id;
  return jsonb_build_object('status','rotated','usuario_id',account.id,'nome',account.nome,'email',account.email,
    'credential_version',account.credential_version);
end;
$$;
revoke all on function public.rotate_mobile_session(text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.rotate_mobile_session(text,uuid,text,text) to service_role;
commit;
