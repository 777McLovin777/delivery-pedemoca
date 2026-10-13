-- =========================================================
-- PÉ DE MOÇA - RESERVA ATÔMICA DE TENTATIVA PIX
-- =========================================================

create or replace function public.reserve_pix_payment_attempt(
  p_order_id uuid,
  p_checkout_token uuid
)
returns table (
  attempt_id uuid,
  idempotency_key uuid,
  attempt_status text,
  provider_order_id text,
  pix_code text,
  qr_code_base64 text
)
language plpgsql
security definer
set search_path = ''
set statement_timeout = '10s'
as $$
declare
  v_order_id uuid;
begin
  if p_order_id is null or p_checkout_token is null then
    raise exception 'Identificação do pedido inválida.';
  end if;

  -- Bloqueia o pedido durante esta transação.
  -- Duas reservas simultâneas serão processadas em sequência.
  select o.id
    into v_order_id
  from public.orders as o
  where o.id = p_order_id
    and o.checkout_token = p_checkout_token
    and o.payment_method = 'pix'
    and o.payment_status = 'pending'
    and o.status not in ('cancelled', 'refunded')
  for update;

  if v_order_id is null then
    raise exception 'Pedido indisponível para pagamento PIX.';
  end if;

  -- Cria uma tentativa somente se o pedido ainda não possuir uma.
  insert into public.pix_payment_attempts (order_id)
  values (v_order_id)
  on conflict (order_id) do nothing;

  -- Recupera a tentativa existente ou recém-criada.
  return query
  select
    a.id,
    a.idempotency_key,
    a.status,
    a.provider_order_id,
    a.pix_code,
    a.qr_code_base64
  from public.pix_payment_attempts as a
  where a.order_id = v_order_id;
end;
$$;

-- Esta função utiliza privilégios elevados.
-- Apenas o backend com service_role poderá executá-la.

revoke all on function public.reserve_pix_payment_attempt(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.reserve_pix_payment_attempt(uuid, uuid)
  to service_role;