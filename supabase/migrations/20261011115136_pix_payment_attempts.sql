-- =========================================================
-- PÉ DE MOÇA - TENTATIVAS DE PAGAMENTO PIX
-- =========================================================

-- Cada pedido possui uma única tentativa de pagamento PIX.
-- A chave de idempotência permanece estável mesmo após
-- falhas de rede ou novas solicitações do cliente.

create table public.pix_payment_attempts (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id) on delete restrict,

  idempotency_key uuid not null default gen_random_uuid(),

  provider text not null default 'mercado_pago'
    check (provider = 'mercado_pago'),

  provider_order_id text,

  status text not null default 'reserved'
    check (
      status in (
        'reserved',
        'processing',
        'pending',
        'paid',
        'failed',
        'expired'
      )
    ),

  pix_code text,
  qr_code_base64 text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pix_payment_attempts_order_unique
    unique (order_id),

  constraint pix_payment_attempts_idempotency_unique
    unique (idempotency_key),

  constraint pix_payment_attempts_provider_order_unique
    unique (provider_order_id)
);

-- Facilita a busca pelo identificador do Mercado Pago.
create index pix_payment_attempts_provider_idx
  on public.pix_payment_attempts (provider, provider_order_id)
  where provider_order_id is not null;

-- Facilita a consulta de pagamentos pendentes.
create index pix_payment_attempts_status_idx
  on public.pix_payment_attempts (status);

-- Nenhum cliente deve consultar ou alterar diretamente
-- os registros de pagamento.

alter table public.pix_payment_attempts
  enable row level security;

-- Sem políticas públicas:
-- acesso somente por operações autorizadas no backend.

-- =========================================================
-- PROTEÇÃO DOS IDENTIFICADORES DA TENTATIVA PIX
-- =========================================================

create or replace function public.protect_pix_attempt_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.order_id is distinct from old.order_id
     or new.idempotency_key is distinct from old.idempotency_key
     or new.provider is distinct from old.provider
     or new.id is distinct from old.id then
    raise exception 'Identificadores da tentativa PIX não podem ser alterados.';
  end if;

  return new;
end;
$$;

create trigger protect_pix_attempt_identity_trigger
before update on public.pix_payment_attempts
for each row
execute function public.protect_pix_attempt_identity();

-- Restringe a execução da função interna.
revoke all on function public.protect_pix_attempt_identity()
  from public, anon, authenticated;