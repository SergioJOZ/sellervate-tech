-- Read model (A13): what happened around each brand action.
--
-- One row per brand_actions row the caller can see. security_invoker, so
-- RLS on brand_actions (A19: team leads of that brand), replies, reviews
-- and review_tags still applies to whoever queries the view.
--
-- Windows are 4 weeks on each side of the action, bucketed by the reply's
-- sent_at like every other trend view (A14). taken_at is a date and is read
-- as midnight UTC:
--   before = [taken_at - 4 weeks, taken_at)
--   after  = [taken_at, taken_at + 4 weeks)
-- Averages are null when a window has no reviewed replies. Tag counts are
-- null when the action targets no tag. weeks_after is the number of whole
-- weeks of data available after the action, capped at 4.

create view public.brand_action_impact with (security_invoker = true) as
select
  a.id as action_id,
  a.brand_id,
  a.taken_at,
  before_window.avg_score as before_avg_score,
  before_window.n as before_n,
  before_window.tag_count as before_tag_count,
  after_window.avg_score as after_avg_score,
  after_window.n as after_n,
  after_window.tag_count as after_tag_count,
  least(
    4,
    greatest(
      0,
      floor(extract(epoch from (now() - bounds.starts_at)) / 604800)
    )
  )::int as weeks_after
from public.brand_actions a
cross join lateral (
  select (a.taken_at::timestamp at time zone 'UTC') as starts_at
) as bounds
cross join lateral (
  select
    avg(rv.score)::numeric as avg_score,
    count(*)::bigint as n,
    case
      when a.tag_id is null then null
      else count(*) filter (
        where exists (
          select 1 from public.review_tags rt
          where rt.review_id = rv.id and rt.tag_id = a.tag_id
        )
      )
    end::bigint as tag_count
  from public.reviews rv
  join public.replies r on r.id = rv.reply_id
  where r.brand_id = a.brand_id
    and r.sent_at >= bounds.starts_at - interval '4 weeks'
    and r.sent_at < bounds.starts_at
) as before_window
cross join lateral (
  select
    avg(rv.score)::numeric as avg_score,
    count(*)::bigint as n,
    case
      when a.tag_id is null then null
      else count(*) filter (
        where exists (
          select 1 from public.review_tags rt
          where rt.review_id = rv.id and rt.tag_id = a.tag_id
        )
      )
    end::bigint as tag_count
  from public.reviews rv
  join public.replies r on r.id = rv.reply_id
  where r.brand_id = a.brand_id
    and r.sent_at >= bounds.starts_at
    and r.sent_at < bounds.starts_at + interval '4 weeks'
) as after_window;

revoke all on public.brand_action_impact from anon;
