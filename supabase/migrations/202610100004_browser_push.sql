begin;
create table public.push_subscriptions(endpoint text primary key, user_id uuid not null references public.profiles(id) on delete cascade, p256dh text not null, auth text not null, created_at timestamptz not null default now());
alter table public.push_subscriptions enable row level security;
create policy own_push_subscriptions on public.push_subscriptions for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.profiles where id=auth.uid() and role='parent'));
grant select,insert,update,delete on public.push_subscriptions to authenticated;
create table public.push_outbox(message_id uuid primary key references public.messages(id) on delete cascade, booking_id uuid not null references public.bookings(id), parent_id uuid not null references public.profiles(id), status text not null default 'pending', attempts integer not null default 0, claimed_at timestamptz, created_at timestamptz not null default now());
alter table public.push_outbox enable row level security;
revoke all on public.push_outbox from anon,authenticated;
create function public.queue_parent_push() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.type='chat' then
    insert into push_outbox(message_id,booking_id,parent_id,created_at)
    select new.id,b.id,b.parent_id,new.created_at from bookings b where b.id=new.booking_id and b.host_id=new.sender_id;
  end if;
  return new;
end;$$;
create trigger queue_parent_push after insert on public.messages for each row execute function public.queue_parent_push();
create function public.claim_push_jobs(p_message uuid default null) returns setof public.push_outbox language sql security definer set search_path=public as $$
  update push_outbox set status='processing',attempts=attempts+1,claimed_at=now()
  where message_id in (
    select message_id from push_outbox
    where (p_message is null or message_id=p_message) and attempts<5
    and (status='pending' or (status='processing' and claimed_at < now()-interval '5 minutes'))
    and created_at > now()-interval '1 hour'
    order by created_at limit 10 for update skip locked
  ) returning *;
$$;
revoke all on function public.claim_push_jobs(uuid) from public,anon,authenticated;
grant execute on function public.claim_push_jobs(uuid) to service_role;
grant all on public.push_outbox,public.push_subscriptions to service_role;
commit;
