-- Helpers (security definer) + RLS enablement + policies

create function public.is_brand_member(p_brand_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.brand_memberships m
    where m.user_id = (select auth.uid()) and m.brand_id = p_brand_id
  );
$$;

create function public.is_team_lead() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'team_lead'
  );
$$;

create function public.shares_brand_with(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.brand_memberships mine
    join public.brand_memberships theirs on theirs.brand_id = mine.brand_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  );
$$;

revoke execute on function public.is_brand_member(uuid) from public, anon;
revoke execute on function public.is_team_lead() from public, anon;
revoke execute on function public.shares_brand_with(uuid) from public, anon;
grant execute on function public.is_brand_member(uuid) to authenticated;
grant execute on function public.is_team_lead() to authenticated;
grant execute on function public.shares_brand_with(uuid) to authenticated;

-- Enable RLS on every table.
alter table public.brands enable row level security;
alter table public.profiles enable row level security;
alter table public.brand_memberships enable row level security;
alter table public.replies enable row level security;
alter table public.reviews enable row level security;
alter table public.tags enable row level security;
alter table public.review_tags enable row level security;
alter table public.brand_actions enable row level security;

-- brands: SELECT only for members.
create policy brands_select on public.brands
  for select to authenticated
  using (public.is_brand_member(id));

-- profiles: A17 minimal visibility.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (public.is_team_lead() and public.shares_brand_with(id))
    or exists (
      select 1
      from public.reviews rv
      join public.replies r on r.id = rv.reply_id
      where r.specialist_id = (select auth.uid()) and rv.reviewer_id = profiles.id
    )
  );

-- brand_memberships.
create policy brand_memberships_select on public.brand_memberships
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (public.is_team_lead() and public.is_brand_member(brand_id))
  );

-- replies: A18 (authorship for specialists, membership for leads).
create policy replies_select on public.replies
  for select to authenticated
  using (
    (public.is_team_lead() and public.is_brand_member(brand_id))
    or specialist_id = (select auth.uid())
  );

-- reviews.
create policy reviews_select on public.reviews
  for select to authenticated
  using (
    exists (
      select 1 from public.replies r
      where r.id = reviews.reply_id
        and (
          (public.is_team_lead() and public.is_brand_member(r.brand_id))
          or r.specialist_id = (select auth.uid())
        )
    )
  );

create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and public.is_team_lead()
    and exists (
      select 1 from public.replies r
      where r.id = reviews.reply_id and public.is_brand_member(r.brand_id)
    )
  );

-- review_tags.
create policy review_tags_select on public.review_tags
  for select to authenticated
  using (
    exists (
      select 1 from public.reviews rv
      join public.replies r on r.id = rv.reply_id
      where rv.id = review_tags.review_id
        and (
          (public.is_team_lead() and public.is_brand_member(r.brand_id))
          or r.specialist_id = (select auth.uid())
        )
    )
  );

-- A8: tags may only be attached inside the same transaction that created the
-- review (created_at = now()), and only when the tag is global or belongs to
-- the reply's brand. No REVOKE INSERT here: that would also block the
-- invoker-run submit_review RPC (see A8 rationale).
create policy review_tags_insert on public.review_tags
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.reviews rv
      join public.replies r on r.id = rv.reply_id
      where rv.id = review_tags.review_id
        and rv.reviewer_id = (select auth.uid())
        and rv.created_at = now()
    )
    and exists (
      select 1
      from public.reviews rv
      join public.replies r on r.id = rv.reply_id
      left join public.tags t on t.id = review_tags.tag_id
      where rv.id = review_tags.review_id
        and (t.brand_id is null or t.brand_id = r.brand_id)
    )
  );

-- tags.
create policy tags_select on public.tags
  for select to authenticated
  using (brand_id is null or public.is_brand_member(brand_id));

-- brand_actions: A19.
create policy brand_actions_select on public.brand_actions
  for select to authenticated
  using (public.is_team_lead() and public.is_brand_member(brand_id));

create policy brand_actions_insert on public.brand_actions
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_team_lead()
    and public.is_brand_member(brand_id)
    and (
      tag_id is null
      or exists (
        select 1 from public.tags t
        where t.id = brand_actions.tag_id
          and (t.brand_id is null or t.brand_id = brand_actions.brand_id)
      )
    )
  );

-- anon: no policies, and no table privileges.
revoke all on public.brands, public.profiles, public.brand_memberships,
  public.replies, public.reviews, public.tags, public.review_tags,
  public.brand_actions from anon;
