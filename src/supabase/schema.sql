-- Create profiles table to extend auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Create trips table
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  destination text not null,
  start_date date,
  end_date date,
  budget integer,
  preferences text[],
  purposes text[],
  companions text[],
  created_at timestamp with time zone default now()
);

-- Create shopping_items table
create table public.shopping_items (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  location_id text not null, -- 'departure', 'arrival', or specific city location id
  location_name text,
  category text,
  product_name text not null,
  brand text,
  estimated_price integer,
  reason text,
  priority text, -- 'high', 'medium', 'low'
  purchased boolean default false,
  purchased_by text, -- Store name for simplicity in MVP
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.shopping_items enable row level security;

-- Create policies
-- Profiles: Users can view and update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Trips: Users can view and manage their own trips
create policy "Users can view own trips" on public.trips
  for select using (auth.uid() = user_id);

create policy "Users can insert own trips" on public.trips
  for insert with check (auth.uid() = user_id);

create policy "Users can update own trips" on public.trips
  for update using (auth.uid() = user_id);

create policy "Users can delete own trips" on public.trips
  for delete using (auth.uid() = user_id);

-- Shopping Items: Users can view and manage items for their trips
-- Note: This simple policy assumes only the trip owner accesses items.
-- For group shopping, we would need a 'trip_members' table or check companions.
-- For MVP, we'll stick to owner-only or open it up if needed.
create policy "Users can view items of own trips" on public.shopping_items
  for select using (
    exists (
      select 1 from public.trips
      where public.trips.id = public.shopping_items.trip_id
      and public.trips.user_id = auth.uid()
    )
  );

create policy "Users can insert items to own trips" on public.shopping_items
  for insert with check (
    exists (
      select 1 from public.trips
      where public.trips.id = public.shopping_items.trip_id
      and public.trips.user_id = auth.uid()
    )
  );

create policy "Users can update items of own trips" on public.shopping_items
  for update using (
    exists (
      select 1 from public.trips
      where public.trips.id = public.shopping_items.trip_id
      and public.trips.user_id = auth.uid()
    )
  );

create policy "Users can delete items of own trips" on public.shopping_items
  for delete using (
    exists (
      select 1 from public.trips
      where public.trips.id = public.shopping_items.trip_id
      and public.trips.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
