-- =========================================================
-- PÉ DE MOÇA - DADOS DA REQUISIÇÃO PIX
-- =========================================================

-- Preserva os dados utilizados para solicitar a cobrança.
-- Necessário para recuperação com a mesma chave
-- de idempotência e o mesmo conteúdo.

alter table public.pix_payment_attempts
  add column payer_email text,
  add column request_payload jsonb;

-- Os dados são definidos antes de enviar a cobrança.
-- Não devem ser alterados depois.

create or replace function public.protect_pix_attempt_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.payer_email is not null
     and new.payer_email is distinct from old.payer_email then
    raise exception 'O e-mail da tentativa PIX não pode ser alterado.';
  end if;

  if old.request_payload is not null
     and new.request_payload is distinct from old.request_payload then
    raise exception 'A requisição PIX não pode ser alterada.';
  end if;

  return new;
end;
$$;

create trigger protect_pix_attempt_request_trigger
before update on public.pix_payment_attempts
for each row
execute function public.protect_pix_attempt_request();

revoke all on function public.protect_pix_attempt_request()
  from public, anon, authenticated;