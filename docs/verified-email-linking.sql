drop function public.link_verified_bookings(uuid);
create function public.link_verified_bookings(p_customer uuid,p_verified_email text)
 returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_verified_email is null or not exists(select 1 from public.profiles where id=p_customer and role='guest' and is_active) then return;end if;
 insert into public.booking_access(booking_id,profile_id)
 select b.id,p_customer from public.bookings b join public.guests g on g.id=b.guest_id
 where g.profile_id is null and lower(g.booking_email)=lower(p_verified_email)
 on conflict do nothing;
end $$;
revoke all on function public.link_verified_bookings(uuid,text) from public,anon,authenticated;
grant execute on function public.link_verified_bookings(uuid,text) to service_role;
