-- Browser checkout capabilities are verified by the server, never by public RPC callers.
alter table public.payment_submissions alter column submitted_by drop not null;
alter table public.payment_audit alter column actor_id drop not null;
alter table public.payment_audit add constraint payment_audit_anonymous_submission
 check(actor_id is not null or action='submitted_guest');
alter table public.hotel_settings add column evc_number text not null default '';
alter table public.hotel_settings add column evc_name text not null default '';
alter table public.hotel_settings add column edahab_number text not null default '';
alter table public.hotel_settings add column edahab_name text not null default '';

create function public.submit_guest_booking_payment(p_booking uuid,p_object text,p_reference text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_booking public.bookings;v_payment uuid;
begin
 select * into v_booking from public.bookings where id=p_booking for update;
 if v_booking.id is null or v_booking.status<>'pending_payment' then raise exception 'Booking is not awaiting payment';end if;
 if not exists(select 1 from public.guests where id=v_booking.guest_id and profile_id is null) then raise exception 'Guest checkout required';end if;
 if p_object not like 'guest/'||p_booking::text||'/%' then raise exception 'Invalid attachment';end if;
 if not exists(select 1 from storage.objects where bucket_id='payment-proofs' and name=p_object) then raise exception 'Attachment missing';end if;
 insert into public.payment_submissions(booking_id,submitted_by,object_path,transfer_reference,amount)
 values(p_booking,null,p_object,left(p_reference,120),v_booking.total_amount) returning id into v_payment;
 update public.bookings set status='payment_submitted' where id=p_booking;
 insert into public.payment_audit(payment_id,actor_id,action) values(v_payment,null,'submitted_guest');
 return v_payment;
end $$;
revoke all on function public.submit_guest_booking_payment(uuid,text,text) from public,anon,authenticated;
grant execute on function public.submit_guest_booking_payment(uuid,text,text) to service_role;
-- Accounts created later can read receipts for bookings they own via verified email.
create policy payments_linked_booking_owner on public.payment_submissions for select to authenticated
 using((select public.auth_role())='guest' and exists(
   select 1 from public.bookings b where b.id=payment_submissions.booking_id
   and (b.guest_id=(select public.current_guest_id()) or exists(
     select 1 from public.booking_access a where a.booking_id=b.id and a.profile_id=(select auth.uid())
   ))
 ));
