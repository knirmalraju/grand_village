-- Parents review senior hosts after a completed booking. Hosts can read feedback.
begin;
drop policy if exists review_insert on public.reviews;
create policy review_insert on public.reviews for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.status = 'completed' and b.parent_id = auth.uid()
  )
);
commit;
