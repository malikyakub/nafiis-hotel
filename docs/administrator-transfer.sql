-- Owner-requested administrator transfer. Preserve both accounts and their records.
do $$
declare new_admin uuid; old_admin uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('nafiis-administrator',0));
 select id into new_admin from auth.users where lower(email)='zizoubariise@gmail.com' and email_confirmed_at is not null;
 select id into old_admin from auth.users where lower(email)='anzaarhaji7@gmail.com';
 if new_admin is null or not exists(select 1 from public.profiles where id=new_admin and is_active) then
  raise exception 'New administrator must be verified and active';
 end if;
 if exists(select 1 from public.profiles where role='admin' and id<>new_admin and id is distinct from old_admin) then
  raise exception 'Unexpected administrator; review before transferring';
 end if;
 update public.profiles set role='guest' where id=old_admin and role='admin';
 update public.profiles set role='admin' where id=new_admin;
 insert into public.staff(profile_id,employee_code,department)
 values(new_admin,'ADMIN-002','Administration')
 on conflict(profile_id) do update set department='Administration';
end $$;
-- Provisioning was replaced by explicit owner-controlled role assignment.
-- Disable the obsolete email-specific bootstrap entrypoint.
revoke execute on function public.provision_hotel_administrator(uuid,text) from public,anon,authenticated,service_role;
