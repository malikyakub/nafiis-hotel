-- Booking-only Polygon Amoy proofs. Server-only outbox; no client write grants.
create table public.booking_chain_jobs (
 booking_id uuid primary key references public.bookings(id),
 payment_id uuid not null unique references public.payment_submissions(id),
 actor_id uuid not null references public.profiles(id),
 snapshot text not null,
 booking_key text not null unique check(booking_key ~ '^0x[0-9a-f]{64}$'),
 proof_hash text not null check(proof_hash ~ '^0x[0-9a-f]{64}$'),
 chain_id integer not null check(chain_id=80002),
 contract_address text not null, wallet_address text not null,
 signed_transaction text not null, transaction_hash text not null unique,
 state text not null default 'pending' check(state in ('pending','confirmed','failed')),
 created_at timestamptz not null default now()
);
-- One unresolved transaction for the dedicated wallet. Serializes nonce allocation
-- even after a process dies or a timed lease expires.
create unique index booking_chain_single_pending on public.booking_chain_jobs ((true)) where state='pending';
create table public.booking_chain_lease (
 id integer primary key check(id=1), token uuid, expires_at timestamptz
);
insert into public.booking_chain_lease(id) values(1);
create table public.booking_proofs (
 booking_id uuid primary key references public.bookings(id),
 booking_key text not null, proof_hash text not null,
 chain_id integer not null check(chain_id=80002), contract_address text not null,
 transaction_hash text not null unique,
 status text not null default 'pending' check(status in ('pending','confirmed','failed')),
 block_number bigint, confirmed_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.booking_chain_jobs enable row level security;
alter table public.booking_chain_lease enable row level security;
alter table public.booking_proofs enable row level security;
revoke all on public.booking_chain_jobs,public.booking_chain_lease,public.booking_proofs from public,anon,authenticated;
grant all on public.booking_chain_jobs,public.booking_chain_lease,public.booking_proofs to service_role;
grant select on public.booking_proofs to authenticated;
create policy booking_proofs_reader on public.booking_proofs for select to authenticated
 using(exists(select 1 from public.bookings b where b.id=booking_id));

create function public.acquire_booking_chain_lease(p_token uuid,p_actor uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and role in ('admin','receptionist') and is_active) then raise exception 'Staff required';end if;
 update public.booking_chain_lease set token=p_token,expires_at=clock_timestamp()+interval '90 seconds'
 where id=1 and (expires_at is null or expires_at<clock_timestamp());
 return found;
end $$;
create function public.release_booking_chain_lease(p_token uuid)
returns void language sql security invoker set search_path='' as $$
 update public.booking_chain_lease set token=null,expires_at=null where id=1 and token=p_token;
$$;

create function public.prepare_booking_chain_job(p_token uuid,p_actor uuid,p_booking uuid,p_payment uuid,p_snapshot text,p_key text,p_hash text,p_contract text,p_wallet text,p_signed text,p_tx text)
returns void language plpgsql security invoker set search_path='' as $$
declare v_booking public.bookings;
begin
 perform 1 from public.booking_chain_lease where id=1 and token=p_token and expires_at>clock_timestamp() for update;
 if not found then raise exception 'Lease expired';end if;
 if not exists(select 1 from public.profiles where id=p_actor and role in ('admin','receptionist') and is_active) then raise exception 'Staff required';end if;
 select * into v_booking from public.bookings where id=p_booking for update;
 if v_booking.id is null or v_booking.status<>'under_review' then raise exception 'Booking not ready';end if;
 if not exists(select 1 from public.payment_submissions where id=p_payment and booking_id=p_booking and status='approved' and amount=v_booking.total_amount) then raise exception 'Approved payment required';end if;
 insert into public.booking_chain_jobs(booking_id,payment_id,actor_id,snapshot,booking_key,proof_hash,chain_id,contract_address,wallet_address,signed_transaction,transaction_hash)
 values(p_booking,p_payment,p_actor,p_snapshot,p_key,p_hash,80002,lower(p_contract),lower(p_wallet),p_signed,p_tx);
 insert into public.booking_proofs(booking_id,booking_key,proof_hash,chain_id,contract_address,transaction_hash)
 values(p_booking,p_key,p_hash,80002,lower(p_contract),p_tx);
end $$;

create function public.finish_booking_chain_job(p_token uuid,p_actor uuid,p_booking uuid,p_tx text,p_block bigint,p_success boolean)
returns void language plpgsql security invoker set search_path='' as $$
declare v_job public.booking_chain_jobs;
begin
 perform 1 from public.booking_chain_lease where id=1 and token=p_token and expires_at>clock_timestamp() for update;
 if not found then raise exception 'Lease expired';end if;
 if not exists(select 1 from public.profiles where id=p_actor and role in ('admin','receptionist') and is_active) then raise exception 'Staff required';end if;
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

-- Public callable functions never have authority to sign or confirm bookings.
revoke all on function public.acquire_booking_chain_lease(uuid,uuid),public.release_booking_chain_lease(uuid),public.prepare_booking_chain_job(uuid,uuid,uuid,uuid,text,text,text,text,text,text,text),public.finish_booking_chain_job(uuid,uuid,uuid,text,bigint,boolean) from public,anon,authenticated;
grant execute on function public.acquire_booking_chain_lease(uuid,uuid),public.release_booking_chain_lease(uuid),public.prepare_booking_chain_job(uuid,uuid,uuid,uuid,text,text,text,text,text,text,text),public.finish_booking_chain_job(uuid,uuid,uuid,text,bigint,boolean) to service_role;

create function public.guard_booking_proof_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.status<>'pending_payment' and
 (new.room_id,new.check_in,new.check_out,new.guests_count,new.nightly_rate,new.total_amount,new.arrival_time,new.departure_time)
 is distinct from (old.room_id,old.check_in,old.check_out,old.guests_count,old.nightly_rate,old.total_amount,old.arrival_time,old.departure_time)
 then raise exception 'Paid booking details are locked';end if;
 if new.status='confirmed' and old.status<>'confirmed' and not exists(select 1 from public.booking_proofs where booking_id=new.id and status='confirmed') then raise exception 'Verified blockchain proof required';end if;
 -- An approved booking cannot be manually cancelled or bypass chain processing.
 if old.status='under_review' and new.status not in ('under_review','confirmed') then raise exception 'Approved booking awaits blockchain confirmation';end if;
 if old.status<>'pending_payment' and new.status='pending_payment' then raise exception 'Cannot reopen a paid or closed booking';end if;
 if old.status in ('confirmed','checked_in','checked_out','completed') and new.status is distinct from old.status and not
 ((old.status='confirmed' and new.status='checked_in') or (old.status='checked_in' and new.status='checked_out') or (old.status='checked_out' and new.status='completed'))
 then raise exception 'Invalid confirmed booking transition';end if;
 return new;
end $$;
create trigger guard_booking_proof_fields before update on public.bookings for each row execute function public.guard_booking_proof_fields();
revoke all on function public.guard_booking_proof_fields() from public,anon,authenticated;

drop policy payments_owner_or_admin on public.payment_submissions;
create policy payments_owner_or_staff on public.payment_submissions for select to authenticated using(
 submitted_by=(select auth.uid()) or (select public.auth_role()) in ('admin','receptionist')
);
create or replace function public.review_booking_payment(p_payment uuid,p_admin uuid,p_decision text,p_note text)
 returns void language plpgsql security invoker set search_path='' as $$
declare v_payment public.payment_submissions;v_status public.booking_status;
begin
 if not exists(select 1 from public.profiles where id=p_admin and role in ('admin','receptionist') and is_active) then raise exception 'Staff required';end if;
 if p_decision not in ('approved','rejected') then raise exception 'Invalid decision';end if;
 select * into v_payment from public.payment_submissions where id=p_payment for update;
 if v_payment.id is null or v_payment.status<>'submitted' then raise exception 'Payment already reviewed or unavailable';end if;
 select status into v_status from public.bookings where id=v_payment.booking_id for update;
 if v_status<>'payment_submitted' then raise exception 'Booking status changed';end if;
 update public.payment_submissions set status=p_decision,reviewed_by=p_admin,reviewed_at=now(),review_note=left(p_note,1000) where id=p_payment;
 update public.bookings set status=case when p_decision='approved' then 'under_review'::public.booking_status else 'cancelled'::public.booking_status end,
 cancellation_reason=case when p_decision='rejected' then coalesce(nullif(p_note,''),'Payment rejected') else null end where id=v_payment.booking_id;
 insert into public.payment_audit(payment_id,actor_id,action) values(p_payment,p_admin,p_decision);
end $$;
