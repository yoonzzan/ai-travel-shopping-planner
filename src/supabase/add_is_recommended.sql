alter table public.shopping_items 
add column is_recommended boolean default false;

-- Update existing items to have is_recommended = true (assuming existing ones were mostly AI generated)
-- Or default to false. User asked for "recommended classification".
-- Let's just add the column.
