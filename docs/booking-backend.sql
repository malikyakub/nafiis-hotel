-- Preserve existing data; anonymous checkout stores contacts off-chain.
alter table public.guests alter column profile_id drop not null;
alter table public.guests add column if not exists booking_name text;
alter table public.guests add column if not exists booking_phone text;
alter table public.guests add column if not exists booking_email text;
alter table public.bookings add column if not exists arrival_time time;
alter table public.bookings add column if not exists departure_time time;
create table public.booking_access (
 booking_id uuid not null references public.bookings(id) on delete cascade,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 primary key(booking_id,profile_id)
);
alter table public.booking_access enable row level security;
grant select on public.booking_access to authenticated;
create policy booking_access_own on public.booking_access for select to authenticated
 using(profile_id=(select auth.uid()));
create policy bookings_linked_customer on public.bookings for select to authenticated
 using((select public.auth_role())='guest' and exists(select 1 from public.booking_access a where a.booking_id=id and a.profile_id=(select auth.uid())));
create table public.checkout_requests (
 request_key text primary key check(length(request_key)=64),
 requester_hash text not null,
 booking_id uuid not null references public.bookings(id),
 created_at timestamptz not null default now()
);
alter table public.checkout_requests enable row level security;
revoke all on public.checkout_requests from anon,authenticated;
create index checkout_requests_rate on public.checkout_requests(requester_hash,created_at);
create index booking_access_profile on public.booking_access(profile_id,booking_id);
create index guests_checkout_email on public.guests(lower(booking_email)) where profile_id is null;

-- Only the backend service can call this function. It runs with its caller's privileges.
create function public.create_checkout_booking(
 p_request_key text,p_requester_hash text,p_customer uuid,
 p_name text,p_phone text,p_email text,p_room_type text,
 p_check_in date,p_check_out date,p_guests integer,p_arrival time,p_departure time
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_room uuid;v_guest uuid;v_booking public.bookings;v_existing uuid;
begin
 if p_request_key !~ '^[a-f0-9]{64}$' or p_requester_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_requester_hash,0));
 select booking_id into v_existing from public.checkout_requests where request_key=p_request_key;
 if v_existing is not null then
  select * into v_booking from public.bookings where id=v_existing;
  return jsonb_build_object('id',v_booking.id,'reference',v_booking.reference,'status',v_booking.status,'total_amount',v_booking.total_amount);
 end if;
 if (select count(*) from public.checkout_requests where requester_hash=p_requester_hash and created_at>now()-interval '1 hour')>=5 then raise exception 'Too many booking requests. Please contact reception.';end if;
 if length(trim(p_name)) not between 2 and 120 or length(p_phone) not between 7 and 30 or length(coalesce(p_email,''))>254 then raise exception 'Invalid contact details';end if;
 if p_room_type not in ('any','ocean','garden','family') or p_guests not between 1 and 6 or p_check_in<(now() at time zone 'Africa/Mogadishu')::date or p_check_out<=p_check_in or p_check_out-p_check_in>60 then raise exception 'Invalid stay details';end if;
 if p_customer is not null then
  if not exists(select 1 from public.profiles where id=p_customer and role='guest' and is_active) then raise exception 'Customer account required';end if;
  select id into v_guest from public.guests where profile_id=p_customer;
  if v_guest is null then raise exception 'Customer profile unavailable';end if;
 end if;
 select r.id into v_room from public.rooms r join public.room_types t on t.id=r.room_type_id
 where r.is_active and t.is_active and r.status not in ('maintenance','cleaning')
 and t.capacity>=p_guests
 and (p_room_type='any' or lower(t.name) like p_room_type||'%')
 and not exists(select 1 from public.bookings b where b.room_id=r.id and b.status not in ('pending_payment','cancelled','completed','checked_out') and daterange(b.check_in,b.check_out,'[)')&&daterange(p_check_in,p_check_out,'[)'))
 order by coalesce(r.price_override,t.base_price),r.room_number
 limit 1 for update of r skip locked;
 if v_room is null then raise exception 'No room is available for these dates. Please contact reception.';end if;
 if v_guest is null then
  insert into public.guests(booking_name,booking_phone,booking_email) values(trim(p_name),trim(p_phone),nullif(lower(trim(p_email)),'')) returning id into v_guest;
 end if;
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count,arrival_time,departure_time,created_by)
 values(v_guest,v_room,p_check_in,p_check_out,p_guests,p_arrival,p_departure,p_customer) returning * into v_booking;
 insert into public.checkout_requests(request_key,requester_hash,booking_id) values(p_request_key,p_requester_hash,v_booking.id);
 return jsonb_build_object('id',v_booking.id,'reference',v_booking.reference,'status',v_booking.status,'total_amount',v_booking.total_amount);
end $$;
revoke all on function public.create_checkout_booking(text,text,uuid,text,text,text,text,date,date,integer,time,time) from public,anon,authenticated;
grant execute on function public.create_checkout_booking(text,text,uuid,text,text,text,text,date,date,integer,time,time) to service_role;

create function public.link_verified_bookings(p_customer uuid)
 returns void language plpgsql security invoker set search_path='' as $$
declare v_email text;
begin
 select lower(u.email) into v_email from auth.users u join public.profiles p on p.id=u.id
 where u.id=p_customer and u.email_confirmed_at is not null and p.role='guest' and p.is_active;
 if v_email is null then return;end if;
 insert into public.booking_access(booking_id,profile_id)
 select b.id,p_customer from public.bookings b join public.guests g on g.id=b.guest_id
 where g.profile_id is null and lower(g.booking_email)=v_email
 on conflict do nothing;
end $$;
revoke all on function public.link_verified_bookings(uuid) from public,anon,authenticated;
grant execute on function public.link_verified_bookings(uuid) to service_role;

-- Limit customer-editable fields to their existing profile fields.
revoke update on public.guests from authenticated;
grant update(nationality,address) on public.guests to authenticated;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
