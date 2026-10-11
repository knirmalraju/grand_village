begin;
alter table public.messages add column photo_path text;
alter table public.messages drop constraint messages_body_check;
alter table public.messages add constraint messages_content_check check (
  char_length(body) <= 2000 and (char_length(trim(body)) > 0 or photo_path is not null)
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('chat-photos','chat-photos',false,1048576,array['image/jpeg']);
create policy chat_photo_insert on storage.objects for insert to authenticated with check (
  bucket_id='chat-photos' and (storage.foldername(name))[2]=auth.uid()::text
  and exists(select 1 from public.bookings b where b.id::text=(storage.foldername(name))[1]
    and b.status in ('accepted','completed') and (b.parent_id=auth.uid() or b.host_id=auth.uid()))
);
create policy chat_photo_read on storage.objects for select to authenticated using (
  bucket_id='chat-photos' and exists(select 1 from public.bookings b where b.id::text=(storage.foldername(name))[1]
    and b.status in ('accepted','completed') and (b.parent_id=auth.uid() or b.host_id=auth.uid()))
);
-- Cleanup only your own unattached uploads; sent photos remain part of the conversation.
create policy chat_photo_cleanup on storage.objects for delete to authenticated using (
  bucket_id='chat-photos' and (storage.foldername(name))[2]=auth.uid()::text
  and not exists(select 1 from public.messages m where m.photo_path=name)
);
create function public.validate_message_photo() returns trigger language plpgsql set search_path=public as $$
begin
  if new.photo_path is not null and (
    new.photo_path not like new.booking_id::text || '/' || new.sender_id::text || '/%'
    or not exists(select 1 from storage.objects o where o.bucket_id='chat-photos' and o.name=new.photo_path)
  ) then raise exception 'Photo does not belong to this conversation.'; end if;
  return new;
end;$$;
create trigger validate_message_photo before insert on public.messages for each row execute function public.validate_message_photo();
commit;
