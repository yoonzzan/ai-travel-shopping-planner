-- Fix infinite recursion in RLS policies

-- 1. Create a security definer function to check trip ownership
-- This function runs with the privileges of the creator (postgres), bypassing RLS on the trips table
create or replace function public.is_trip_owner(trip_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.trips
    where id = trip_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 2. Drop the problematic policy on trip_members
drop policy "Users can view members of their trips" on public.trip_members;

-- 3. Re-create the policy using the security definer function
create policy "Users can view members of their trips" on public.trip_members
  for select using (
    public.is_trip_owner(trip_id)
    or
    user_id = auth.uid()
  );
