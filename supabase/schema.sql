create table categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  sort_order  int  not null default 0
);

create table menu_items (
  id           bigint generated always as identity primary key,
  category_id  bigint references categories(id) on delete cascade,
  name         text    not null,
  description  text,
  price        numeric(10,2) not null,
  image_url    text,
  badge        text,
  badge_color  text,
  is_available boolean not null default true,
  sort_order   int     not null default 0
);

alter table categories enable row level security;
alter table menu_items enable row level security;

create policy "public read categories" on categories
  for select using (true);

create policy "public read menu_items" on menu_items
  for select using (true);

insert into categories (name, sort_order) values
  ('Coffee', 1),
  ('Desserts', 2);

insert into menu_items (category_id, name, description, price, image_url, badge, sort_order) values
  (1, 'Coffee',        'Freshly brewed, made with care',     3.20, 'images/cup-of-coffee.png', 'Bestseller', 1),
  (2, 'Cheesecake',    'Creamy classic with berry sauce',    4.50, 'images/cheesecake.png',    'Popular',    1),
  (2, 'Cinnamon-roll', 'Warm, soft, freshly baked',          3.80, 'images/cinnamon-roll.png', null,         2),
  (2, 'Brownie',       'Rich chocolate, slightly gooey',     3.50, 'images/brownie.png',       null,         3);
