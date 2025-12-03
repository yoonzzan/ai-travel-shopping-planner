-- Create trip_members table
create table public.trip_members (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamp with time zone default now(),
  unique(trip_id, user_id)
);

-- Enable RLS
alter table public.trip_members enable row level security;

-- Policies for trip_members
create policy "Users can view members of their trips" on public.trip_members
  for select using (
    exists (
      select 1 from public.trips
      where public.trips.id = public.trip_members.trip_id
      and public.trips.user_id = auth.uid()
    )
    or
    user_id = auth.uid()
  );

create policy "Users can join trips" on public.trip_members
  for insert with check (auth.uid() = user_id);

-- Update Policies for Shopping Items to allow members to view/edit
drop policy "Users can view items of own trips" on public.shopping_items;
create policy "Users and members can view items" on public.shopping_items
  for select using (
    exists (
      select 1 from public.trips
      where public.trips.id = public.shopping_items.trip_id
      and public.trips.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.trip_members
      where public.trip_members.trip_id = public.shopping_items.trip_id
      and public.trip_members.user_id = auth.uid()
    )
  );

drop policy "Users can update items of own trips" on public.shopping_items;
create policy "Users and members can update items" on public.shopping_items
  for update using (
    exists (
      select 1 from public.trips
      where public.trips.id = public.shopping_items.trip_id
      and public.trips.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.trip_members
      where public.trip_members.trip_id = public.shopping_items.trip_id
      and public.trip_members.user_id = auth.uid()
    )
  );

-- Allow members to view the trip details
create policy "Members can view trip details" on public.trips
  for select using (
    exists (
      select 1 from public.trip_members
      where public.trip_members.trip_id = public.trips.id
      and public.trip_members.user_id = auth.uid()
    )
  );
