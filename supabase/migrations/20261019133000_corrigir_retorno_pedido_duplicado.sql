-- =========================================================
-- CRIAÇÃO TRANSACIONAL DE PEDIDOS
-- Issue #20
-- =========================================================

create or replace function public.criar_pedido(
  p_checkout_token uuid,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment_type text,
  p_delivery_neighborhood_id bigint,
  p_delivery_address text,
  p_delivery_number text,
  p_delivery_complement text,
  p_delivery_reference text,
  p_pickup_location_id bigint,
  p_payment_method text,
  p_cash_given numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number bigint;

  v_subtotal numeric(10, 2) := 0;
  v_delivery_fee numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;

  v_change_amount numeric(10, 2);
  v_estimated_at timestamptz;

  v_delivery_neighborhood_name text;

  v_existing_order_id uuid;
  v_existing_order_number bigint;

  -- Dados temporários usados durante a validação dos itens.
  v_item jsonb;
  v_product_id integer;
  v_product_name text;
  v_product_price numeric(10, 2);
  v_product_allows_addons boolean;
  v_quantity integer;
  v_observation text;

  v_customizations jsonb;
  v_addon_name text;
  v_addon_code text;
  v_addon_quantity integer;
  v_addon_price numeric(10, 2);
  v_addons_unit_total numeric(10, 2);
  v_unit_price numeric(10, 2);
  v_line_total numeric(10, 2);

  -- Snapshot dos complementos exatamente como foram
  -- calculados no momento da criação do pedido.
   v_customization_snapshot jsonb;

  -- Item reconstruído e validado antes de ser gravado no pedido.
   -- Lista interna dos itens já validados e precificados.
  -- Nunca utiliza preços enviados pelo navegador.
  v_validated_items jsonb := '[]'::jsonb;

begin
  -- =========================================================
  -- VALIDAÇÕES BÁSICAS
  -- =========================================================

  p_customer_name := btrim(p_customer_name);
  p_customer_phone := regexp_replace(
    coalesce(p_customer_phone, ''),
    '[^0-9]',
    '',
    'g'
  );

  if p_checkout_token is null then
    raise exception 'Token do checkout não informado.';
  end if;

  if p_customer_name is null or p_customer_name = '' then
    raise exception 'Nome do cliente não informado.';
  end if;

  if char_length(p_customer_name) > 120 then
    raise exception 'Nome do cliente excede o limite permitido.';
  end if;

  if p_customer_phone = ''
     or char_length(p_customer_phone) < 10
     or char_length(p_customer_phone) > 13 then
    raise exception 'Telefone inválido.';
  end if;

  if p_fulfillment_type is null
   or p_fulfillment_type not in ('delivery', 'pickup') then
    raise exception 'Tipo de atendimento inválido.';
  end if;

  if p_payment_method is null
   or p_payment_method not in ('pix', 'cash') then
    raise exception 'Forma de pagamento inválida.';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'O pedido precisa possuir pelo menos um item.';
  end if;

  -- =========================================================
  -- PROTEÇÃO CONTRA PEDIDO DUPLICADO
  -- =========================================================

  -- Impede que duas requisições com o mesmo checkout_token
  -- criem o pedido simultaneamente.
  perform pg_advisory_xact_lock(
    hashtextextended(p_checkout_token::text, 0)
  );

  select
    id,
    order_number,
    subtotal,
    delivery_fee,
    total,
    change_amount,
    estimated_at
  into
    v_existing_order_id,
    v_existing_order_number,
    v_subtotal,
    v_delivery_fee,
    v_total,
    v_change_amount,
    v_estimated_at
  from public.orders
  where checkout_token = p_checkout_token
  limit 1;

  if v_existing_order_id is not null then
    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'order_id', v_existing_order_id,
      'order_number', v_existing_order_number,
      'subtotal', v_subtotal,
      'delivery_fee', v_delivery_fee,
      'total', v_total,
      'change_amount', v_change_amount,
      'estimated_at', v_estimated_at
    );
  end if;

    -- =========================================================
  -- ENTREGA OU RETIRADA
  -- =========================================================

  if p_fulfillment_type = 'delivery' then

    if p_delivery_neighborhood_id is null then
      raise exception 'Bairro de entrega não informado.';
    end if;

    if p_delivery_address is null
       or btrim(p_delivery_address) = '' then
      raise exception 'Endereço de entrega não informado.';
    end if;

    if p_delivery_number is null
       or btrim(p_delivery_number) = '' then
      raise exception 'Número do endereço não informado.';
    end if;

    select
      name,
      delivery_fee
    into
      v_delivery_neighborhood_name,
      v_delivery_fee
    from public.delivery_neighborhoods
    where id = p_delivery_neighborhood_id
      and is_active = true;

    if not found then
      raise exception 'Bairro de entrega inválido ou indisponível.';
    end if;

  else

    if p_pickup_location_id is null then
      raise exception 'Local de retirada não informado.';
    end if;

    perform 1
    from public.pickup_locations
    where id = p_pickup_location_id
      and is_active = true;

    if not found then
      raise exception 'Local de retirada inválido ou indisponível.';
    end if;

    v_delivery_fee := 0;

  end if;

  -- Previsão inicial: até 1 hora.
  v_estimated_at := now() + interval '1 hour';

    -- =========================================================
  -- VALIDAÇÃO DOS PRODUTOS
  -- =========================================================

  v_subtotal := 0;

   for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop

    -- Cada item do carrinho precisa ser um objeto JSON.
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Item do pedido em formato inválido.';
    end if;

    -- Produto personalizado possui baseProductId.
    -- Produto comum utiliza o próprio id.
    begin
      v_product_id := coalesce(
        nullif(v_item ->> 'baseProductId', '')::integer,
        nullif(v_item ->> 'id', '')::integer
      );
    exception
      when invalid_text_representation
        or numeric_value_out_of_range then
        raise exception 'Identificador de produto inválido.';
    end;

    if v_product_id is null then
      raise exception 'Produto sem identificador.';
    end if;

    -- Quantidade precisa ser um número inteiro positivo.
    begin
      v_quantity := (v_item ->> 'quantity')::integer;
    exception
      when invalid_text_representation
        or numeric_value_out_of_range then
        raise exception 'Quantidade inválida para o produto.';
    end;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Quantidade inválida para o produto.';
    end if;

    -- Observação é opcional, mas limitada a 150 caracteres.
    v_observation := nullif(
      btrim(coalesce(v_item ->> 'observation', '')),
      ''
    );

    if v_observation is not null
       and char_length(v_observation) > 150 then
      raise exception 'A observação do produto excede 150 caracteres.';
    end if;

    -- Busca nome, preço e permissão de complementos
    -- diretamente no catálogo oficial.
    select
      name,
      price,
      allows_addons
    into
      v_product_name,
      v_product_price,
      v_product_allows_addons
    from public.checkout_products
    where id = v_product_id
      and is_active = true;

    if not found then
      raise exception 'Produto inválido ou indisponível.';
    end if;

        -- Nunca utilizamos item.price enviado pelo navegador.
    v_addons_unit_total := 0;

      -- Produtos sem complementos podem não possuir a propriedade
    -- customizations ou podem enviá-la explicitamente como JSON null.
    if v_item -> 'customizations' is null
       or v_item -> 'customizations' = 'null'::jsonb then
      v_customizations := '{}'::jsonb;
    else
      v_customizations := v_item -> 'customizations';
    end if;

    -- Quando informado, customizations obrigatoriamente
    -- precisa ser um objeto JSON.
    if jsonb_typeof(v_customizations) <> 'object' then
      raise exception 'Formato de complementos inválido.';
    end if;

    -- Começa o snapshot deste item com uma lista vazia.
    v_customization_snapshot :=
      jsonb_build_object(
        'addons',
        '[]'::jsonb
      );

    -- =======================================================
    -- COMPLEMENTOS
    -- =======================================================

       for v_addon_name in
      select key
      from jsonb_each(v_customizations)
    loop

      -- Apenas os complementos oficiais são aceitos,
      -- mesmo quando a quantidade enviada for zero.
      v_addon_code :=
        case v_addon_name
          when 'Calda de chocolate ao leite'
            then 'milk_chocolate_sauce'

          when 'Calda de chocolate branco'
            then 'white_chocolate_sauce'

          when 'Calda de doce de leite'
            then 'dulce_de_leche_sauce'

          else null
        end;

      if v_addon_code is null then
        raise exception 'Complemento inválido.';
      end if;

      -- A quantidade precisa ser um número inteiro não negativo.
      begin
        v_addon_quantity :=
          (v_customizations ->> v_addon_name)::integer;
      exception
        when invalid_text_representation
          or numeric_value_out_of_range then
          raise exception 'Quantidade de complemento inválida.';
      end;

      if v_addon_quantity is null
         or v_addon_quantity < 0 then
        raise exception 'Quantidade de complemento inválida.';
      end if;

      -- Quantidade zero significa que o complemento
      -- não foi escolhido.
      if v_addon_quantity > 0 then

        if not v_product_allows_addons then
          raise exception 'Este produto não permite complementos.';
        end if;

        select price
        into v_addon_price
        from public.checkout_addons
        where code = v_addon_code
          and is_active = true;

        if not found then
          raise exception 'Complemento inválido ou indisponível.';
        end if;

        v_addons_unit_total :=
          v_addons_unit_total
          + (v_addon_price * v_addon_quantity);

        -- Guarda uma fotografia do complemento no momento
        -- em que o pedido foi realizado.
        v_customization_snapshot :=
          jsonb_set(
            v_customization_snapshot,
            '{addons}',
            (v_customization_snapshot -> 'addons')
            || jsonb_build_array(
              jsonb_build_object(
                'code', v_addon_code,
                'name', v_addon_name,
                'unit_price', v_addon_price,
                'quantity', v_addon_quantity
              )
            )
          );

      end if;

    end loop;

    -- Preço oficial de uma unidade:
    -- produto + todos os complementos escolhidos.
    v_unit_price :=
      v_product_price + v_addons_unit_total;

    -- Total desta linha do carrinho.
    v_line_total :=
      v_unit_price * v_quantity;

       -- Soma ao subtotal geral do pedido.
    v_subtotal :=
      v_subtotal + v_line_total;

    -- Guarda o item já validado e precificado.
    -- Estes dados serão usados posteriormente para criar order_items.
    v_validated_items :=
      v_validated_items ||
      jsonb_build_array(
        jsonb_build_object(
          'product_id', v_product_id,
          'product_name', v_product_name,
          'unit_price', v_unit_price,
          'quantity', v_quantity,
          'customization', v_customization_snapshot,
          'observation', v_observation,
          'line_total', v_line_total
        )
      );

  end loop;

    -- =========================================================
  -- TOTAL DO PEDIDO
  -- =========================================================

  v_total := v_subtotal + v_delivery_fee;

  -- =========================================================
  -- PAGAMENTO
  -- =========================================================

  if p_payment_method = 'pix' then

    -- PIX não utiliza valor em dinheiro nem troco.
    if p_cash_given is not null then
      raise exception 'Valor para troco não deve ser informado no PIX.';
    end if;

    v_change_amount := null;

  elsif p_payment_method = 'cash' then

    -- NULL significa que o cliente não precisa de troco.
    if p_cash_given is null then
      v_change_amount := null;

    else

      if p_cash_given < v_total then
        raise exception 'O valor informado para pagamento é menor que o total do pedido.';
      end if;

      v_change_amount := p_cash_given - v_total;

    end if;

  end if;

    -- =========================================================
  -- CLIENTE
  -- =========================================================

  insert into public.customers (
    name,
    phone
  )
  values (
    p_customer_name,
    p_customer_phone
  )
  on conflict (phone)
  do update set
    name = excluded.name,
    updated_at = now()
  returning id
  into v_customer_id;

  if v_customer_id is null then
    raise exception 'Não foi possível identificar o cliente.';
  end if;

    -- =========================================================
  -- PEDIDO
  -- =========================================================

  insert into public.orders (
    customer_id,
    status,
    subtotal,
    delivery_fee,
    total,
    fulfillment_type,

    delivery_neighborhood_id,
    delivery_address,
    delivery_number,
    delivery_complement,
    delivery_reference,
    delivery_neighborhood_name,

    pickup_location_id,

    payment_method,
    cash_given,
    change_amount,

    estimated_at,
    checkout_token,
    checkout_version
  )
  values (
    v_customer_id,
    'pending',
    v_subtotal,
    v_delivery_fee,
    v_total,
    p_fulfillment_type,

    case
      when p_fulfillment_type = 'delivery'
        then p_delivery_neighborhood_id
      else null
    end,

    case
      when p_fulfillment_type = 'delivery'
        then btrim(p_delivery_address)
      else null
    end,

    case
      when p_fulfillment_type = 'delivery'
        then btrim(p_delivery_number)
      else null
    end,

    case
      when p_fulfillment_type = 'delivery'
        then nullif(btrim(coalesce(p_delivery_complement, '')), '')
      else null
    end,

    case
      when p_fulfillment_type = 'delivery'
        then nullif(btrim(coalesce(p_delivery_reference, '')), '')
      else null
    end,

    case
      when p_fulfillment_type = 'delivery'
        then v_delivery_neighborhood_name
      else null
    end,

    case
      when p_fulfillment_type = 'pickup'
        then p_pickup_location_id
      else null
    end,

    p_payment_method,

    case
      when p_payment_method = 'cash'
        then p_cash_given
      else null
    end,

    v_change_amount,

    v_estimated_at,
    p_checkout_token,
    1
  )
  returning
    id,
    order_number
  into
    v_order_id,
    v_order_number;

  if v_order_id is null then
    raise exception 'Não foi possível criar o pedido.';
  end if;

    -- =========================================================
  -- ITENS DO PEDIDO
  -- =========================================================

  for v_item in
    select value
    from jsonb_array_elements(v_validated_items)
  loop

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      customization,
      observation,
      line_total
    )
    values (
      v_order_id,
      v_item ->> 'product_id',
      v_item ->> 'product_name',
      (v_item ->> 'unit_price')::numeric,
      (v_item ->> 'quantity')::integer,
      v_item -> 'customization',
      nullif(v_item ->> 'observation', ''),
      (v_item ->> 'line_total')::numeric
    );

  end loop;

  -- =========================================================
  -- RESPOSTA
  -- =========================================================

  return jsonb_build_object(
  'success', true,
  'duplicate', false,
  'message', 'Pedido criado com sucesso',
  'order_id', v_order_id,
  'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total', v_total,
    'change_amount', v_change_amount,
    'estimated_at', v_estimated_at
  );

end;
$$;

-- =========================================================
-- PERMISSÕES DA FUNÇÃO
-- =========================================================

-- Remove a execução direta da função pelo público,
-- usuários anônimos e usuários autenticados.
revoke all on function public.criar_pedido(
  uuid,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text,
  text,
  bigint,
  text,
  numeric,
  jsonb
) from public, anon, authenticated;

-- Apenas o backend com service_role pode criar pedidos
-- através desta função.
grant execute on function public.criar_pedido(
  uuid,
  text,
  text,
  text,
  bigint,
  text,
  text,
  text,
  text,
  bigint,
  text,
  numeric,
  jsonb
) to service_role;