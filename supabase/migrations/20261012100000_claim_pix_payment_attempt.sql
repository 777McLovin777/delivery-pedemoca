create or replace function public.claim_pix_payment_attempt(
  p_attempt_id uuid,
  p_idempotency_key uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed boolean;
  v_order_id uuid;
begin
  if p_attempt_id is null or p_idempotency_key is null then
    return false;
  end if;

  select o.id
    into v_order_id
  from public.orders as o
  join public.pix_payment_attempts as a
    on a.order_id = o.id
  where a.id = p_attempt_id
    and a.idempotency_key = p_idempotency_key
    and a.status = 'reserved'
    and o.payment_method = 'pix'
    and o.payment_status = 'pending'
    and o.payment_reference is null
    and o.status not in ('cancelled', 'refunded')
  for update of o;

  if v_order_id is null then
    return false;
  end if;

  update public.pix_payment_attempts as a
  set
    status = 'processing',
    updated_at = now()
  where a.id = p_attempt_id
    and a.idempotency_key = p_idempotency_key
    and a.status = 'reserved'
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

revoke all on function public.claim_pix_payment_attempt(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.claim_pix_payment_attempt(uuid, uuid)
  to service_role;