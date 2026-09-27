-- A7: reviews and review_tags are immutable once inserted.
revoke update, delete on public.reviews, public.review_tags from authenticated, anon;

-- A8b: the client can never set reviewer_id or created_at on a review.
create function public.reviews_force_server_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.created_at := now();
  new.reviewer_id := auth.uid();
  return new;
end;
$$;

create trigger reviews_force_server_fields_trg
  before insert on public.reviews
  for each row execute function public.reviews_force_server_fields();

-- A6: submit_review saves a review and its tags in one transaction.
create function public.submit_review(
  p_reply_id uuid,
  p_score smallint,
  p_note text,
  p_tag_ids uuid[]
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_review_id uuid;
begin
  insert into public.reviews (reply_id, score, note)
  values (p_reply_id, p_score, p_note)
  returning id into v_review_id;

  if p_tag_ids is not null then
    insert into public.review_tags (review_id, tag_id)
    select v_review_id, t
    from unnest(p_tag_ids) as t;
  end if;

  return v_review_id;
end;
$$;

revoke execute on function public.submit_review(uuid, smallint, text, uuid[]) from public, anon;
grant execute on function public.submit_review(uuid, smallint, text, uuid[]) to authenticated;
