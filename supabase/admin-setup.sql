create policy "auth write categories" on categories
  for all
  to authenticated
  using (true)
  with check (true);

create policy "auth write menu_items" on menu_items
  for all
  to authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "public read menu images" on storage.objects
  for select
  using (bucket_id = 'menu-images');

create policy "auth upload menu images" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'menu-images');

create policy "auth update menu images" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'menu-images');

create policy "auth delete menu images" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-images');
