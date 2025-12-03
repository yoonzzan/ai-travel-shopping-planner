-- Add local_price and currency_code to shopping_items table
ALTER TABLE public.shopping_items
ADD COLUMN local_price integer,
ADD COLUMN currency_code text;
