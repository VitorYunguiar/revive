-- Prerequisite: the Express API must use SUPABASE_SERVICE_ROLE_KEY.
-- Revive issues its own JWTs; clients access these tables only through Express.
-- No direct anon/authenticated policies are intended for this architecture.
alter table public.usuarios enable row level security;
alter table public.vicios enable row level security;
alter table public.registros_diarios enable row level security;
alter table public.marcos enable row level security;
alter table public.mensagens_motivacionais enable row level security;
alter table public.metas enable row level security;
alter table public.historico_recaidas enable row level security;

revoke all on table public.usuarios, public.vicios, public.registros_diarios,
  public.marcos, public.mensagens_motivacionais, public.metas,
  public.historico_recaidas from public, anon, authenticated;
grant select, insert, update, delete on table public.usuarios, public.vicios,
  public.registros_diarios, public.marcos, public.mensagens_motivacionais,
  public.metas, public.historico_recaidas to service_role;
