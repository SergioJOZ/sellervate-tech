# Proposal: Reply Review V1

## Intent

Team leads can judge a reply in seconds, but they review about five a day out of hundreds. They cover only some of the brands, and all they have is the inbox. So quality problems go unnoticed until a brand complains ("closing tickets without checking order history for a month"). Nothing records what "good" means for each brand, and the quarterly "we are improving" update has no number behind it.

V1 reads the notes as a **reviewing problem**. A team lead needs a fast, consistent way to score the unreviewed replies of the brands they lead. The review data then produces a per-brand trend, the failures that keep recurring, and a log of what the team changed. Specialists see their own feedback and nobody else's. This isolation is enforced on the server.

## Scope

### In Scope
- **Review queue + form (team lead)**: unreviewed replies from brands the user leads, newest `sent_at` first, with a brand filter. A review records a score from 1 to 5, multi-select failure tags and a note.
- **Brand trend view (team lead)**: the weekly score trend, the most frequent failure tags, and `brand_actions` shown as markers on the trend, plus a minimal form to record a new action.
- **Specialist self-view**: the specialist's own reviewed replies with their reviews (score, tags, note).
- **Corner user switcher**: switches between seeded users with `signInWithPassword`. There is no login UI.
- Schema, RLS, the Custom Access Token Hook, and seed data (3 brands, Marta leads 2, Nuria leads 1, specialists overlap brands).
- `DECISIONS.md` and `README.md` (clone to running in under 10 minutes, how to switch roles, real hours spent).

### Out of Scope
- **Coaching library**: a different reading of the brief, which the brief asks us to choose between.
- **AI scoring**: the brief warns against it. `DECISIONS.md` will cover where a model could earn its place.
- **Helpdesk ingestion**: the brief says "not now". It stays structurally possible through `replies.source` + `external_id`.
- **Real login UI**: auth may be stubbed, and building it teaches nothing here.
- **Admin role/UI**: memberships and tags come from seed data.
- **Review editing / re-review**: reviews are immutable, and each reply gets exactly one.
- **Notifications**: not in the brief and not needed for the loop.

## Capabilities

### New Capabilities
- `access-control`: roles per brand, the JWT membership claims (UI only), and RLS through `is_brand_member(brand_id, role)`.
- `identity-switcher`: switching between seeded users in the corner, with a real Supabase session.
- `reply-review`: the queue and the review form (score, tags, note), with one immutable review per reply.
- `brand-trend`: the per-brand trend, recurring failure tags, and `brand_actions` markers.
- `specialist-feedback`: a specialist's read-only view of their own replies and reviews.

### Modified Capabilities
- None

## Approach

This section applies decisions 1–11 from the exploration, unchanged.
- Tables: `brands`, `profiles`, `brand_memberships(user_id, brand_id, role)` (PK on the pair), `replies` (+`source`, `external_id`), `reviews` (`UNIQUE(reply_id)`, `score smallint CHECK 1..5`, no UPDATE policy), `tags` (`brand_id` NULL means global), `review_tags`, `brand_actions`.
- Authorization: the hook copies memberships into the JWT for navigation only. RLS always checks the table through a `security definer` helper, so a stale claim can cause a denial but never a leak.
- Next.js App Router reads and writes through a server-side Supabase client that uses the user's session, so RLS always applies.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `supabase/migrations/` | New | Schema, RLS, helper, access-token hook |
| `supabase/seed.sql` | New | Brands, users, memberships, tags, realistic replies, reviews, actions |
| `app/` | New | Queue, review form, brand trend, self-view, switcher |
| `lib/supabase/` | New | Server and browser clients |
| `DECISIONS.md`, `README.md` | New | Required deliverables |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| A mistake in an RLS policy leaks data across brands | Med | Verify with direct API queries under the specialist and team-lead sessions (see criteria below) |
| A seed large enough to make averages meaningful pushes its PR past 400 lines | High | Give the seed its own PR |
| Scaffold and lockfile lines inflate PR 1 | Med | Keep scaffold free of features. Only authored lines count against the budget (resolved question 5) |
| An immutable review makes a misclick permanent | Med | Confirmation step before saving (resolved question 1) |

## Delivery Slicing (proposal, needs approval)

1. Scaffold: Next.js, Tailwind/daisyUI theme, Supabase local config.
2. Schema + RLS + helper + access-token hook.
3. Seed data.
4. Identity switcher + server data layer.
5. Review loop: queue + form.
6. Brand trend + specialist self-view.
7. `DECISIONS.md` + `README.md`.

## Resolved Questions (user decisions)

1. **Confirm before saving a review**: yes. Saving shows an inline summary (score, tags, note) with "Back" and "Confirm", and states that the review cannot be edited.
2. **Trend bucketing**: weekly average with the review count (`n`) shown next to each week, so a thin week is not read as a real signal.
3. **`brand_actions` in the UI**: a minimal form on the brand page (date, note, optional tag), available only to that brand's team leads and enforced by an RLS INSERT policy.
4. **Specialist self-view**: reviewed replies only. It is a feedback feed, not an inbox.
5. **Review budget**: only authored lines count. Lockfiles and unmodified generator output are excluded, listed as generated in the PR description, and `package-lock.json` is marked `linguist-generated` in `.gitattributes`.

## Success Criteria

- [ ] The README takes a stranger from clone to running app (`supabase start`, seed, `npm run dev`) in under 10 minutes.
- [ ] As Marta, the queue shows only unreviewed replies from the 2 brands she leads, and the brand filter works.
- [ ] Saving a review removes the reply from the queue. A second review, or an UPDATE, for the same reply is rejected by the database.
- [ ] The brand page shows the weekly score trend with review counts, the top failure tags, and action markers.
- [ ] As Marta, recording an action on one of her brands adds a marker; a direct insert of an action for one of Nuria's brands is denied.
- [ ] As Dani, the self-view shows only his replies and reviews.
- [ ] As Dani, a direct PostgREST query for another brand's replies or reviews returns no rows, and inserting a review is denied.
- [ ] As Nuria, a direct query for one of Marta's brands returns no rows.
- [ ] As Dani, a direct query for the replies or reviews of another specialist in a brand he works in returns no rows (isolation within a brand, not only across brands).
- [ ] As Marta, a specialist who works in one of her brands and one of Nuria's shows only the replies and reviews from Marta's brand.
