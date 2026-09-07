-- Server-owned mobile sessions. These tables are accessed only by the API
-- through its privileged Supabase client; no browser/mobile grant is exposed.
create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  refresh_token_hash text not null unique,
  family_id uuid not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  replaced_by uuid references public.app_sessions(id) on delete set null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists app_sessions_usuario_id_idx
  on public.app_sessions (usuario_id);
create index if not exists app_sessions_family_id_idx
  on public.app_sessions (family_id);
create index if not exists app_sessions_expires_at_idx
  on public.app_sessions (expires_at);

alter table public.app_sessions enable row level security;
revoke all on table public.app_sessions from anon, authenticated;
grant all on table public.app_sessions to service_role;

create table if not exists public.api_idempotency (
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  idempotency_key uuid not null,
  request_hash text not null,
  status_code integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  primary key (usuario_id, idempotency_key)
);

create index if not exists api_idempotency_expires_at_idx
  on public.api_idempotency (expires_at);

alter table public.api_idempotency enable row level security;
revoke all on table public.api_idempotency from anon, authenticated;
grant all on table public.api_idempotency to service_role;

comment on table public.app_sessions is
  'Refresh-token sessions owned exclusively by the Revive API.';
comment on table public.api_idempotency is
  'Deduplicates replayed mobile mutations without exposing payloads to clients.';

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_error text
);

create index if not exists device_push_tokens_usuario_id_idx
  on public.device_push_tokens (usuario_id);

alter table public.device_push_tokens enable row level security;
revoke all on table public.device_push_tokens from anon, authenticated;
grant all on table public.device_push_tokens to service_role;

create or replace function public.delete_revive_account(p_usuario_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.registros_diarios
    where vicio_id in (select id from public.vicios where usuario_id = p_usuario_id);
  delete from public.historico_recaidas
    where vicio_id in (select id from public.vicios where usuario_id = p_usuario_id);
  delete from public.metas where usuario_id = p_usuario_id;
  delete from public.vicios where usuario_id = p_usuario_id;
  delete from public.usuarios where id = p_usuario_id;
end;
$$;

revoke all on function public.delete_revive_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_revive_account(uuid) to service_role;
