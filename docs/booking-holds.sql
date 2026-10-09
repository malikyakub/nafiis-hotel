-- Thirty-minute holds, enforced by a temporal exclusion constraint.
-- Historical expired rows remain visible; no booking or payment is deleted.
lock table public.bookings in access exclusive mode;
alter table public.bookings add column hold_expires_at timestamptz;
update public.bookings set hold_expires_at=created_at+interval '30 minutes';
alter table public.bookings alter column hold_expires_at set not null;
create or replace function public.guard_booking_hold() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
  new.hold_expires_at:=new.created_at+interval '30 minutes';
 else
  new.hold_expires_at:=old.hold_expires_at;
  if old.status='pending_payment' and new.status not in ('pending_payment','cancelled')
     and old.hold_expires_at<=clock_timestamp() then
   raise exception 'Payment window expired. Create a new booking before paying.';
  end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_booking_hold() from public,anon,authenticated;
create trigger bookings_hold_guard before insert or update on public.bookings
for each row execute function public.guard_booking_hold();
alter table public.bookings drop constraint no_overlapping_bookings;
alter table public.bookings add constraint no_overlapping_bookings exclude using gist
(room_id with =, daterange(check_in,check_out,'[)') with &&,
 (tstzrange(created_at,case when status='pending_payment' then hold_expires_at else null end,'[)')) with &&)
where (status not in ('cancelled','completed','checked_out'));
CREATE OR REPLACE FUNCTION public.available_rooms(p_check_in date, p_check_out date)
 RETURNS TABLE(room_id uuid, room_number text, floor integer, room_type_id uuid, room_type text, capacity integer, nightly_rate numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select r.id,r.room_number,r.floor,t.id,t.name,t.capacity,coalesce(r.price_override,t.base_price)
 from public.rooms r join public.room_types t on t.id=r.room_type_id
 where r.is_active and t.is_active and r.status not in ('maintenance','cleaning')
 and p_check_out>p_check_in
 and not exists(select 1 from public.bookings b where b.room_id=r.id and b.status not in ('cancelled','completed','checked_out') and (b.status <> 'pending_payment' or b.hold_expires_at > clock_timestamp())
 and daterange(b.check_in,b.check_out,'[)')&&daterange(p_check_in,p_check_out,'[)'))
 order by coalesce(r.price_override,t.base_price),r.room_number
$function$;

CREATE OR REPLACE FUNCTION public.create_checkout_booking(p_request_key text, p_requester_hash text, p_customer uuid, p_name text, p_phone text, p_email text, p_room_type text, p_check_in date, p_check_out date, p_guests integer, p_arrival time without time zone, p_departure time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare v_room uuid;v_guest uuid;v_booking public.bookings;v_existing uuid;
begin
 if p_request_key !~ '^[a-f0-9]{64}$' or p_requester_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_requester_hash,0));
 select booking_id into v_existing from public.checkout_requests where request_key=p_request_key;
 if v_existing is not null then
  select * into v_booking from public.bookings where id=v_existing;
  if v_booking.status <> 'pending_payment' or v_booking.hold_expires_at > clock_timestamp() then
  return jsonb_build_object('id',v_booking.id,'reference',v_booking.reference,'status',v_booking.status,'total_amount',v_booking.total_amount);
  end if;
  delete from public.checkout_requests where request_key=p_request_key;
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
 and (p_room_type='any' or t.booking_code=p_room_type)
 and not exists(select 1 from public.bookings b where b.room_id=r.id and b.status not in ('cancelled','completed','checked_out') and (b.status <> 'pending_payment' or b.hold_expires_at > clock_timestamp()) and daterange(b.check_in,b.check_out,'[)')&&daterange(p_check_in,p_check_out,'[)'))
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
end $function$;

-- Expired holds are ignored by availability and the constraint; keep their history.
create or replace function public.release_unpaid_overlaps() returns trigger
language plpgsql set search_path='' as $$ begin return null; end $$;

