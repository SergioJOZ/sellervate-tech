-- Read models (A13). All security_invoker: RLS on the underlying tables
-- still applies to whoever queries the view.

create view public.review_queue with (security_invoker = true) as
select r.*
from public.replies r
where public.is_team_lead()
  and public.is_brand_member(r.brand_id)
  and not exists (select 1 from public.reviews rv where rv.reply_id = r.id)
order by r.sent_at desc;

create view public.brand_weekly_scores with (security_invoker = true) as
select
  r.brand_id,
  date_trunc('week', r.sent_at at time zone 'UTC') as week,
  avg(rv.score)::numeric as avg_score,
  count(*)::bigint as n
from public.reviews rv
join public.replies r on r.id = rv.reply_id
group by r.brand_id, date_trunc('week', r.sent_at at time zone 'UTC');

create view public.brand_tag_counts with (security_invoker = true) as
select
  r.brand_id,
  t.id as tag_id,
  t.label,
  count(*) filter (
    where r.sent_at >= now() - interval '4 weeks'
  )::bigint as last_4_weeks,
  count(*) filter (
    where r.sent_at >= now() - interval '8 weeks'
      and r.sent_at < now() - interval '4 weeks'
  )::bigint as previous_4_weeks
from public.review_tags rt
join public.reviews rv on rv.id = rt.review_id
join public.replies r on r.id = rv.reply_id
join public.tags t on t.id = rt.tag_id
where r.sent_at >= now() - interval '8 weeks'
group by r.brand_id, t.id, t.label;

create view public.brand_specialist_stats with (security_invoker = true) as
select
  r.brand_id,
  r.specialist_id,
  avg(rv.score)::numeric as avg_score,
  count(*)::bigint as n,
  (
    select rt.tag_id
    from public.review_tags rt
    join public.reviews rv2 on rv2.id = rt.review_id
    join public.replies r2 on r2.id = rv2.reply_id
    where r2.brand_id = r.brand_id
      and r2.specialist_id = r.specialist_id
      and r2.sent_at >= now() - interval '4 weeks'
    group by rt.tag_id
    order by count(*) desc, rt.tag_id
    limit 1
  ) as top_tag
from public.reviews rv
join public.replies r on r.id = rv.reply_id
where r.sent_at >= now() - interval '4 weeks'
group by r.brand_id, r.specialist_id;
