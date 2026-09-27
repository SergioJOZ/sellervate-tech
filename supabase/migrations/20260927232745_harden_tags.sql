-- Tags are immutable from the app, like reviews (A7). With no UPDATE/DELETE
-- policy an edit silently affects 0 rows; the REVOKE makes it fail with 42501.
revoke update, delete on public.tags from authenticated, anon;

-- A brand tag may not reuse a global tag's slug. UNIQUE NULLS NOT DISTINCT
-- (brand_id, slug) only catches duplicates within one scope, so without this
-- the review form would show two identical chips (the global one and the
-- brand copy). Raised as unique_violation (23505) so callers treat it like
-- any other duplicate tag.
--
-- security definer + empty search_path: the check must see every global tag
-- regardless of the caller's RLS visibility, and fully qualified names keep
-- it from resolving objects through a caller-controlled search_path.
-- Global tags are seed-managed (tags_insert rejects brand_id IS NULL), so no
-- concurrent global insert can race this check from the app.
create function public.tags_reject_global_slug_shadow() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.brand_id is not null and exists (
    select 1 from public.tags t
    where t.brand_id is null and t.slug = new.slug
  ) then
    raise exception 'A global tag with slug "%" already exists', new.slug
      using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

create trigger tags_reject_global_slug_shadow_trg
  before insert on public.tags
  for each row execute function public.tags_reject_global_slug_shadow();
