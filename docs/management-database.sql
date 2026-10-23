create table public.food_menu (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 category text not null check(length(category) between 1 and 80), description text not null default '',
 price numeric(10,2) not null check(price>=0), is_available boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.food_menu enable row level security;
grant select,insert,update on public.food_menu to authenticated;
create policy food_read_staff on public.food_menu for select to authenticated using(public.auth_role() in ('admin','receptionist','restaurant_staff'));
create policy food_insert_admin on public.food_menu for insert to authenticated with check(public.auth_role()='admin');
create policy food_update_admin on public.food_menu for update to authenticated using(public.auth_role()='admin') with check(public.auth_role()='admin');

create table public.food_orders(
 id uuid primary key default gen_random_uuid(), booking_id uuid references public.bookings(id),
 menu_id uuid not null references public.food_menu(id), quantity integer not null check(quantity between 1 and 50),
 unit_price numeric(10,2) not null, item_name text not null,
 status text not null default 'pending' check(status in ('pending','preparing','ready','served','cancelled')),
 notes text not null default '' check(length(notes)<=1000),
 created_by uuid not null default auth.uid() references public.profiles(id), created_at timestamptz not null default now()
);
alter table public.food_orders enable row level security;
grant select,insert,update on public.food_orders to authenticated;
create policy orders_read_staff on public.food_orders for select to authenticated using(public.auth_role() in ('admin','receptionist','restaurant_staff'));
create policy orders_insert_staff on public.food_orders for insert to authenticated with check(public.auth_role() in ('admin','receptionist') and created_by=auth.uid());
create policy orders_update_staff on public.food_orders for update to authenticated using(public.auth_role() in ('admin','receptionist','restaurant_staff')) with check(public.auth_role() in ('admin','receptionist','restaurant_staff'));
create function public.guard_food_order() returns trigger language plpgsql security invoker set search_path='' as $$
declare item public.food_menu;
begin
 if tg_op='INSERT' then
  select * into item from public.food_menu where id=new.menu_id and is_available for share;
  if not found then raise exception 'Food item is unavailable'; end if;
  if new.booking_id is not null and not exists(select 1 from public.bookings where id=new.booking_id and status='checked_in') then raise exception 'Choose a checked-in booking';end if;
  new.unit_price:=item.price;new.item_name:=item.name;new.status:='pending';new.created_by:=auth.uid();
 else
  if (to_jsonb(new)-'status') is distinct from (to_jsonb(old)-'status') then raise exception 'Only order status may change';end if;
  if new.status<>old.status and not (
   (old.status='pending' and new.status in ('preparing','cancelled')) or
   (old.status='preparing' and new.status in ('ready','cancelled')) or
   (old.status='ready' and new.status='served')) then raise exception 'Invalid order transition';end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_food_order() from public,anon,authenticated;
create trigger food_order_guard before insert or update on public.food_orders for each row execute function public.guard_food_order();

-- SECURITY DEFINER is narrowly needed to resolve verified Auth email; the caller
-- must be an active administrator. No password/hash or other Auth data is returned.
create function public.manage_receptionist(p_email text,p_enabled boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare target uuid; current_role public.app_role;
begin
 if auth.uid() is null or public.auth_role() is distinct from 'admin' then raise exception 'Administrator access required';end if;
 if p_enabled is null then raise exception 'Choose an access state';end if;
 perform pg_advisory_xact_lock(hashtextextended('nafiis-receptionists',0));
 select u.id,p.role into target,current_role from auth.users u join public.profiles p on p.id=u.id
 where lower(u.email)=lower(trim(p_email)) and u.email_confirmed_at is not null;
 if target is null then raise exception 'Ask this person to register and verify their email first';end if;
 if current_role not in ('guest','receptionist') then raise exception 'This account has another staff role';end if;
 if p_enabled and current_role<>'receptionist' and (select count(*) from public.profiles where role='receptionist')>=3 then raise exception 'Only three receptionist accounts are allowed';end if;
 update public.profiles set role=case when p_enabled then 'receptionist'::public.app_role else 'guest'::public.app_role end where id=target;
 if p_enabled then
  insert into public.staff(profile_id,employee_code,department) values(target,'REC-'||target::text,'Reception')
  on conflict(profile_id) do update set department='Reception';
 end if;
 return target;
end $$;
revoke all on function public.manage_receptionist(text,boolean) from public,anon;
grant execute on function public.manage_receptionist(text,boolean) to authenticated;
create function public.guard_receptionist_limit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.role='receptionist' and old.role<>'receptionist' then
  perform pg_advisory_xact_lock(hashtextextended('nafiis-receptionists',0));
  if (select count(*) from public.profiles where role='receptionist' and id<>new.id)>=3 then raise exception 'Only three receptionist accounts are allowed';end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_receptionist_limit() from public,anon,authenticated;
create trigger receptionist_limit before update on public.profiles for each row execute function public.guard_receptionist_limit();

insert into public.food_menu(name,category,description,price) values
('Canjeero','Breakfast','Somali pancake with honey and ghee, or with liver and onions.',3),
('Beer iyo canjeero','Breakfast','Sautéed liver with peppers and onion, served with canjeero.',5),
('Eggs your way','Breakfast','Fried, scrambled or as an omelette, with bread and salad.',4),
('Fresh fruit plate','Breakfast','Papaya, mango, banana and lime, as the market allows.',3),
('Bariis iskukaris','Mains','Spiced rice with tender goat or chicken, raisins and banana on the side.',9),
('Grilled fish','Mains','The morning catch, grilled with lime and spices, with rice or chips.',12),
('Suqaar','Mains','Small cubes of beef stir-fried with peppers and onion.',8),
('Baasto','Mains','Pasta with a rich Somali-spiced meat sauce.',7),
('Shaah','Drinks','Somali spiced tea with cardamom, cinnamon and cloves.',1),
('Fresh juice','Drinks','Mango, papaya, lemon or a mix, pressed to order.',3),
('Coffee','Drinks','Black, with milk or spiced.',2),
('Water and soft drinks','Drinks','Chilled, still or sparkling.',1);

create function public.hotel_management_report(p_start date,p_end date) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or public.auth_role() is distinct from 'admin' then raise exception 'Administrator access required';end if;
 if p_end<=p_start then raise exception 'Invalid dates';end if;
 return jsonb_build_object(
 'arrivals',(select count(*) from public.bookings where check_in>=p_start and check_in<p_end),
 'departures',(select count(*) from public.bookings where check_out>=p_start and check_out<p_end),
 'cancelled_arrivals',(select count(*) from public.bookings where check_in>=p_start and check_in<p_end and status='cancelled'),
 'booking_value_usd',(select coalesce(sum(total_amount),0) from public.bookings where check_in>=p_start and check_in<p_end and status<>'cancelled'),
 'approved_payments_usd',(select coalesce(sum(amount),0) from public.payment_submissions where reviewed_at>=p_start::timestamp at time zone 'Africa/Mogadishu' and reviewed_at<p_end::timestamp at time zone 'Africa/Mogadishu' and status='approved'),
 'food_order_value_usd',(select coalesce(sum(quantity*unit_price),0) from public.food_orders where created_at>=p_start::timestamp at time zone 'Africa/Mogadishu' and created_at<p_end::timestamp at time zone 'Africa/Mogadishu' and status<>'cancelled'),
 'active_rooms',(select count(*) from public.rooms where is_active),
 'receptionists',(select count(*) from public.profiles where role='receptionist')
 );
end $$;
revoke all on function public.hotel_management_report(date,date) from public,anon;
grant execute on function public.hotel_management_report(date,date) to authenticated;
grant update(booking_name,booking_phone) on public.guests to authenticated;
-- Availability must agree with checkout's housekeeping exclusions.
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
