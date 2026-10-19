
-- =========================================================
-- PÉ DE MOÇA - RECUPERAÇÃO SEGURA DE COBRANÇAS PIX
-- =========================================================
-- Permite concluir o registro de uma cobrança recuperada
-- somente quando o identificador existente é nulo
-- ou corresponde exatamente ao identificador recebido.
--
-- Não cria cobranças no Mercado Pago.

begin;

set local lock_timeout = '5s';

create or replace function public.save_pix_payment_response(
  p_attempt_id uuid,
  p_idempotency_key uuid,
  p_provider_order_id text,
  p_pix_code text,
  p_qr_code_base64 text
)
returns boolean
language plpgsql
security definer
set search_path = ''
set statement_timeout = '10s'
as $$
declare
  v_saved boolean;
  v_order_id uuid;
begin
  if p_attempt_id is null
     or p_idempotency_key is null
     or nullif(btrim(p_provider_order_id), '') is null
     or nullif(btrim(p_pix_code), '') is null then
    return false;
  end if;

  -- Serializa alterações concorrentes do mesmo pedido.
  select o.id
    into v_order_id
  from public.orders as o
  join public.pix_payment_attempts as a
    on a.order_id = o.id
  where a.id = p_attempt_id
    and a.idempotency_key = p_idempotency_key
    and a.status = 'processing'
    and (
      a.provider_order_id is null
      or a.provider_order_id = p_provider_order_id
    )
    and o.payment_method = 'pix'
    and o.payment_status = 'pending'
    and o.payment_reference is null
    and o.status not in ('cancelled', 'refunded')
  for update of o;

  if v_order_id is null then
    return false;
  end if;

  -- Nunca substitui um ID do Mercado Pago por outro.
  update public.pix_payment_attempts as a
  set
    provider_order_id = p_provider_order_id,
    pix_code = p_pix_code,
    qr_code_base64 = p_qr_code_base64,
    status = 'pending',
    updated_at = now()
  where a.id = p_attempt_id
    and a.idempotency_key = p_idempotency_key
    and a.status = 'processing'
    and (
      a.provider_order_id is null
      or a.provider_order_id = p_provider_order_id
    )
    and exists (
      select 1
      from public.orders as o
      where o.id = a.order_id
        and o.payment_method = 'pix'
        and o.payment_status = 'pending'
        and o.payment_reference is null
        and o.status not in ('cancelled', 'refunded')
    )
  returning true into v_saved;

  if not coalesce(v_saved, false) then
    return false;
  end if;

  -- Vincula a mesma cobrança ao pedido, na mesma transação.
  update public.orders as o
  set
    payment_provider = 'mercado_pago',
    payment_reference = p_provider_order_id
  where o.id = v_order_id
    and o.payment_method = 'pix'
    and o.payment_status = 'pending'
    and o.payment_reference is null
    and o.status not in ('cancelled', 'refunded');

  if not found then
    raise exception
      'Não foi possível vincular o pagamento PIX ao pedido.';
  end if;

  return true;
end;
$$;

revoke all on function public.save_pix_payment_response(
  uuid, uuid, text, text, text
) from public, anon, authenticated;

grant execute on function public.save_pix_payment_response(
  uuid, uuid, text, text, text
) to service_role;

commit;
