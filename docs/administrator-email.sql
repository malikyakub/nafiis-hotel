create or replace function public.provision_hotel_administrator(p_user uuid,p_verified_email text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if lower(p_verified_email) is distinct from 'anzaarhaji7@gmail.com' then raise exception 'Not an approved administrator';end if;
 perform pg_advisory_xact_lock(hashtextextended('nafiis-administrator',0));
 if exists(select 1 from public.profiles where role='admin' and id<>p_user) then raise exception 'Administrator already configured';end if;
 update public.profiles set role='admin' where id=p_user and is_active;
 if not found then raise exception 'Account unavailable';end if;
 insert into public.staff(profile_id,employee_code,department)
 values(p_user,'ADMIN-001','Administration') on conflict(profile_id) do nothing;
end $$;
revoke all on function public.provision_hotel_administrator(uuid,text) from public,anon,authenticated;
grant execute on function public.provision_hotel_administrator(uuid,text) to service_role;
