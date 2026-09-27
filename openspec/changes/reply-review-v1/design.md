# Design: Reply Review V1

## Technical Approach

All authorization lives in Postgres. Every table has RLS enabled. Brand-scoped policies call two `security definer` helpers, `is_team_lead()` (reads `profiles.role`) and `is_brand_member(brand_id)` (reads `brand_memberships`). The Custom Access Token Hook copies the role and brand ids into the JWT, but only navigation and UI read those claims. A stale claim can cause a denial, never a leak.

Next.js (App Router, TypeScript) is organized hexagonally per feature. Route files in `app/` are containers and composition roots. Per request, they create a Supabase client from the user's session cookies, build the infra adapter with it, and call an application use case. PostgREST therefore runs every query as `authenticated` with the user's JWT, and RLS always applies. The service role key never appears in a request path. The only privileged actor is `supabase db reset` running `seed.sql` as `postgres`.

The corner switcher establishes a real Supabase session with `signInWithPassword` on the server. Because the browser holds a real user JWT, "ask the API directly" means calling PostgREST with that token, and RLS answers.

## Architecture Decisions

| Decision | Choice | Rejected alternative | Rationale |
|---|---|---|---|
| A1 Stack versions | `create-next-app@latest` (Next 16, `proxy.ts`), Tailwind v4, daisyUI v5 (CSS-first `@plugin`) | Next 15 + Tailwind v3 + daisyUI v4 | Current versions are what a team would start with today. Many online examples are 15-era, so verify every API against current docs during apply. |
| A2 Supabase client | `@supabase/ssr` (`createServerClient` / `createBrowserClient`; `proxy.ts` refreshes tokens) | Plain `supabase-js` with hand-written cookie handling | The official App Router path, with the least code. JS-readable session cookies are acceptable because RLS is the boundary. |
| A3 Folder architecture | Hexagonal per feature: `features/<feature>/{domain, application, ports, infra, ui}`. `app/` routes are containers and composition roots. | Feature-first "screaming-lite" with `data.ts`; flat `app/` + `lib/` | Pure rules and use cases are independent of Supabase and readable on their own. Ports make the RLS-bound adapter an explicit boundary. |
| A4 Data-access location | Superseded by A3: data access lives only in `infra/` adapters, each marked `import 'server-only'` | A central `lib/data/` module | `server-only` stops an adapter from being bundled for the browser. |
| A5 Reads vs writes | Reads in Server Components, writes in Server Actions. Both build the adapter per request and call the use case. No route handlers. | Route handlers (`app/api/*`) | Less boilerplate on the same RLS client. The "direct API" test targets PostgREST, which already is the API. |
| A6 Atomic review save | RPC `submit_review(p_reply_id, p_score, p_note, p_tag_ids uuid[])`, `security invoker`, inserting `reviews` + `review_tags` in one transaction. `23505` maps to `already_reviewed`, `42501` to `forbidden`. | Two inserts from the Server Action | Reviews are immutable. A failed second insert would leave a permanent review with no tags. Invoker keeps RLS in force. |
| A7 Immutability | No UPDATE/DELETE policy, plus `REVOKE UPDATE, DELETE ON reviews, review_tags FROM authenticated, anon` | Policy absence only | Without a policy, an UPDATE silently affects 0 rows. The spec says "denied", and the REVOKE makes it fail with `42501`. |
| A8b Server-owned review fields | A `BEFORE INSERT` trigger on `reviews` sets `created_at = now()` and `reviewer_id = auth.uid()`, overriding whatever the client sends. | Trust client values, checked only by RLS | A direct PostgREST insert could otherwise backdate a review. The A8 guard also depends on `created_at`, so it should not rest on a client-supplied value. |
| A8 Tags only at creation | `review_tags` INSERT requires the parent review's `reviewer_id = uid AND created_at = now()` AND a tag that is global or `tag.brand_id = reply.brand_id`. There is no `REVOKE INSERT` on `review_tags`. | Append tags later; `REVOKE INSERT` | `now()` is the transaction start, so the check holds only inside the creating transaction. A REVOKE would also block the invoker RPC. Comment the guard in the SQL. |
| A9 Switcher identity | Supabase session cookies only. `SEED_USERS` is a server constant, the password comes from server env `SEED_USER_PASSWORD`, and the action refuses to run unless `STUB_AUTH=true`. | Extra `current_user` cookie or localStorage | A single source of identity. The password never reaches the browser, and the bypass cannot reach a real deployment. |
| A10 Seeding auth users | `seed.sql` inserts `auth.users` + `auth.identities` with `crypt(pw, gen_salt('bf'))`, so `supabase db reset` does everything | Node script that calls the Admin API with the service role | One command keeps the README under 10 minutes. The SQL is fiddly (`instance_id`, `aud`, `email_confirmed_at`, empty-string token columns). |
| A11 Role type | `profiles.role text NOT NULL CHECK (role IN ('specialist','team_lead'))` | Postgres enum | A CHECK is easy to change later, while enum values cannot be dropped. |
| A12 Extra reply fields | `customer_message text NOT NULL`, `subject text`. No `status` column, because "reviewed" means a review exists. | A `status` column | Nobody can judge "answered a different question" without seeing the question. A status column would duplicate `reviews` and could drift. |
| A13 Read models | `security_invoker = true` views: `review_queue`, `brand_weekly_scores`, `brand_tag_counts`, `brand_specialist_stats` | Aggregating in TypeScript | Readable SQL, RLS still applies, and no row dumps over the wire. |
| A14 Trend bucket | `replies.sent_at`, ISO week, UTC: `date_trunc('week', sent_at AT TIME ZONE 'UTC')` | `reviews.created_at` | Reply quality belongs to the week the reply was sent. Review date would measure how busy the reviewers were. |
| A15 Chart | Hand-rolled server-rendered SVG: a line with points, `n` under each week, vertical markers for `brand_actions` | Recharts (client component) | About 12 points need no dependency or client JS, and the chart uses theme tokens. |
| A16 JWT claims | `user_role` (text) and `brand_ids` (uuid array) | A membership list or role map | Matches the global role. Used for navigation only. |
| A17 Profile visibility | `id = uid OR (is_team_lead() AND shares_brand_with(id)) OR EXISTS (review on one of my replies with reviewer_id = id)` | Any shared brand for everyone | Minimal: a lead sees her brands' people, and a specialist sees only himself plus whoever reviewed him. |
| A18 Specialist reply RLS | `specialist_id = uid`. "Reviewed only" is applied in the feedback query. | Reviewed-only inside RLS | Seeing your own unreviewed reply is not a leak, and the simpler policy is cheaper per row. |
| A19 `brand_actions` | SELECT: team leads of that brand only. INSERT: `author_id = uid AND is_team_lead() AND is_brand_member(brand_id) AND tag in scope`. | Specialists can read it too | The brief frames actions as the lead's answer to the brand. Easy to widen later. |
| A20 `brand_id` on reviews | Not denormalized. Policies and views join through `replies`. | `reviews.brand_id` + composite FK | Simpler for V1. It is the first step once aggregates get slow. |
| A21 Review UX | Split pane on a nested route: `app/queue/layout.tsx` renders the list, `app/queue/[replyId]/page.tsx` renders the selected reply and its form (inline confirm, "Save & next"), and `app/queue/page.tsx` is the empty-selection state. The selection lives in the URL. | Separate `/queue` and `/review/[id]` pages | The lead keeps the queue in view. The URL-held selection stays shareable and survives reloads without client state. |
| A22 Theme | Dark slate in the sellervate.com family (see "Theme") | Light theme | Matches the product family, and a designed serif reading surface keeps long replies readable. |

