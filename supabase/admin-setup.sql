-- Write access is restricted to the single admin account by email.
-- Change the email below if the admin account changes.
-- Safe to re-run: every policy is dropped (old + new names) before create.

-- categories
drop policy if exists "auth write categories" on categories;
drop policy if exists "admin write categories" on categories;
create policy "admin write categories" on categories
  for all to authenticated
  using (auth.jwt()->>'email' = 'admin.cafe.paf@proton.me')
  with check (auth.jwt()->>'email' = 'admin.cafe.paf@proton.me');

-- menu_items
drop policy if exists "auth write menu_items" on menu_items;
drop policy if exists "admin write menu_items" on menu_items;
create policy "admin write menu_items" on menu_items
  for all to authenticated
  using (auth.jwt()->>'email' = 'admin.cafe.paf@proton.me')
  with check (auth.jwt()->>'email' = 'admin.cafe.paf@proton.me');

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- storage: public read
drop policy if exists "public read menu images" on storage.objects;
create policy "public read menu images" on storage.objects
  for select
  using (bucket_id = 'menu-images');

-- storage: upload
drop policy if exists "auth upload menu images" on storage.objects;
drop policy if exists "admin upload menu images" on storage.objects;
create policy "admin upload menu images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-images' and auth.jwt()->>'email' = 'admin.cafe.paf@proton.me');

-- storage: update
drop policy if exists "auth update menu images" on storage.objects;
drop policy if exists "admin update menu images" on storage.objects;
create policy "admin update menu images" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu-images' and auth.jwt()->>'email' = 'admin.cafe.paf@proton.me');

-- storage: delete
drop policy if exists "auth delete menu images" on storage.objects;
drop policy if exists "admin delete menu images" on storage.objects;
create policy "admin delete menu images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu-images' and auth.jwt()->>'email' = 'admin.cafe.paf@proton.me');
