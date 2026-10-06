alter table public.loyalty_rate_limits
drop constraint if exists loyalty_rate_limits_action_check;

alter table public.loyalty_rate_limits
add constraint loyalty_rate_limits_action_check
check (
  action in (
    'validate',
    'status',
    'create_order'
  )
);