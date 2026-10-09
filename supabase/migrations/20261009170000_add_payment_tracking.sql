
-- =========================================================
-- PÉ DE MOÇA - CONTROLE DE PAGAMENTOS
-- =========================================================

alter table public.orders
  add column if not exists payment_status text,
  add column if not exists payment_provider text,
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz;

-- Somente novos pedidos terão pagamento pendente por padrão.
-- Pedidos antigos permanecem com payment_status NULL.
alter table public.orders
  alter column payment_status set default 'pending';

-- Situações permitidas.
alter table public.orders
  add constraint orders_payment_status_check
  check (
    payment_status is null
    or payment_status in (
      'pending',
      'paid',
      'failed',
      'refunded'
    )
  );

-- Provedores permitidos.
alter table public.orders
  add constraint orders_payment_provider_check
  check (
    payment_provider is null
    or payment_provider in ('mercado_pago')
  );

-- Pagamento marcado como pago exige data de confirmação.
alter table public.orders
  add constraint orders_paid_at_check
  check (
    payment_status is distinct from 'paid'
    or paid_at is not null
  );

-- Evita cobranças duplicadas com a mesma referência.
create unique index if not exists
  orders_payment_reference_unique_idx
on public.orders (
  payment_provider,
  payment_reference
)
where payment_reference is not null;

-- Facilita consultas por status do pagamento.
create index if not exists
  orders_payment_status_idx
on public.orders (payment_status);
