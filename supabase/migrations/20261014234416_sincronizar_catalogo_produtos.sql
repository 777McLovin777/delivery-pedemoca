-- Sincronização do catálogo Pé de Moça
-- Alterações já aplicadas manualmente no banco remoto.
-- Script idempotente: pode ser reaplicado sem duplicar produtos.

insert into public.checkout_products
  (id, name, price, category, allows_addons, is_active)
values
  (301, 'Cookie de Nutella', 14.90, 'Cookies', false, true),
  (302, 'Cookie Kinder Bueno', 14.90, 'Cookies', false, true),
  (303, 'Torta de Manteiga Escocesa do Pica-Pau', 15.90, 'Tortas', false, true)
on conflict (id) do update
set
  name = excluded.name,
  price = excluded.price,
  category = excluded.category,
  allows_addons = excluded.allows_addons,
  is_active = excluded.is_active;

update public.checkout_products
set is_active = false
where id = 107
  and name = 'Tiramisù';