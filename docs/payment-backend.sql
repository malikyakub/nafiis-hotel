grant all on public.booking_access,public.checkout_requests to service_role;
create table public.payment_submissions (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid not null unique references public.bookings(id),
 submitted_by uuid not null references public.profiles(id),
 object_path text not null unique,
 transfer_reference text,
 amount numeric not null check(amount>=0),
 status text not null default 'submitted' check(status in ('submitted','approved','rejected')),
 reviewed_by uuid references public.profiles(id),review_note text,
 created_at timestamptz not null default now(),reviewed_at timestamptz
);
alter table public.payment_submissions enable row level security;
grant select on public.payment_submissions to authenticated;
grant all on public.payment_submissions to service_role;
create policy payments_owner_or_admin on public.payment_submissions for select to authenticated using(
 submitted_by=(select auth.uid()) or (select public.auth_role())='admin'
);
create table public.payment_audit (
 id bigint generated always as identity primary key,
 payment_id uuid not null references public.payment_submissions(id),
 actor_id uuid not null references public.profiles(id),
 action text not null,created_at timestamptz not null default now()
);
alter table public.payment_audit enable row level security;
grant select on public.payment_audit to authenticated;
grant all on public.payment_audit to service_role;
grant usage,select on sequence public.payment_audit_id_seq to service_role;
create policy payment_audit_admin on public.payment_audit for select to authenticated using((select public.auth_role())='admin');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('payment-proofs','payment-proofs',false,5242880,array['image/png','image/jpeg','application/pdf'])
 on conflict(id) do nothing;

create function public.submit_booking_payment(p_booking uuid,p_customer uuid,p_object text,p_reference text)
 returns uuid language plpgsql security invoker set search_path='' as $$
declare v_booking public.bookings;v_payment uuid;
begin
 if not exists(select 1 from public.profiles where id=p_customer and role='guest' and is_active) then raise exception 'Customer required';end if;
 select * into v_booking from public.bookings where id=p_booking for update;
 if v_booking.id is null or v_booking.status<>'pending_payment' then raise exception 'Booking is not awaiting payment';end if;
 if not exists(select 1 from public.guests where id=v_booking.guest_id and profile_id=p_customer)
 and not exists(select 1 from public.booking_access where booking_id=p_booking and profile_id=p_customer) then raise exception 'Booking unavailable';end if;
 if p_object not like p_customer::text||'/'||p_booking::text||'/%' then raise exception 'Invalid attachment';end if;
 if not exists(select 1 from storage.objects where bucket_id='payment-proofs' and name=p_object) then raise exception 'Attachment missing';end if;
 insert into public.payment_submissions(booking_id,submitted_by,object_path,transfer_reference,amount)
 values(p_booking,p_customer,p_object,left(p_reference,120),v_booking.total_amount) returning id into v_payment;
 update public.bookings set status='payment_submitted' where id=p_booking;
 insert into public.payment_audit(payment_id,actor_id,action) values(v_payment,p_customer,'submitted');
 return v_payment;
end $$;
revoke all on function public.submit_booking_payment(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.submit_booking_payment(uuid,uuid,text,text) to service_role;

create function public.review_booking_payment(p_payment uuid,p_admin uuid,p_decision text,p_note text)
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
revoke all on function public.review_booking_payment(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.review_booking_payment(uuid,uuid,text,text) to service_role;