## Data Model

All ids are `uuid DEFAULT gen_random_uuid()` and all timestamps are `timestamptz NOT NULL DEFAULT now()`.

| Table | Columns | Keys / constraints | Indexes |
|---|---|---|---|
| `brands` | `id`, `name`, `slug`, `voice_notes` | UNIQUE `slug` | — |
| `profiles` | `id`, `display_name text NOT NULL`, `role text NOT NULL` | FK `id` → `auth.users` ON DELETE CASCADE; CHECK role (A11) | — |
| `brand_memberships` | `user_id`, `brand_id` | PK `(user_id, brand_id)`; FKs → profiles, brands | PK serves the helper; `(brand_id)` |
| `replies` | `id`, `brand_id`, `specialist_id`, `subject`, `customer_message`, `body text NOT NULL`, `sent_at`, `source text NOT NULL DEFAULT 'seed'`, `external_id`, `created_at` | UNIQUE `(source, external_id)` | `(brand_id, sent_at DESC)`, `(specialist_id, sent_at DESC)` |
| `reviews` | `id`, `reply_id`, `reviewer_id DEFAULT auth.uid()`, `score smallint NOT NULL`, `note`, `created_at` | UNIQUE `reply_id`; CHECK `score BETWEEN 1 AND 5`; FK reply ON DELETE RESTRICT | `(reviewer_id)` |
| `tags` | `id`, `brand_id NULL`, `slug`, `label`, `description` | UNIQUE NULLS NOT DISTINCT `(brand_id, slug)`; NULL = global | covered |
| `review_tags` | `review_id`, `tag_id` | PK pair; FKs | `(tag_id)` |
| `brand_actions` | `id`, `brand_id`, `author_id DEFAULT auth.uid()`, `taken_at date NOT NULL`, `note text NOT NULL CHECK (length(trim(note)) > 0)`, `tag_id NULL`, `created_at` | FKs | `(brand_id, taken_at)` |

