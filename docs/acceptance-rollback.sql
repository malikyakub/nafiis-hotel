begin;
do $$
declare g uuid; r uuid; b public.bookings; deadline timestamptz; rejected boolean;
begin
 insert into public.guests(booking_name,booking_phone) values('ROLLBACK ACCEPTANCE TEST','0000000000') returning id into g;
 select room_id into r from public.available_rooms(current_date+45,current_date+47) limit 1;
 if r is null then raise exception 'No isolated test room available'; end if;
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count) values(g,r,current_date+45,current_date+47,1) returning * into b;
 if b.hold_expires_at-b.created_at<>interval '30 minutes' then raise exception 'Hold duration assertion failed';end if;
 if exists(select 1 from public.available_rooms(current_date+45,current_date+47) where room_id=r) then raise exception 'Active hold leaked into availability';end if;
 rejected:=false;
 begin
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count) values(g,r,current_date+46,current_date+48,1);
 exception when exclusion_violation then rejected:=true;
 end;
 if not rejected then raise exception 'Overlapping hold was accepted';end if;
 insert into public.bookings(guest_id,room_id,check_in,check_out,guests_count) values(g,r,current_date+47,current_date+48,1);
 update public.bookings set hold_expires_at=clock_timestamp()+interval '2 days' where id=b.id returning hold_expires_at into deadline;
 if deadline<>b.hold_expires_at then raise exception 'Deadline tampering accepted';end if;
 rejected:=false;
 begin update public.bookings set status='confirmed' where id=b.id;
 exception when raise_exception then if sqlerrm='Verified blockchain proof required' then rejected:=true;else raise;end if;
 end;
 if not rejected then raise exception 'Confirmation bypass accepted';end if;
end $$;
rollback;
select 'PASS: 30-minute deadline, active availability hold, overlapping reservation rejected, adjacent stay accepted, deadline immutable, confirmation requires proof. Test rows rolled back; booking reference sequence may contain gaps.' as result;
