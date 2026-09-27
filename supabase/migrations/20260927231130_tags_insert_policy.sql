-- Team leads may create tags for a brand they belong to, from the review form.
-- Global tags (brand_id IS NULL) stay seed-managed: the check rejects them.
-- There is deliberately no UPDATE or DELETE policy, so tags stay immutable
-- from the app. Duplicate slugs per brand fail on the existing
-- UNIQUE NULLS NOT DISTINCT (brand_id, slug) constraint with 23505.
create policy tags_insert on public.tags
  for insert to authenticated
  with check (
    brand_id is not null
    and public.is_team_lead()
    and public.is_brand_member(brand_id)
  );
