-- Custom Access Token Hook: copies role + brand_ids into JWT claims (A16).
-- Claims are navigation-only; RLS re-checks profiles/brand_memberships on
-- every request regardless of what the token says.

create function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  claims jsonb;
  v_user_id uuid;
  v_user_role text;
  v_brand_ids jsonb;
begin
  v_user_id := (event ->> 'user_id')::uuid;

  select p.role into v_user_role
  from public.profiles p
  where p.id = v_user_id;

  select coalesce(jsonb_agg(m.brand_id), '[]'::jsonb) into v_brand_ids
  from public.brand_memberships m
  where m.user_id = v_user_id;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(v_user_role));
  claims := jsonb_set(claims, '{brand_ids}', v_brand_ids);

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on public.profiles, public.brand_memberships to supabase_auth_admin;

create policy profiles_select_auth_admin on public.profiles
  for select to supabase_auth_admin
  using (true);

create policy brand_memberships_select_auth_admin on public.brand_memberships
  for select to supabase_auth_admin
  using (true);
