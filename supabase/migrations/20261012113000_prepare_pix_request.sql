-- =========================================================
-- PÉ DE MOÇA - PREPARAÇÃO ATÔMICA DA REQUISIÇÃO PIX
-- =========================================================

create or replace function public.prepare_pix_request(
  p_attempt_id uuid,
  p_idempotency_key uuid,
  p_payer_email text,
  p_request_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
set statement_timeout = '10s'
as $$
declare
  v_prepared boolean;
  v_order_id uuid;
begin
  if p_attempt_id is null
     or p_idempotency_key is null
     or nullif(btrim(p_payer_email), '') is null
     or p_request_payload is null
     or jsonb_typeof(p_request_payload) <> 'object'
  then
    return false;
  end if;

  -- Bloqueia o pedido associado à tentativa PIX.
  -- Impede alterações concorrentes durante esta transação.
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
    payer_email = p_payer_email,
    request_payload = p_request_payload,
    updated_at = now()
  where a.id = p_attempt_id
    and a.idempotency_key = p_idempotency_key
    and a.status = 'reserved'
        and a.payer_email is null
    and a.request_payload is null
    and exists (
      select 1
      from public.orders as o
      where o.id = a.order_id
        and o.payment_method = 'pix'
        and o.payment_status = 'pending'
        and o.payment_reference is null
        and o.status not in ('cancelled', 'refunded')
        and o.total > 0
                and (
          select coalesce(
            jsonb_agg(k order by k),
            '[]'::jsonb
          )
          from jsonb_object_keys(p_request_payload) as k
        ) = '["external_reference", "payer", "processing_mode", "total_amount", "transactions", "type"]'::jsonb
        and p_request_payload ->> 'type' = 'online'
        and p_request_payload ->> 'processing_mode' = 'automatic'
        and p_request_payload ->> 'external_reference' = o.id::text
         and p_request_payload ->> 'total_amount' =
            replace(
              to_char(o.total, 'FM999999999999990.00'),
              ',', '.'
            )
        and p_request_payload #>> '{payer,email}' = btrim(p_payer_email)
        and jsonb_array_length(
          case
            when jsonb_typeof(
              p_request_payload #> '{transactions,payments}'
            ) = 'array'
            then p_request_payload #> '{transactions,payments}'
            else '[]'::jsonb
          end
        ) = 1
        and p_request_payload #>> '{transactions,payments,0,amount}' =
            replace(
  to_char(o.total, 'FM999999999999990.00'),
  ',', '.'
)
        and p_request_payload #>> '{transactions,payments,0,payment_method,id}' = 'pix'
         and p_request_payload #>> '{transactions,payments,0,payment_method,type}' = 'bank_transfer'
    )
  returning true into v_prepared;

  return coalesce(v_prepared, false);
end;
$$;

revoke all on function public.prepare_pix_request(
  uuid, uuid, text, jsonb
) from public, anon, authenticated;

grant execute on function public.prepare_pix_request(
  uuid, uuid, text, jsonb
) to service_role;