Views (A13, all `security_invoker = true`):
- `review_queue`: replies with no review, filtered explicitly by `is_team_lead() AND is_brand_member(brand_id)`, ordered by `sent_at DESC`.
- `brand_weekly_scores`: `brand_id`, `week`, `avg_score`, `n`.
- `brand_tag_counts`: per brand and tag, the count for the last 4 weeks and the previous 4 weeks. The app orders by the last-4-weeks count descending, then by label.
- `brand_specialist_stats`: last 4 weeks, per `(brand_id, specialist_id)`: `avg_score`, `n`, `top_tag`. Only that brand's reviews count.

## RLS Policies

`uid` = `(select auth.uid())`, evaluated once per query. `anon` gets no policies and its privileges are revoked.

| Table | SELECT | INSERT | UPDATE / DELETE |
|---|---|---|---|
| `brands` | `is_brand_member(id)` | none | none |
| `profiles` | A17 | none | none |
| `brand_memberships` | `user_id = uid OR (is_team_lead() AND is_brand_member(brand_id))` | none | none |
| `replies` | `(is_team_lead() AND is_brand_member(brand_id)) OR specialist_id = uid` | none | none |
| `reviews` | `EXISTS (reply r WHERE r.id = reply_id AND ((is_team_lead() AND is_brand_member(r.brand_id)) OR r.specialist_id = uid))` | `reviewer_id = uid AND is_team_lead() AND EXISTS (reply r WHERE r.id = reply_id AND is_brand_member(r.brand_id))` | none + REVOKE (A7) |
| `review_tags` | `EXISTS (visible parent review)` | A8 | none + REVOKE |
| `tags` | `brand_id IS NULL OR is_brand_member(brand_id)` | none | none |
| `brand_actions` | `is_team_lead() AND is_brand_member(brand_id)` | A19 | none |

The hook role gets `FOR SELECT TO supabase_auth_admin USING (true)` on `profiles` and `brand_memberships`.

**Isolation within a brand.** Dani and another specialist both work in Brand X. `is_team_lead()` is false for both, so only `specialist_id = uid` can match. Reviews and tags are reached through a visible reply, so they inherit that isolation.

**Specialist shared between two leads.** A specialist works in Marta's Brand A and Nuria's Brand C. The lead branch checks `is_brand_member` on the brand of each row, so Marta sees only that specialist's Brand A rows and Nuria only Brand C.

**Recursion.** The helpers are `security definer`, owned by `postgres`, with `set search_path = ''`. They bypass RLS, so policies on `profiles` and `brand_memberships` that call them never recurse.

## Interfaces / Contracts

```sql
create function public.is_brand_member(p_brand_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.brand_memberships m
                 where m.user_id = (select auth.uid()) and m.brand_id = p_brand_id);
$$;
create function public.is_team_lead() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.role = 'team_lead');
$$;
-- shares_brand_with(p_user uuid): same shape, a self-join on brand_memberships.
-- revoke execute ... from public, anon; grant execute ... to authenticated.

-- Hook: custom_access_token_hook(event jsonb) returns jsonb, plpgsql stable.
-- Sets claims.user_role (profiles.role) and claims.brand_ids (jsonb array of uuids).
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on public.profiles, public.brand_memberships to supabase_auth_admin;
```

`supabase/config.toml`: `[auth.hook.custom_access_token] enabled = true`, `uri = "pg-functions://postgres/public/custom_access_token_hook"`.

Server Actions return `{ ok: true, nextReplyId? } | { ok: false, reason: 'already_reviewed' | 'forbidden' | 'invalid' }`.

**Per-request adapter rule (critical).** Every adapter is constructed inside the request (Server Component or Server Action) from `await createClient()` in `lib/supabase/server.ts`, which reads the user's cookies. Never use a module-level singleton client, and never the service role. Otherwise RLS evaluates the wrong identity or none at all.

