grant select on public.food_menu to anon;
create policy food_public_available on public.food_menu for select to anon,authenticated using(is_available);
alter table public.room_types add column booking_code text unique check(booking_code in ('ocean','garden','family'));
update public.room_types set booking_code=case name when 'Ocean room' then 'ocean' when 'Garden room' then 'garden' when 'Family suite' then 'family' end where name in ('Ocean room','Garden room','Family suite');
do $$
declare definition text;
begin
 select pg_get_functiondef(oid) into definition from pg_proc where pronamespace='public'::regnamespace and proname='create_checkout_booking';
 if position('lower(t.name) like p_room_type||''%''' in definition)=0 then raise exception 'Unexpected checkout definition';end if;
 execute replace(definition,'lower(t.name) like p_room_type||''%''','t.booking_code=p_room_type');
end $$;
