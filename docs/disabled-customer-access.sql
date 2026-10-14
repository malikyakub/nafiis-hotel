create or replace function public.current_guest_id()
returns uuid language sql stable security definer set search_path='' as $$
 select g.id from public.guests g join public.profiles p on p.id=g.profile_id
 where g.profile_id=auth.uid() and p.is_active and p.role='guest'
$$;
alter policy payments_owner_or_staff on public.payment_submissions
using (
 ((select public.auth_role())='guest' and submitted_by=(select auth.uid()))
 or (select public.auth_role()) in ('admin','receptionist')
);