```ts
// app/queue/[replyId]/actions.ts (composition root)
const repo = new SupabaseReviewRepository(await createClient());
return submitReview(repo, input); // application use case, depends on the ReviewRepository port
```

## Data Flow — Sequence Diagrams

### 1. Switch user → token with claims → RLS-enforced query

```mermaid
sequenceDiagram
  actor U as Browser
  participant SA as Server Action switchUser
  participant GT as Supabase Auth (GoTrue)
  participant H as custom_access_token_hook
  participant RSC as Server Component /queue
  participant PR as PostgREST
  participant DB as Postgres (RLS)
  U->>SA: switchUser("marta")
  SA->>SA: STUB_AUTH on? key in SEED_USERS?
  SA->>GT: signInWithPassword(email, SEED_USER_PASSWORD)
  GT->>H: event {user_id, claims}
  H->>DB: select role from profiles; select brand_id from brand_memberships
  H-->>GT: claims + user_role + brand_ids
  GT-->>SA: session (access + refresh JWT)
  SA-->>U: Set-Cookie sb-* (via @supabase/ssr), redirect "/"
  U->>RSC: GET / -> redirect by user_role (/queue or /feedback)
  RSC->>RSC: getClaims() -> user_role, brand_ids for nav only
  RSC->>PR: select review_queue (Bearer user JWT)
  PR->>DB: SET ROLE authenticated; request.jwt.claims
  DB->>DB: is_team_lead() AND is_brand_member(brand_id) read TABLES, not claims
  DB-->>RSC: only rows for Marta's member brands
  RSC-->>U: rendered queue
```

### 2. Saving a review with the confirm step

```mermaid
sequenceDiagram
  actor L as Team lead
  participant F as ReviewForm (client)
  participant SA as Server Action submitReview
  participant DB as Postgres submit_review (invoker)
  L->>F: pick score, tags, note, "Save"
  F->>F: validate locally, step = "confirm"
  F-->>L: summary + "This review cannot be edited" [Back] [Confirm]
  alt Back
    L->>F: Back -> step = "edit" (state kept)
  else Confirm
    L->>F: Confirm (button disabled while pending)
    F->>SA: submitReview(replyId, score, tagIds, note)
    SA->>SA: build adapter per request; use case validates (domain rules)
    SA->>DB: rpc submit_review(...) with user session
    DB->>DB: INSERT reviews (RLS: reviewer=uid, team lead, member of brand)
    DB->>DB: INSERT review_tags (RLS: same txn, tag in scope)
    alt success
      DB-->>SA: review id
      SA->>SA: revalidatePath('/queue', 'layout'); pick next queued reply
      SA-->>F: ok -> navigate to /queue/[nextId] (or /queue if empty)
    else 23505 / 42501
      DB-->>SA: error, whole txn rolled back
      SA-->>F: already_reviewed / forbidden message
    end
  end
```

## Application Structure

```
app/
  layout.tsx                  # theme, fonts, <UserSwitcher/>, nav from claims
  page.tsx                    # redirect: team_lead -> /queue, specialist -> /feedback
  actions/switch-user.ts
  queue/layout.tsx            # split pane: queue list (brand filter) + child slot
  queue/page.tsx              # empty-selection state
  queue/[replyId]/{page.tsx, actions.ts}   # reply, customer message, ReviewForm
  brands/[brandId]/{page.tsx, actions.ts}  # trend, tags 4w vs prev 4w, specialists, actions
  feedback/page.tsx           # specialist self-view (reviewed only)
  **/loading.tsx, **/error.tsx
features/
  reviews/     domain/{score.ts, tag-scope.ts}  application/{list-queue, get-reply, submit-review}.ts
               ports/review-repository.ts  infra/supabase-review-repository.ts
               ui/{QueueList, ReplyView, ReviewForm, ConfirmSummary}.tsx
  brand-trend/ domain/ application/ ports/ infra/ ui/{TrendChart, TagComparison, SpecialistTable, ActionForm}
  feedback/    application/ ports/ infra/ ui/FeedbackFeed.tsx
  identity/    domain/seed-users.ts  application/switch-user.ts  ports/ infra/ ui/UserSwitcher.tsx
shared/ui/                    # EmptyState, ErrorState, ScoreBadge, TagChip
lib/supabase/{server.ts, client.ts}
proxy.ts                      # session refresh
supabase/{config.toml, migrations/*.sql, seed.sql}
DECISIONS.md, README.md, .gitattributes   # package-lock.json linguist-generated
```

