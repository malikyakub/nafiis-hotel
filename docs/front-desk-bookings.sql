create policy guests_insert_front_desk on public.guests for insert to authenticated with check(public.auth_role() in ('admin','receptionist') and profile_id is null);
grant insert on public.guests to authenticated;
create function public.front_desk_booking(p_room uuid,p_name text,p_phone text,p_email text,p_start date,p_end date,p_guests integer) returns text
language plpgsql security invoker set search_path='' as $$
declare guest uuid; ref text;
begin
 if auth.uid() is null or public.auth_role() not in ('admin','receptionist') or public.auth_role() is null then raise exception 'Staff access required';end if;
 if length(trim(p_name))<2 or length(p_name)>120 or length(p_phone)>30 or length(p_email)>254 or p_guests not between 1 and 20 or p_start<(now() at time zone 'Africa/Mogadishu')::date or p_end<=p_start or p_end-p_start>60 then raise exception 'Invalid booking details';end if;
 perform 1 from public.rooms where id=p_room and is_active and status not in ('maintenance','cleaning') for update;
 if not found then raise exception 'Room unavailable';end if;
 if not exists(select 1 from public.available_rooms(p_start,p_end) where room_id=p_room) then raise exception 'Room unavailable for these dates';end if;
 insert into public.guests(booking_name,booking_phone,booking_email) values(trim(p_name),trim(p_phone),nullif(lower(trim(p_email)),'')) returning id into guest;
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count) values(guest,p_room,p_start,p_end,p_guests) returning reference into ref;
 return ref;
end $$;
revoke all on function public.front_desk_booking(uuid,text,text,text,date,date,integer) from public,anon;
grant execute on function public.front_desk_booking(uuid,text,text,text,date,date,integer) to authenticated;
