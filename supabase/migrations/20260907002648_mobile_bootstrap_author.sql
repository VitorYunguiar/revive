-- Optional attribution consumed by /api/v2/bootstrap.
alter table public.mensagens_motivacionais
  add column if not exists autor text;
