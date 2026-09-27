-- Schema: brands, profiles, brand_memberships, replies, reviews, tags, review_tags, brand_actions

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  voice_notes text
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('specialist', 'team_lead'))
);

create table public.brand_memberships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  primary key (user_id, brand_id)
);

create index brand_memberships_brand_id_idx on public.brand_memberships (brand_id);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  specialist_id uuid not null references public.profiles (id) on delete cascade,
  subject text,
  customer_message text not null,
  body text not null,
  sent_at timestamptz not null default now(),
  source text not null default 'seed',
  external_id text,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

create index replies_brand_sent_at_idx on public.replies (brand_id, sent_at desc);
create index replies_specialist_sent_at_idx on public.replies (specialist_id, sent_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references public.replies (id) on delete restrict,
  reviewer_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  score smallint not null check (score between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  unique (reply_id)
);

create index reviews_reviewer_id_idx on public.reviews (reviewer_id);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands (id) on delete cascade,
  slug text not null,
  label text not null,
  description text,
  unique nulls not distinct (brand_id, slug)
);

create table public.review_tags (
  review_id uuid not null references public.reviews (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (review_id, tag_id)
);

create index review_tags_tag_id_idx on public.review_tags (tag_id);

create table public.brand_actions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  taken_at date not null,
  note text not null check (length(trim(note)) > 0),
  tag_id uuid references public.tags (id) on delete set null,
  created_at timestamptz not null default now()
);

create index brand_actions_brand_taken_at_idx on public.brand_actions (brand_id, taken_at);
