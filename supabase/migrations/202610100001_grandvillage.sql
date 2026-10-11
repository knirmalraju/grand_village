-- GrandVillage initial schema. Apply once to the intended Supabase project.
-- No demo people or care records are inserted into your live database.
begin;
create extension if not exists btree_gist;
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,role text not null check(role in ('parent','host','admin')),display_name text not null default 'Neighbor',care_preferences text not null default '',created_at timestamptz default now());
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and role='admin')$$;
create table public.host_details(id uuid primary key references public.profiles(id) on delete cascade,name text not null,title text not null default 'A little time, thoughtfully shared.',bio text not null default '',image text not null default '/images/eleanor.jpg',rate numeric(8,2) not null default 24 check(rate between 10 and 200),languages text[] not null default array['English'],services text[] not null default array['Childcare'],neighborhood text not null default 'Your neighborhood',tags text[] not null default array['A new connection'],approved boolean not null default false);
create table public.availability(id uuid primary key default gen_random_uuid(),host_id uuid not null references host_details(id),starts_at timestamptz not null,ends_at timestamptz not null,check(ends_at>starts_at));
create table public.bookings(id uuid primary key default gen_random_uuid(),parent_id uuid not null references profiles(id),host_id uuid not null references host_details(id),parent_name text not null,service text not null,starts_at timestamptz not null,ends_at timestamptz not null,status text not null default 'requested' check(status in ('requested','accepted','completed','declined','cancelled')),amount numeric(10,2) not null check(amount>0),hourly_rate numeric(8,2) not null,platform_fee numeric(10,2) not null,payment_status text not null default 'unpaid' check(payment_status in ('unpaid','pending','paid','failed','refunded')),child_age_range text not null default '',accepted_at timestamptz,created_at timestamptz not null default now(),check(ends_at>starts_at),exclude using gist(host_id with =,tstzrange(starts_at,ends_at,'[)') with &&) where(status='accepted'));
create table public.booking_private(booking_id uuid primary key references bookings(id) on delete cascade,care_notes text not null default '');
create table public.messages(id uuid primary key default gen_random_uuid(),booking_id uuid not null references bookings(id) on delete cascade,sender_id uuid not null references profiles(id),body text not null check(char_length(trim(body)) between 1 and 2000),type text not null default 'chat' check(type in ('chat','update')),created_at timestamptz not null default now());
create table public.reviews(id uuid primary key default gen_random_uuid(),booking_id uuid not null references bookings(id),reviewer_id uuid not null references profiles(id),rating integer not null check(rating between 1 and 5),body text not null check(char_length(body) between 5 and 1000),created_at timestamptz default now(),unique(booking_id,reviewer_id));
create table public.support_cases(id uuid primary key default gen_random_uuid(),user_id uuid not null references profiles(id),subject text not null check(char_length(subject) between 1 and 100),body text not null check(char_length(body) between 10 and 2000),status text not null default 'open' check(status in ('open','resolved')),created_at timestamptz default now());
create table public.saved_hosts(user_id uuid references profiles(id) on delete cascade,host_id uuid references host_details(id) on delete cascade,primary key(user_id,host_id));
create table public.audit_events(id bigint generated always as identity primary key,actor_id uuid references profiles(id),action text not null,entity_id uuid,created_at timestamptz default now());
create table public.payments(id uuid primary key default gen_random_uuid(),booking_id uuid not null unique references bookings(id),stripe_session_id text unique,amount_total numeric(10,2) not null,platform_fee numeric(10,2) not null,payment_status text not null default 'unpaid',payout_status text not null default 'not_initiated',created_at timestamptz default now());
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$declare r text; n text; begin r:=case when new.raw_user_meta_data->>'role'='host' then 'host' else 'parent' end;n:=left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Neighbor'),80);insert into profiles(id,role,display_name) values(new.id,r,n);if r='host' then insert into host_details(id,name) values(new.id,n);end if;return new;end;$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
alter table profiles enable row level security;alter table host_details enable row level security;alter table availability enable row level security;alter table bookings enable row level security;alter table booking_private enable row level security;alter table messages enable row level security;alter table reviews enable row level security;alter table support_cases enable row level security;alter table saved_hosts enable row level security;alter table audit_events enable row level security;alter table payments enable row level security;
create policy profile_read on profiles for select to authenticated using(id=auth.uid() or is_admin());
create policy hosts_read on host_details for select using(approved or id=auth.uid() or is_admin());
create policy availability_read on availability for select using(exists(select 1 from host_details h where h.id=host_id and (h.approved or h.id=auth.uid())) or is_admin());
create policy availability_insert on availability for insert to authenticated with check(host_id=auth.uid() and exists(select 1 from profiles where id=auth.uid() and role='host'));
create policy availability_delete on availability for delete to authenticated using(host_id=auth.uid());
create policy booking_read on bookings for select to authenticated using(parent_id=auth.uid() or host_id=auth.uid() or is_admin());
create policy private_read on booking_private for select to authenticated using(exists(select 1 from bookings b where b.id=booking_id and (b.parent_id=auth.uid() or (b.host_id=auth.uid() and b.status in ('accepted','completed')))) or is_admin());
create policy message_read on messages for select to authenticated using(exists(select 1 from bookings b where b.id=booking_id and b.status in ('accepted','completed') and (b.parent_id=auth.uid() or b.host_id=auth.uid())) or is_admin());
create policy message_insert on messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from bookings b where b.id=booking_id and b.status in ('accepted','completed') and (b.parent_id=auth.uid() or b.host_id=auth.uid()) and (type='chat' or b.host_id=auth.uid())));
create policy review_read on reviews for select to authenticated using(exists(select 1 from bookings b where b.id=booking_id and (b.parent_id=auth.uid() or b.host_id=auth.uid())) or is_admin());
create policy review_insert on reviews for insert to authenticated with check(reviewer_id=auth.uid() and exists(select 1 from bookings b where b.id=booking_id and b.status='completed' and (b.parent_id=auth.uid() or b.host_id=auth.uid())));
create policy case_read on support_cases for select to authenticated using(user_id=auth.uid() or is_admin());
create policy case_insert on support_cases for insert to authenticated with check(user_id=auth.uid() and status='open');
create policy case_update on support_cases for update to authenticated using(is_admin()) with check(is_admin());
create policy saved_all on saved_hosts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy audit_read on audit_events for select to authenticated using(is_admin());
create policy payment_read on payments for select to authenticated using(exists(select 1 from bookings b where b.id=booking_id and b.parent_id=auth.uid()) or is_admin());
create function public.request_booking(p_host uuid,p_service text,p_start timestamptz,p_end timestamptz,p_age text,p_notes text) returns uuid language plpgsql security definer set search_path=public as $$declare h host_details; p profiles; new_id uuid; total numeric;begin
select * into p from profiles where id=auth.uid();if p.role is distinct from 'parent' then raise exception 'A parent account is required.';end if;
select * into h from host_details where id=p_host and approved;if not found then raise exception 'Host is not available.';end if;
if not(p_service=any(h.services)) then raise exception 'This host does not offer this service.';end if;
if p_start<=now() or p_end<=p_start or p_end>p_start+interval '8 hours' then raise exception 'Choose a future time between 1 and 8 hours.';end if;
if char_length(p_notes)>1000 or char_length(p_age)>40 then raise exception 'Care information is too long.';end if;
if not exists(select 1 from availability where host_id=p_host and starts_at<=p_start and ends_at>=p_end) then raise exception 'Choose a time within the host’s published availability.';end if;
if exists(select 1 from bookings where host_id=p_host and status='accepted' and tstzrange(starts_at,ends_at,'[)') && tstzrange(p_start,p_end,'[)')) then raise exception 'This host is already booked at that time.';end if;
total:=round(h.rate*extract(epoch from(p_end-p_start))/3600,2);
insert into bookings(parent_id,host_id,parent_name,service,starts_at,ends_at,amount,hourly_rate,platform_fee,child_age_range)values(p.id,p_host,p.display_name,p_service,p_start,p_end,total,h.rate,round(total*.15,2),p_age)returning id into new_id;
insert into booking_private values(new_id,p_notes);return new_id;end;$$;
create function public.transition_booking(p_id uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$declare b bookings;begin
select * into b from bookings where id=p_id for update;if not found or auth.uid() is null or auth.uid() not in(b.parent_id,b.host_id) then raise exception 'Booking not available.';end if;
if p_status in('accepted','declined') then if auth.uid()<>b.host_id or b.status<>'requested' then raise exception 'Only the host can respond to a pending request.';end if;
elsif p_status='completed' then if b.status<>'accepted' or b.payment_status<>'paid' or b.ends_at>now() then raise exception 'Completion requires a paid booking whose scheduled time has ended.';end if;
elsif p_status='cancelled' then if b.status not in('requested','accepted') or b.payment_status='paid' then raise exception 'Paid bookings need the support cancellation process.';end if;
else raise exception 'Unsupported status.';end if;
update bookings set status=p_status,accepted_at=case when p_status='accepted' then now() else accepted_at end where id=p_id;
insert into audit_events(actor_id,action,entity_id)values(auth.uid(),'booking.'||p_status,p_id);end;$$;
create function public.save_profile(p_name text,p_bio text,p_rate numeric,p_languages text[],p_service text) returns void language plpgsql security definer set search_path=public as $$declare r text;begin
if auth.uid() is null then raise exception 'Sign in required.';end if;if char_length(trim(p_name)) not between 1 and 80 or char_length(p_bio)>2000 or p_rate not between 10 and 200 then raise exception 'Invalid profile.';end if;
select role into r from profiles where id=auth.uid();update profiles set display_name=p_name,care_preferences=case when r='parent' then p_bio else care_preferences end where id=auth.uid();
if r='host' then update host_details set name=p_name,bio=p_bio,rate=p_rate,languages=p_languages,services=case when p_service is null then services else array[p_service] end where id=auth.uid();end if;end;$$;
create function public.toggle_host_listing(p_id uuid) returns void language plpgsql security definer set search_path=public as $$begin if not is_admin() then raise exception 'Admin access required.';end if;update host_details set approved=not approved where id=p_id;insert into audit_events(actor_id,action,entity_id)values(auth.uid(),'host.toggle_listing',p_id);end;$$;
-- Deny direct writes to money, roles, approval, and booking states; use validated RPCs.
revoke all on profiles,host_details,availability,bookings,booking_private,messages,reviews,support_cases,saved_hosts,audit_events,payments from anon,authenticated;
grant select on host_details,availability to anon;
grant select on profiles,host_details,availability,bookings,booking_private,messages,reviews,support_cases,saved_hosts,audit_events,payments to authenticated;
grant insert on availability,messages,reviews,support_cases,saved_hosts to authenticated;
grant delete on availability,saved_hosts to authenticated;
grant update(status) on support_cases to authenticated;
revoke execute on function public.request_booking(uuid,text,timestamptz,timestamptz,text,text),public.transition_booking(uuid,text),public.save_profile(text,text,numeric,text[],text),public.toggle_host_listing(uuid) from public,anon;
grant execute on function public.request_booking(uuid,text,timestamptz,timestamptz,text,text),public.transition_booking(uuid,text),public.save_profile(text,text,numeric,text[],text),public.toggle_host_listing(uuid) to authenticated;
create index bookings_parent_idx on bookings(parent_id);create index bookings_host_idx on bookings(host_id);create index messages_booking_idx on messages(booking_id,created_at);create index support_user_idx on support_cases(user_id);
-- Realtime is protected by the same row-level policies.
alter publication supabase_realtime add table public.bookings,public.messages;

create table public.host_payout_accounts(host_id uuid primary key references host_details(id),stripe_account_id text not null unique);
alter table public.host_payout_accounts enable row level security;
-- Connected-account references are never exposed in public host profiles.
revoke all on public.host_payout_accounts from anon,authenticated;
create function public.record_test_payment(p_booking uuid,p_session text,p_total numeric,p_currency text) returns void language plpgsql security definer set search_path=public as $$declare b bookings;begin
select * into b from bookings where id=p_booking for update;
if not found or p_currency<>'usd' or p_total<>b.amount then raise exception 'Payment does not match booking.';end if;
if b.payment_status='paid' then return;end if;
if b.status<>'accepted' then raise exception 'Booking requires payment reconciliation.';end if;
insert into payments(booking_id,stripe_session_id,amount_total,platform_fee,payment_status)values(p_booking,p_session,p_total,b.platform_fee,'paid')on conflict(booking_id)do update set payment_status='paid',stripe_session_id=excluded.stripe_session_id;
update bookings set payment_status='paid' where id=p_booking;
insert into audit_events(action,entity_id)values('payment.test_paid',p_booking);end;$$;
revoke execute on function public.record_test_payment(uuid,text,numeric,text) from public,anon,authenticated;
grant execute on function public.record_test_payment(uuid,text,numeric,text) to service_role;


create table public.read_receipts(user_id uuid references profiles(id) on delete cascade,booking_id uuid references bookings(id) on delete cascade,read_at timestamptz not null default now(),primary key(user_id,booking_id));
alter table public.read_receipts enable row level security;
revoke all on public.read_receipts from anon,authenticated;
grant select,insert,update on public.read_receipts to authenticated;
create policy read_receipts_own on public.read_receipts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from bookings b where b.id=booking_id and auth.uid() in(b.parent_id,b.host_id)));

commit;
