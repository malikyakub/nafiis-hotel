-- 24-hour unpaid bookings, first submitted receipt wins. Apply once, on top of
-- booking-holds.sql, booking-blockchain.sql and guest-payment-checkout.sql.
-- * pending_payment (no receipt yet) never blocks a room; several guests may hold
--   pending bookings for the same room and dates.
-- * payment_submitted, under_review, confirmed and checked_in block the room. A
--   submitted receipt never expires.
-- * The first receipt submitted wins: overlapping pending bookings are cancelled in
--   the same transaction. A later submit for a taken room is rejected.
-- * Unpaid bookings are cancelled 24 hours after creation: lazily on every read or
--   submit path, and by expire_unpaid_bookings() when that is scheduled.
-- * Payment review and booking-proof chain writes are administrator only.
-- No booking or payment row is deleted.
begin;
lock table public.bookings in access exclusive mode;

-- 1. Replace the 30-minute hold with a 24-hour payment deadline. The old temporal
-- constraint is dropped first so lengthening unpaid deadlines cannot violate it.
alter table public.bookings drop constraint no_overlapping_bookings;
drop trigger if exists bookings_hold_guard on public.bookings;
drop function if exists public.guard_booking_hold();
alter table public.bookings rename column hold_expires_at to payment_expires_at;
update public.bookings set payment_expires_at=created_at+interval '24 hours' where status='pending_payment';

create function public.guard_booking_payment_deadline() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
  new.payment_expires_at:=coalesce(new.created_at,now())+interval '24 hours';
 else
  new.payment_expires_at:=old.payment_expires_at;
  if old.status='pending_payment' and new.status not in ('pending_payment','cancelled')
     and old.payment_expires_at<=clock_timestamp() then
   raise exception 'Payment window expired';
  end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_booking_payment_deadline() from public,anon,authenticated;
create trigger bookings_payment_deadline before insert or update on public.bookings
for each row execute function public.guard_booking_payment_deadline();

-- 2. Only bookings with a submitted receipt (or later) block a room.
alter table public.bookings add constraint no_overlapping_bookings exclude using gist
(room_id with =, daterange(check_in,check_out,'[)') with &&)
where (status not in ('pending_payment','cancelled','completed','checked_out'));
create index if not exists bookings_unpaid_deadline on public.bookings(payment_expires_at) where status='pending_payment';
create index if not exists bookings_unpaid_room on public.bookings(room_id,check_in) where status='pending_payment';

create or replace function public.available_rooms(p_check_in date,p_check_out date)
returns table(room_id uuid,room_number text,floor integer,room_type_id uuid,room_type text,capacity integer,nightly_rate numeric)
language sql stable security definer set search_path='' as $$
 select r.id,r.room_number,r.floor,t.id,t.name,t.capacity,coalesce(r.price_override,t.base_price)
 from public.rooms r join public.room_types t on t.id=r.room_type_id
 where r.is_active and t.is_active and r.status not in ('maintenance','cleaning')
 and p_check_out>p_check_in
 and not exists(select 1 from public.bookings b where b.room_id=r.id and b.status not in ('pending_payment','cancelled','completed','checked_out')
 and daterange(b.check_in,b.check_out,'[)')&&daterange(p_check_in,p_check_out,'[)'))
 order by coalesce(r.price_override,t.base_price),r.room_number
$$;

-- 3. Checkout: rooms with a blocking booking are skipped. Rooms without competing
-- unpaid bookings are preferred at the same price. A replayed request for a
-- cancelled or expired booking creates a new booking.
create or replace function public.create_checkout_booking(p_request_key text, p_requester_hash text, p_customer uuid, p_name text, p_phone text, p_email text, p_room_type text, p_check_in date, p_check_out date, p_guests integer, p_arrival time without time zone, p_departure time without time zone)
 returns jsonb language plpgsql set search_path='' as $$
declare v_room uuid;v_guest uuid;v_booking public.bookings;v_existing uuid;
begin
 if p_request_key !~ '^[a-f0-9]{64}$' or p_requester_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_requester_hash,0));
 select booking_id into v_existing from public.checkout_requests where request_key=p_request_key;
 if v_existing is not null then
  select * into v_booking from public.bookings where id=v_existing;
  if v_booking.status='pending_payment' and v_booking.payment_expires_at<=clock_timestamp() then
   update public.bookings set status='cancelled',cancellation_reason='Payment not received within 24 hours'
   where id=v_existing and status='pending_payment' returning * into v_booking;
  end if;
  if v_booking.status is distinct from 'cancelled' then
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
 and not exists(select 1 from public.bookings b where b.room_id=r.id and b.status not in ('pending_payment','cancelled','completed','checked_out') and daterange(b.check_in,b.check_out,'[)')&&daterange(p_check_in,p_check_out,'[)'))
 order by coalesce(r.price_override,t.base_price),
  exists(select 1 from public.bookings b where b.room_id=r.id and b.status='pending_payment' and b.payment_expires_at>clock_timestamp() and daterange(b.check_in,b.check_out,'[)')&&daterange(p_check_in,p_check_out,'[)')),
  r.room_number
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

