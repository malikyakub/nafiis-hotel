-- Owner-authorized class demo inventory. Applied 2026-10-07.
-- HISTORICAL: superseded by thirty-room-inventory.sql. Do not rerun this seed on the expanded inventory.
-- Numbering updated 2026-10-08: 001 Garden, 002 Ocean, 003 Family.
-- Re-running does not overwrite existing rooms or prices.
begin;
select pg_advisory_xact_lock(hashtext('nafiis-demo-inventory-v1'));
insert into public.room_types(name,description,capacity,base_price)
select v.name,v.description,v.capacity,v.price
from (values
('Ocean room','Demo inventory for class testing: king bed, sea view.',2,95),
('Garden room','Demo inventory for class testing: twin or king, courtyard view.',2,75),
('Family suite','Demo inventory for class testing: king plus twin, separate lounge.',5,160)
) as v(name,description,capacity,price)
where not exists (select 1 from public.room_types t where lower(t.name)=lower(v.name));
insert into public.rooms(room_number,room_type_id,floor)
select v.number,t.id,v.floor from (values
('002','Ocean room',1),('001','Garden room',1),('003','Family suite',2)
) as v(number,name,floor)
join public.room_types t on t.name=v.name and t.description like 'Demo inventory for class testing:%'
where not exists (select 1 from public.rooms r where r.room_number=v.number);
commit;
select r.room_number,t.name,t.capacity,t.base_price,r.status from public.rooms r join public.room_types t on t.id=r.room_type_id where r.room_number in ('001','002','003') order by r.room_number;
