-- Read model (A13): average score and reviewed-reply count for the last
-- 4 weeks and the 4 weeks before, per brand. Same rolling windows on the
-- reply's sent_at as brand_tag_counts and brand_specialist_stats, so the
-- summary tiles agree with the rest of the brand page. security_invoker, so
-- RLS on replies and reviews still applies to whoever queries the view.
-- Averages are null when a window has no reviewed replies.

create view public.brand_score_windows with (security_invoker = true) as
select
  r.brand_id,
  avg(rv.score) filter (
    where r.sent_at >= now() - interval '4 weeks'
  )::numeric as last_4_weeks_avg_score,
  count(*) filter (
    where r.sent_at >= now() - interval '4 weeks'
  )::bigint as last_4_weeks_n,
  avg(rv.score) filter (
    where r.sent_at < now() - interval '4 weeks'
  )::numeric as previous_4_weeks_avg_score,
  count(*) filter (
    where r.sent_at < now() - interval '4 weeks'
  )::bigint as previous_4_weeks_n
from public.reviews rv
join public.replies r on r.id = rv.reply_id
where r.sent_at >= now() - interval '8 weeks'
group by r.brand_id;

revoke all on public.brand_score_windows from anon;