-- 4. Lazy expiry and room-taken check for one booking. Called by the server before
-- showing a checkout page or accepting a receipt. Returns {status, code} where
-- code is null, 'expired' or 'room_taken'. Serialized per room with submissions.
create function public.refresh_booking_payment_state(p_booking uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_room uuid;v_booking public.bookings;
begin
 select room_id into v_room from public.bookings where id=p_booking;
 if not found then return null;end if;
 perform pg_advisory_xact_lock(hashtextextended('nafiis-room:'||coalesce(v_room::text,''),0));
 select * into v_booking from public.bookings where id=p_booking for update;
 if v_booking.status='pending_payment' then
  if v_booking.payment_expires_at<=clock_timestamp() then
   update public.bookings set status='cancelled',cancellation_reason='Payment not received within 24 hours'
   where id=p_booking returning * into v_booking;
  elsif exists(select 1 from public.bookings b where b.room_id=v_booking.room_id and b.id<>p_booking
   and b.status not in ('pending_payment','cancelled','completed','checked_out')
   and daterange(b.check_in,b.check_out,'[)')&&daterange(v_booking.check_in,v_booking.check_out,'[)')) then
   update public.bookings set status='cancelled',cancellation_reason='Room taken by another paid booking'
   where id=p_booking returning * into v_booking;
  end if;
 end if;
 return jsonb_build_object('status',v_booking.status,'code',case when v_booking.status<>'cancelled' then null
  when v_booking.cancellation_reason='Payment not received within 24 hours' then 'expired'
  when v_booking.cancellation_reason='Room taken by another paid booking' then 'room_taken' end);
end $$;
revoke all on function public.refresh_booking_payment_state(uuid) from public,anon,authenticated;
grant execute on function public.refresh_booking_payment_state(uuid) to service_role;

-- 5. Idempotent bulk expiry. Safe to run at any time; skips rows being submitted.
create function public.expire_unpaid_bookings()
returns integer language plpgsql security invoker set search_path='' as $$
declare v_count integer;
begin
 update public.bookings set status='cancelled',cancellation_reason='Payment not received within 24 hours'
 where status='pending_payment' and id in (
  select id from public.bookings where status='pending_payment' and payment_expires_at<=clock_timestamp()
  for update skip locked);
 get diagnostics v_count=row_count;
 return v_count;
end $$;
revoke all on function public.expire_unpaid_bookings() from public,anon,authenticated;
grant execute on function public.expire_unpaid_bookings() to service_role;
-- Optional schedule, only after enabling the pg_cron extension:
-- select cron.schedule('expire-unpaid-bookings','*/15 * * * *',$cron$select public.expire_unpaid_bookings()$cron$);

-- 6. Receipt submission: first submitted receipt wins the room, atomically.
create or replace function public.submit_booking_payment(p_booking uuid,p_customer uuid,p_object text,p_reference text)
 returns uuid language plpgsql security invoker set search_path='' as $$
declare v_booking public.bookings;v_payment uuid;v_room uuid;
begin
 if not exists(select 1 from public.profiles where id=p_customer and role='guest' and is_active) then raise exception 'Customer required';end if;
 select room_id into v_room from public.bookings where id=p_booking;
 if not found then raise exception 'Booking is not awaiting payment';end if;
 perform pg_advisory_xact_lock(hashtextextended('nafiis-room:'||coalesce(v_room::text,''),0));
 select * into v_booking from public.bookings where id=p_booking for update;
 if v_booking.id is null or v_booking.status<>'pending_payment' then raise exception 'Booking is not awaiting payment';end if;
 if v_booking.payment_expires_at<=clock_timestamp() then raise exception 'Payment window expired';end if;
 if not exists(select 1 from public.guests where id=v_booking.guest_id and profile_id=p_customer)
 and not exists(select 1 from public.booking_access where booking_id=p_booking and profile_id=p_customer) then raise exception 'Booking unavailable';end if;
 if p_object not like p_customer::text||'/'||p_booking::text||'/%' then raise exception 'Invalid attachment';end if;
 if not exists(select 1 from storage.objects where bucket_id='payment-proofs' and name=p_object) then raise exception 'Attachment missing';end if;
 if exists(select 1 from public.bookings b where b.room_id=v_booking.room_id and b.id<>p_booking
  and b.status not in ('pending_payment','cancelled','completed','checked_out')
  and daterange(b.check_in,b.check_out,'[)')&&daterange(v_booking.check_in,v_booking.check_out,'[)')) then
  raise exception 'Room taken by another paid booking';
 end if;
 insert into public.payment_submissions(booking_id,submitted_by,object_path,transfer_reference,amount)
 values(p_booking,p_customer,p_object,left(p_reference,120),v_booking.total_amount) returning id into v_payment;
 update public.bookings set status='payment_submitted' where id=p_booking;
 update public.bookings set status='cancelled',cancellation_reason=case when payment_expires_at<=clock_timestamp()
  then 'Payment not received within 24 hours' else 'Room taken by another paid booking' end
 where room_id=v_booking.room_id and id<>p_booking and status='pending_payment'
 and daterange(check_in,check_out,'[)')&&daterange(v_booking.check_in,v_booking.check_out,'[)');
 insert into public.payment_audit(payment_id,actor_id,action) values(v_payment,p_customer,'submitted');
 return v_payment;
end $$;

create or replace function public.submit_guest_booking_payment(p_booking uuid,p_object text,p_reference text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_booking public.bookings;v_payment uuid;v_room uuid;
begin
 select room_id into v_room from public.bookings where id=p_booking;
 if not found then raise exception 'Booking is not awaiting payment';end if;
 perform pg_advisory_xact_lock(hashtextextended('nafiis-room:'||coalesce(v_room::text,''),0));
 select * into v_booking from public.bookings where id=p_booking for update;
 if v_booking.id is null or v_booking.status<>'pending_payment' then raise exception 'Booking is not awaiting payment';end if;
 if v_booking.payment_expires_at<=clock_timestamp() then raise exception 'Payment window expired';end if;
 if not exists(select 1 from public.guests where id=v_booking.guest_id and profile_id is null) then raise exception 'Guest checkout required';end if;
 if p_object not like 'guest/'||p_booking::text||'/%' then raise exception 'Invalid attachment';end if;
 if not exists(select 1 from storage.objects where bucket_id='payment-proofs' and name=p_object) then raise exception 'Attachment missing';end if;
 if exists(select 1 from public.bookings b where b.room_id=v_booking.room_id and b.id<>p_booking
  and b.status not in ('pending_payment','cancelled','completed','checked_out')
  and daterange(b.check_in,b.check_out,'[)')&&daterange(v_booking.check_in,v_booking.check_out,'[)')) then
  raise exception 'Room taken by another paid booking';
 end if;
 insert into public.payment_submissions(booking_id,submitted_by,object_path,transfer_reference,amount)
 values(p_booking,null,p_object,left(p_reference,120),v_booking.total_amount) returning id into v_payment;
 update public.bookings set status='payment_submitted' where id=p_booking;
 update public.bookings set status='cancelled',cancellation_reason=case when payment_expires_at<=clock_timestamp()
  then 'Payment not received within 24 hours' else 'Room taken by another paid booking' end
 where room_id=v_booking.room_id and id<>p_booking and status='pending_payment'
 and daterange(check_in,check_out,'[)')&&daterange(v_booking.check_in,v_booking.check_out,'[)');
 insert into public.payment_audit(payment_id,actor_id,action) values(v_payment,null,'submitted_guest');
 return v_payment;
end $$;

-- 7. Payment review and booking-proof chain writes: active administrators only.
-- Receptionists keep read access to payment status (payments_owner_or_staff).
create or replace function public.review_booking_payment(p_payment uuid,p_admin uuid,p_decision text,p_note text)
 returns void language plpgsql security invoker set search_path='' as $$
declare v_payment public.payment_submissions;v_status public.booking_status;
begin
 if not exists(select 1 from public.profiles where id=p_admin and role='admin' and is_active) then raise exception 'Administrator required';end if;
 if p_decision not in ('approved','rejected') then raise exception 'Invalid decision';end if;
 select * into v_payment from public.payment_submissions where id=p_payment for update;
 if v_payment.id is null or v_payment.status<>'submitted' then raise exception 'Payment already reviewed or unavailable';end if;
 select status into v_status from public.bookings where id=v_payment.booking_id for update;
 if v_status<>'payment_submitted' then raise exception 'Booking status changed';end if;
 update public.payment_submissions set status=p_decision,reviewed_by=p_admin,reviewed_at=now(),review_note=left(p_note,1000) where id=p_payment;
 -- Approval alone does not confirm a blockchain-backed booking.
 update public.bookings set status=case when p_decision='approved' then 'under_review'::public.booking_status else 'cancelled'::public.booking_status end,
 cancellation_reason=case when p_decision='rejected' then coalesce(nullif(p_note,''),'Payment rejected') else null end where id=v_payment.booking_id;
 insert into public.payment_audit(payment_id,actor_id,action) values(p_payment,p_admin,p_decision);
end $$;

create or replace function public.acquire_booking_chain_lease(p_token uuid,p_actor uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='admin' and is_active) then raise exception 'Administrator required';end if;
 update public.booking_chain_lease set token=p_token,expires_at=clock_timestamp()+interval '90 seconds'
 where id=1 and (expires_at is null or expires_at<clock_timestamp());
 return found;
end $$;

create or replace function public.prepare_booking_chain_job(p_token uuid,p_actor uuid,p_booking uuid,p_payment uuid,p_snapshot text,p_key text,p_hash text,p_contract text,p_wallet text,p_signed text,p_tx text)
returns void language plpgsql security invoker set search_path='' as $$
declare v_booking public.bookings;
begin
 perform 1 from public.booking_chain_lease where id=1 and token=p_token and expires_at>clock_timestamp() for update;
 if not found then raise exception 'Lease expired';end if;
 if not exists(select 1 from public.profiles where id=p_actor and role='admin' and is_active) then raise exception 'Administrator required';end if;
 select * into v_booking from public.bookings where id=p_booking for update;
 if v_booking.id is null or v_booking.status<>'under_review' then raise exception 'Booking not ready';end if;
 if not exists(select 1 from public.payment_submissions where id=p_payment and booking_id=p_booking and status='approved' and amount=v_booking.total_amount) then raise exception 'Approved payment required';end if;
 insert into public.booking_chain_jobs(booking_id,payment_id,actor_id,snapshot,booking_key,proof_hash,chain_id,contract_address,wallet_address,signed_transaction,transaction_hash)
 values(p_booking,p_payment,p_actor,p_snapshot,p_key,p_hash,80002,lower(p_contract),lower(p_wallet),p_signed,p_tx);
 insert into public.booking_proofs(booking_id,booking_key,proof_hash,chain_id,contract_address,transaction_hash)
 values(p_booking,p_key,p_hash,80002,lower(p_contract),p_tx);
end $$;

create or replace function public.finish_booking_chain_job(p_token uuid,p_actor uuid,p_booking uuid,p_tx text,p_block bigint,p_success boolean)
returns void language plpgsql security invoker set search_path='' as $$
declare v_job public.booking_chain_jobs;
begin
 perform 1 from public.booking_chain_lease where id=1 and token=p_token and expires_at>clock_timestamp() for update;
 if not found then raise exception 'Lease expired';end if;
 if not exists(select 1 from public.profiles where id=p_actor and role='admin' and is_active) then raise exception 'Administrator required';end if;
 select * into v_job from public.booking_chain_jobs where booking_id=p_booking for update;
 if v_job.booking_id is null or v_job.transaction_hash<>p_tx or p_block<1 then raise exception 'Invalid transaction';end if;
 if v_job.state='confirmed' then return;end if;
 if v_job.state<>'pending' then raise exception 'Job is not pending';end if;
 perform 1 from public.bookings where id=p_booking and status='under_review' for update;
 if not found then raise exception 'Booking changed';end if;
 if not exists(select 1 from public.payment_submissions where id=v_job.payment_id and status='approved') then raise exception 'Payment changed';end if;
 update public.booking_chain_jobs set state=case when p_success then 'confirmed' else 'failed' end where booking_id=p_booking;
 update public.booking_proofs set status=case when p_success then 'confirmed' else 'failed' end,
 block_number=p_block,confirmed_at=case when p_success then now() else null end where booking_id=p_booking;
 if p_success then
  update public.bookings set status='confirmed' where id=p_booking;
  insert into public.payment_audit(payment_id,actor_id,action) values(v_job.payment_id,p_actor,'blockchain_confirmed');
 end if;
end $$;

-- 8. Cancel unpaid bookings that are already past 24 hours.
select public.expire_unpaid_bookings() as expired_unpaid_bookings;
commit;