`domain/` holds entities and pure rules: the score must be an integer from 1 to 5 with its label, and `tag-scope.ts` documents the rule RLS enforces (a tag is global or from the reply's brand). The domain never replaces RLS.

## Theme (A22)

A custom daisyUI theme (`@plugin "daisyui/theme"`), dark by default, in the family of sellervate.com. It uses that site as a reference, not a copy.
- **Surfaces**: base-100 `#1d232a`, base-200 `#252c35`, base-300 `#2e3742`, reading surface `#2a323c`, text `#e6e9ee`. Primary is steel blue `#6b9ac4`.
- **Fonts** via `next/font`: Outfit (UI, 400/500/600) and Source Serif 4 for reply and customer text at 17px with line-height 1.6. Scores and `n` use tabular numerals.
- **Type scale**: major third (1.25), base 16: 12 / 14 / 16 / 17 (replies) / 20 / 25 / 31.
- **Score ramp** as Tailwind theme tokens (`--color-score-1..5`, used as `text-score-N` / `bg-score-N`): `#e5484d` Harmful, `#f28c3b` Poor, `#d6b34a` Acceptable, `#3fb8a9` Good, `#46c46e` Exemplary. The reading surface is `--color-reading-surface` (`bg-reading-surface`), and reply text uses `text-reply` (17px, line-height 1.6). A score always shows as number plus label, never colour alone.
- **System colours** never reuse a score colour, so "Harmful" is never mistaken for a failed request: error `#ff6f70`, success `#00ca92` and warning `#ffc22d` (taken from sellervate.com's palette), accent `#9bbbd9` (a lighter steel blue), info = primary.
- **Designed states**: every route has `loading.tsx` (skeleton), `error.tsx` and a purpose-written `EmptyState`, for example "Queue clear — nothing unreviewed in your brands."

## File Changes

| File | Action | Description |
|---|---|---|
| `supabase/migrations/*_schema.sql` | Create | Tables, constraints, indexes |
| `supabase/migrations/*_rls.sql` | Create | Helpers, policies, REVOKEs, views, `submit_review` |
| `supabase/migrations/*_auth_hook.sql` | Create | Hook + grants + `supabase_auth_admin` policies |
| `supabase/config.toml`, `supabase/seed.sql` | Create | Hook registration; auth users, profiles, brands, memberships, tags, replies, reviews, actions |
| `lib/supabase/*`, `proxy.ts` | Create | SSR clients, session refresh |
| `app/**`, `features/**`, `shared/ui/**` | Create | Structure above |
| `app/globals.css` | Create | Tailwind + daisyUI theme tokens |
| `DECISIONS.md`, `README.md`, `.gitattributes` | Create | Deliverables; lockfile `linguist-generated` |

## Testing Strategy

The project config sets `testing.test_runner: none`.

| Layer | What | Approach |
|---|---|---|
| Static | Types, lint | `tsc --noEmit`, ESLint, Prettier |
| RLS | Every success criterion in the proposal | Manual `curl` against PostgREST with each seeded user's access token, including an UPDATE (expect `42501`) and a late `review_tags` insert (expect a denial). Results go in the PR description. |
| UI | The three journeys | Manual walkthrough with each switcher identity |

## Threat Matrix

N/A. There is no routing, shell, subprocess, VCS/PR automation, executable-file classification or process-integration boundary. Tenant isolation is covered by the RLS section.

## Migration / Rollout

Greenfield. `supabase db reset` applies the migrations and the seed. Seed `sent_at` values are relative to `now()`, so the 4-week windows always have data. PR slicing follows the proposal.

## What Breaks First as This Grows

1. **Queue semantics.** Once helpdesk ingestion arrives there will be hundreds of replies a day, and "all unreviewed, newest first" becomes an endless list. The team will need a sampling policy, not just an index.
2. **On-the-fly aggregates.** The trend, tag and specialist views scan every review for a brand. The fix is a weekly rollup or materialized view, plus `brand_id` denormalized onto reviews (A20).
3. **Claim staleness and size.** When memberships change, the nav lags until the token refreshes (RLS stays correct), and many brands inflate every token.
4. **Reviewer calibration.** One immutable review per reply means Marta's 3 and Nuria's 3 may not mean the same thing, and the trend compares them anyway.
5. **Global role.** Once a person needs to lead one brand and write replies in another, the role moves to `brand_memberships`. That migration is additive: add the column and backfill it from `profiles.role`.
6. **Stub auth.** The switcher is an auth bypass. Real auth swaps it for SSO, and the hook and RLS stay the same.

## Open Questions

None. All decisions are fixed.
