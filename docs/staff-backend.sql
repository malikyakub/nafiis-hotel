create function public.provision_hotel_administrator(p_user uuid,p_verified_email text)
 returns void language plpgsql security invoker set search_path='' as $$
begin
 if lower(p_verified_email)<>'anzaarhaji7@gmail.com' then raise exception 'Not an approved administrator';end if;
 perform pg_advisory_xact_lock(hashtextextended('nafiis-administrator',0));
 if exists(select 1 from public.profiles where role='admin' and id<>p_user) then raise exception 'Administrator already configured';end if;
 update public.profiles set role='admin' where id=p_user and is_active;
 if not found then raise exception 'Account unavailable';end if;
 insert into public.staff(profile_id,employee_code,department)
 values(p_user,'ADMIN-001','Administration') on conflict(profile_id) do nothing;
end $$;
revoke all on function public.provision_hotel_administrator(uuid,text) from public,anon,authenticated;
grant execute on function public.provision_hotel_administrator(uuid,text) to service_role;
create function public.guard_front_desk_transition()
 returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is not null then
  if new.status='checked_in' and old.status not in ('confirmed','checked_in') then raise exception 'Only a confirmed reservation may check in';end if;
  if new.status='checked_out' and old.status not in ('checked_in','checked_out') then raise exception 'Only a checked-in reservation may check out';end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_front_desk_transition() from public,anon,authenticated;
create trigger guard_front_desk_transition before update on public.bookings for each row execute function public.guard_front_desk_transition();
