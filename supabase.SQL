-- Run this in Supabase SQL Editor
 
create table stories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image text not null,
  created_at timestamptz default now()
);
 
-- Allow anyone to read and add stories (fine for a public demo/portfolio project)
alter table stories enable row level security;
 
create policy "Public can read stories"
  on stories for select
  using (true);
 
create policy "Public can add stories"
  on stories for insert
  with check (true);