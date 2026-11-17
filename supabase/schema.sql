-- Public Voicemail Box schema for Supabase (Postgres + Row Level Security)
-- Run this in the Supabase SQL Editor, then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.

create extension if not exists pgcrypto;

create table if not exists public.voicemails (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author_name text not null default 'Anonymous Visitor'
    constraint voicemails_author_len check (char_length(btrim(author_name)) between 1 and 40),
  role_tag text not null default 'Visitor'
    constraint voicemails_role_check check (role_tag in ('Visitor', 'Developer', 'Recruiter', 'Designer')),
  input_mode text not null
    constraint voicemails_mode_check check (input_mode in ('whistle', 'text')),
  transcript text not null
    constraint voicemails_transcript_len check (char_length(btrim(transcript)) between 3 and 400)
    constraint voicemails_no_urls check (transcript !~* '(https?://|www\.)'),
  duration_sec integer
    constraint voicemails_duration_range check (duration_sec is null or (duration_sec between 1 and 30)),
  inference_ms integer
    constraint voicemails_inference_range check (inference_ms is null or (inference_ms between 0 and 60000)),
  language text default 'en'
    constraint voicemails_lang_len check (language is null or char_length(language) between 1 and 12),
  is_approved boolean not null default true
);

create index if not exists idx_voicemails_approved_created
  on public.voicemails (is_approved, created_at desc);

alter table public.voicemails enable row level security;

drop policy if exists "Public can read approved voicemails" on public.voicemails;
create policy "Public can read approved voicemails"
  on public.voicemails
  for select
  to anon, authenticated
  using (is_approved = true);

drop policy if exists "Public can insert immediate voicemails" on public.voicemails;
create policy "Public can insert immediate voicemails"
  on public.voicemails
  for insert
  to anon, authenticated
  with check (is_approved = true);
