-- Owner-authorized 30-room demo inventory, 2026-10-08.
-- Preserve existing room IDs, categories, rates and booking relationships.
begin;
select pg_advisory_xact_lock(hashtext('nafiis-demo-inventory-v1'));
do $$
begin
 if (select count(*) from public.room_types where booking_code in ('garden','ocean','family'))<>3 then
  raise exception 'Expected three existing booking categories';
 end if;
end $$;
update public.rooms r set room_number=v.new_number
from (values ('001','Room 001','garden'),('002','Room 011','ocean'),('003','Room 021','family')) v(old_number,new_number,category)
where r.room_number=v.old_number and exists(select 1 from public.room_types t where t.id=r.room_type_id and t.booking_code=v.category);
insert into public.rooms(room_number,room_type_id,floor)
select 'Room '||lpad(n::text,3,'0'),t.id,case when n<=18 then 1 else 2 end
from generate_series(1,30) n join public.room_types t
on t.booking_code=case when n<=10 then 'garden' when n<=18 then 'ocean' else 'family' end
where not exists(select 1 from public.rooms r where r.room_number='Room '||lpad(n::text,3,'0'));
do $$
begin
 if (select count(*) from public.rooms)<>30 then raise exception 'Inventory contains other rooms; no changes committed';end if;
 if (select count(*) from public.rooms r join public.room_types t on t.id=r.room_type_id
 join generate_series(1,30) n on r.room_number='Room '||lpad(n::text,3,'0')
 where t.booking_code=case when n<=10 then 'garden' when n<=18 then 'ocean' else 'family' end)<>30
 then raise exception 'Room category mismatch; no changes committed';end if;
end $$;
commit;
select t.name as category,count(*) as rooms,min(r.room_number) as first_room,max(r.room_number) as last_room,t.base_price,t.capacity
from public.rooms r join public.room_types t on t.id=r.room_type_id
group by t.name,t.base_price,t.capacity order by first_room;
