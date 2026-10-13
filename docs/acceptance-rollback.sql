begin;
do $$
declare g uuid; r uuid; b public.bookings; b2 public.bookings; old public.bookings; deadline timestamptz; rejected boolean; state jsonb;
begin
 insert into public.guests(booking_name,booking_phone) values('ROLLBACK ACCEPTANCE TEST','0000000000') returning id into g;
 select room_id into r from public.available_rooms(current_date+45,current_date+47) limit 1;
 if r is null then raise exception 'No isolated test room available'; end if;
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count) values(g,r,current_date+45,current_date+47,1) returning * into b;
 if b.payment_expires_at-b.created_at<>interval '24 hours' then raise exception 'Payment deadline assertion failed';end if;
 if not exists(select 1 from public.available_rooms(current_date+45,current_date+47) where room_id=r) then raise exception 'Unpaid booking blocked availability';end if;
 -- A second unpaid booking for the same room and dates is allowed.
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count) values(g,r,current_date+46,current_date+48,1) returning * into b2;
 update public.bookings set payment_expires_at=clock_timestamp()+interval '2 days' where id=b.id returning payment_expires_at into deadline;
 if deadline<>b.payment_expires_at then raise exception 'Deadline tampering accepted';end if;
 -- First submitted receipt blocks the room.
 update public.bookings set status='payment_submitted' where id=b.id;
 if exists(select 1 from public.available_rooms(current_date+45,current_date+47) where room_id=r) then raise exception 'Submitted receipt did not block availability';end if;
 rejected:=false;
 begin
 update public.bookings set status='payment_submitted' where id=b2.id;
 exception when exclusion_violation then rejected:=true;
 end;
 if not rejected then raise exception 'Second overlapping submission was accepted';end if;
 state:=public.refresh_booking_payment_state(b2.id);
 if state->>'code' is distinct from 'room_taken' or state->>'status'<>'cancelled' then raise exception 'Room-taken booking was not cancelled';end if;
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count) values(g,r,current_date+47,current_date+48,1);
 -- Unpaid bookings older than 24 hours expire and cannot move to payment.
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count,created_at) values(g,r,current_date+50,current_date+51,1,now()-interval '25 hours') returning * into old;
 rejected:=false;
 begin update public.bookings set status='payment_submitted' where id=old.id;
 exception when raise_exception then if sqlerrm='Payment window expired' then rejected:=true;else raise;end if;
 end;
 if not rejected then raise exception 'Expired booking accepted a payment';end if;
 state:=public.refresh_booking_payment_state(old.id);
 if state->>'code' is distinct from 'expired' then raise exception 'Expired booking was not cancelled';end if;
 if public.expire_unpaid_bookings()<0 then raise exception 'Expiry function failed';end if;
 rejected:=false;
 begin update public.bookings set status='confirmed' where id=b.id;
 exception when raise_exception then if sqlerrm='Verified blockchain proof required' then rejected:=true;else raise;end if;
 end;
 if not rejected then raise exception 'Confirmation bypass accepted';end if;
end $$;
rollback;
select 'PASS: 24-hour deadline, unpaid bookings do not block, overlapping unpaid bookings allowed, first submission blocks and second is rejected, room-taken and expiry cancellation, deadline immutable, confirmation requires proof. Test rows rolled back; booking reference sequence may contain gaps.' as result;
