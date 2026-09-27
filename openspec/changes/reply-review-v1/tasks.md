# Tasks: Reply Review V1

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2100-2600 authored lines total across 7 PRs |
| 400-line budget risk | High (PR 2 schema/RLS, PR 3 seed, PR 5 review loop) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 -> PR 2 -> PR 3 -> PR 4 -> PR 5 -> PR 6 -> PR 7 |
| Delivery strategy | ask-on-risk |
| Chain strategy | One branch per PR, cut from `main` after the previous PR merges; review fixes go as follow-up commits on the same branch; merge commits only (no squash, no rebase) — mandated by the brief, p. 5 |

Decision needed before apply: D1 only (before PR 3)
Chained PRs recommended: Yes
Chain strategy: sequential branches off main (brief, p. 5)
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | App scaffold, theme tokens, tooling, no features | PR 1 | `tsc --noEmit && npx eslint .` | `npm run dev` loads default page | Delete `app/`, config files; no DB state |
| 2 | Schema + RLS + helpers + hook + views + `submit_review` | PR 2 | `supabase db reset` (migrations apply clean) | `supabase start` + curl PostgREST smoke checks | Drop migrations dir; `supabase db reset` |
| 3 | Seed data | PR 3 | `supabase db reset` (seed runs clean) | Query row counts via `psql`/PostgREST | Revert `seed.sql`; re-run `db reset` |
| 4 | Identity switcher + SSR clients + landing/nav | PR 4 | `tsc --noEmit` | Manual: switch users in browser, confirm redirect | Remove `features/identity`, `proxy.ts`, revert `layout.tsx` |
| 5 | Review loop (queue + form + confirm) | PR 5 | `tsc --noEmit` | Manual: review a reply end-to-end as Marta | Remove `features/reviews`, `app/queue` |
| 6 | Brand trend + specialist feedback | PR 6 | `tsc --noEmit` | Manual: open brand page and feedback feed | Remove `features/brand-trend`, `features/feedback`, `app/brands`, `app/feedback` |
| 7 | README + DECISIONS.md | PR 7 | N/A (docs only) | Follow README from clean clone, time it | Revert the two doc files |

If PR 2, 3, or 5 forecast confirms High, each further splits: PR 2 into schema-only + RLS/hook/views; PR 3 into two seed migrations (users/brands/memberships/tags, then replies/reviews/actions); PR 5 into queue-list-only then form+confirm. Whether to split is decided by the user if it happens (D3).

---

## Decision needed before apply

- **D1**: Confirm seed persona and brand names. Exploration/design only fix Marta, Nuria, Dani plus "a DTC skincare brand whose key procedure is never giving medical advice on skin reactions", a "technical scooter brand", and a "fast/exact packaging brand." All other specialist names, brand names/slugs, and voice notes are NOT decided. Task 3.1 below blocks on this.
- **D2** (resolved): the brief prescribes the workflow — a branch per piece of work off `main`, written review on the PR, follow-up commits on the same branch, merge without squash or rebase. Stacked branches are ruled out because they would force rebasing.
- **D3**: If PR 2, PR 3, or PR 5 come in over budget during apply, confirm the specific sub-split (see forecast note above) before continuing.

---

## PR 1: Scaffold

Spec refs: none (infra only, no capability requirements). Design refs: A1, A2, A3, A22.

- [x] 1.1 Run `create-next-app` (Next 16, TypeScript, Tailwind v4, ESLint, App Router, `src/` off).
- [x] 1.2 Add daisyUI v5 via CSS-first `@plugin "daisyui"` and a custom `@plugin "daisyui/theme"` block in `app/globals.css` with A22 tokens (surfaces, primary, score ramp, fonts).
- [x] 1.3 Wire `next/font` for Outfit and Source Serif 4 in `app/layout.tsx`.
- [x] 1.4 Add Prettier config and script; confirm ESLint + Prettier do not conflict.
- [x] 1.5 Run `supabase init`; commit `supabase/config.toml` with default local ports.
- [x] 1.6 Add `.gitattributes` marking `package-lock.json` as `linguist-generated`.
- [x] 1.7 Add `.env.example` documenting `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STUB_AUTH`, `SEED_USER_PASSWORD`. Created by hand: the executor was not allowed to write `.env*` files.
- [x] 1.8 Verify: `npm run dev` serves the scaffold page with the dark theme applied (`data-theme="reply-review"`, `Reply Review` copy, `text-primary` visible); `npm run typecheck`, `npx eslint .`, `npm run format:check`, and `npm run build` all pass; no `app/queue`, `app/brands`, or feature code exists yet.

## PR 2: Schema + RLS + helpers + hook + views + submit_review

Spec refs: access-control (all requirements), reply-review (score/tag DB constraints). Design refs: A6, A7, A8, A8b, A9-A14 (schema shape), A16-A20, RLS table, Interfaces/Contracts.

- [x] 2.1 Migration `*_schema.sql`: create `brands`, `profiles`, `brand_memberships`, `replies`, `reviews`, `tags`, `review_tags`, `brand_actions` with constraints/indexes from the Data Model table.
- [x] 2.2 Migration `*_rls.sql`: enable RLS on every table; create `is_brand_member(uuid)`, `is_team_lead()`, `shares_brand_with(uuid)` as `security definer`/`stable`/`set search_path=''`; revoke/grant execute per Interfaces/Contracts.
- [x] 2.3 Add policies from the RLS table for `brands`, `profiles` (A17), `brand_memberships`, `replies`, `reviews`, `review_tags` (A8), `tags`, `brand_actions` (A19).
- [x] 2.4 Add `REVOKE UPDATE, DELETE ON reviews, review_tags FROM authenticated, anon` (A7).
- [x] 2.5 Add `BEFORE INSERT` trigger on `reviews` setting `created_at = now()`, `reviewer_id = auth.uid()` (A8b).
- [x] 2.6 Create views `review_queue`, `brand_weekly_scores`, `brand_tag_counts`, `brand_specialist_stats` with `security_invoker = true` (A13, A14).
- [x] 2.7 Create `submit_review(p_reply_id, p_score, p_note, p_tag_ids uuid[])` RPC, `security invoker` (A6). Note: `23505`/`42501` mapping to `already_reviewed`/`forbidden` is deferred to the app layer (Server Action) per the orchestrator brief for this unit; the RPC itself lets SQL errors propagate.
- [x] 2.8 Migration `*_auth_hook.sql`: `custom_access_token_hook`, grants to `supabase_auth_admin`, `profiles`/`brand_memberships` SELECT policy for that role.
- [x] 2.9 Register the hook in `supabase/config.toml` (`[auth.hook.custom_access_token] enabled = true`, `uri = "pg-functions://postgres/public/custom_access_token_hook"`).
- [x] 2.10 Verify: `supabase db reset` applies all migrations cleanly with no seed data yet (empty DB); manually inserted throwaway users/brands/memberships/replies via SQL and confirmed helpers, isolation, immutability, uniqueness, the A8b trigger, the A8 tag-scope guard, and the auth hook all behave per spec/design. See apply report for the full transcript.

## PR 3: Seed data

Spec refs: reply-review scenarios (queue/tags), access-control isolation scenarios, brand-trend scenarios — seed must produce data hitting each. Design refs: A9, A10, decision 9 (exploration).

- [x] 3.0 Decision needed: confirm specialist names beyond Marta/Nuria/Dani, and the three brand names/slugs (scooter brand, packaging brand, DTC skincare brand) with the user before writing seed content (D1). Resolved by the user: Voltra (`voltra`, electric scooters), Boxwise (`boxwise`, packaging supplier), Lumé Skin (`lume-skin`, DTC skincare); specialists Dani, Leo, Sofía with Leo shared between Marta (Boxwise) and Nuria (Lumé Skin).
- [x] 3.1 `seed.sql`: insert `auth.users` + `auth.identities` for all seeded users via `crypt(pw, gen_salt('bf'))` (A10).
- [x] 3.2 Insert `profiles` (role per user) and `brands` (3 brands, confirmed names/slugs/voice_notes).
- [x] 3.3 Insert `brand_memberships`: Marta leads 2 brands, Nuria leads 1, specialists overlap brands so isolation scenarios are exercisable (specialist in a Marta brand + a Nuria brand).
- [x] 3.4 Insert `tags`: global tags plus at least one per-brand tag, matching the failure modes named in the brief (slow, wrong tone, answered different question, would not stop customer writing again, no order history check).
- [x] 3.5 Insert `replies` with `customer_message`, `subject`, `body`, `sent_at` spread across ~8 weeks relative to `now()` so weekly-trend and 4-week-vs-previous-4-week windows both have data.
- [x] 3.6 Insert `reviews` + `review_tags` for most (not all) replies, leaving some unreviewed per brand for queue scenarios; vary scores and tag counts per week to make a visible trend and a tag drop after an action.
- [x] 3.7 Insert `brand_actions` for at least one brand at a date between two review clusters.
- [x] 3.8 Verify: `supabase db reset` runs seed without error; row counts per table match expectations; querying `review_queue` as each seeded team lead (via PostgREST + that user's access token) returns only their brands' unreviewed replies.

## PR 4: Identity switcher + SSR clients + landing/nav

Spec refs: identity-switcher (all requirements). Design refs: A2, A9, sequence diagram 1, Application Structure.

- [x] 4.1 Create `lib/supabase/server.ts` (`createServerClient` from cookies) and `lib/supabase/client.ts` (`createBrowserClient`).
- [x] 4.2 Create `proxy.ts` for session refresh per `@supabase/ssr` App Router pattern.
- [x] 4.3 Create `features/identity/domain/seed-users.ts` (`SEED_USERS` constant, no password) and `application/switch-user.ts`. `seed-users.ts` is `server-only`; the client switcher receives `SwitcherOption`s (no emails) from the layout.
- [x] 4.4 Create Server Action `app/actions/switch-user.ts`: refuses to run unless `STUB_AUTH=true`, calls `signInWithPassword` with `SEED_USER_PASSWORD` from server env, sets session cookies.
- [x] 4.5 Create `features/identity/ui/UserSwitcher.tsx`, mounted in `app/layout.tsx` corner.
- [x] 4.6 Update `app/layout.tsx`: theme/fonts wiring from PR 1, nav built from claims (`user_role`, `brand_ids`), hides queue/brand links for specialists.
- [x] 4.7 Create `app/page.tsx`: redirect `team_lead` -> `/queue`, `specialist` -> `/feedback`.
- [x] 4.8 Verify: switching to Marta lands on `/queue`; switching to Dani lands on `/feedback` with no queue/brand nav links; a direct PostgREST request after switching uses the new session (verified via curl with the session's access token). See apply report for the full transcript.

## PR 5: Review loop

Spec refs: reply-review (all requirements). Design refs: A5, A6, A21, sequence diagram 2, Application Structure (`features/reviews`).

- [x] 5.1 Create `features/reviews/domain/score.ts` (1-5 integer + label) and `domain/tag-scope.ts` (documents the RLS-enforced scope rule).
- [x] 5.2 Create `features/reviews/ports/review-repository.ts` and `infra/supabase-review-repository.ts` (`import 'server-only'`).
- [x] 5.3 Create `features/reviews/application/{list-queue,get-reply,submit-review}.ts` use cases.
- [x] 5.4 Create `app/queue/layout.tsx` (list + brand filter, child slot) reading `review_queue` view.
- [x] 5.5 Create `app/queue/page.tsx` empty-selection state.
- [x] 5.6 Create `app/queue/[replyId]/page.tsx` (reply, `customer_message`, `ReviewForm`) and `actions.ts` calling `submitReview` -> `submit_review` RPC.
- [x] 5.7 Create `features/reviews/ui/{QueueList,ReplyView,ReviewForm,ConfirmSummary}.tsx` implementing the inline confirm step (Back/Confirm, "cannot be edited" notice) and "Save & next" navigation.
- [x] 5.8 Add `loading.tsx`/`error.tsx` for `app/queue` and `app/queue/[replyId]`, and a queue `EmptyState` ("Queue clear...").
- [x] 5.9 Verify: queue shows only unreviewed replies for the current lead's brands, newest first (reply-review scenario 1); brand filter narrows correctly (scenario 3); saving without a score is blocked (scenario score-required); confirm/back flow matches spec; after save the reply is gone from the queue; curl PostgREST as a specialist attempting `submit_review` returns `forbidden`; curl a second insert for an already-reviewed reply returns `already_reviewed`.

## PR 6: Brand trend + specialist feedback

Spec refs: brand-trend (all requirements), specialist-feedback (all requirements). Design refs: A13-A15, A19, A20, Application Structure (`features/brand-trend`, `features/feedback`).

- [x] 6.1 Create `features/brand-trend/{application,ports,infra}` reading `brand_weekly_scores`, `brand_tag_counts`, `brand_specialist_stats` views.
- [x] 6.2 Create `features/brand-trend/ui/TrendChart.tsx`: hand-rolled server-rendered SVG line with `n` under each week and `brand_actions` markers (A15).
- [x] 6.3 Create `features/brand-trend/ui/{TagComparison,SpecialistTable,ActionForm}.tsx`.
- [x] 6.4 Create `app/brands/[brandId]/page.tsx` and `actions.ts` (action form submit), with empty state for zero-review brands.
- [x] 6.5 Create `features/feedback/{application,ports,infra}` reading the specialist's own reviewed replies only, and `ui/FeedbackFeed.tsx`; wire `app/feedback/page.tsx` with empty state.
- [x] 6.6 Add `loading.tsx`/`error.tsx` for `app/brands/[brandId]` and `app/feedback`.
- [x] 6.7 Verify: brand page for a brand with no reviews shows empty state; tag comparison shows last-4-weeks vs previous-4-weeks counts (design example: 3 vs 9); specialist row for a shared specialist reflects only this brand's reviews; action form insert succeeds for own brand; curl a direct `brand_actions` insert for a brand not led by the user returns denied; curl feedback-view queries as a specialist for another specialist's data return no rows; curl a specialist's own data after brand membership removal still returns their history. See apply report for the full transcript.

## PR 7: README + DECISIONS.md

Spec refs: none (deliverables from proposal Success Criteria). Design refs: Testing Strategy, Migration/Rollout.

- [ ] 7.1 Write `README.md`: prerequisites, `supabase start`, `supabase db reset` (seed), `npm run dev`, list of seeded users and how to switch roles via the corner switcher.
- [ ] 7.2 Time a clean clone-to-running walkthrough and adjust README until it is under 10 minutes.
- [x] 7.3 Finalize `DECISIONS.md`: cover AI-scoring rejection rationale, helpdesk-ingestion deferral, and any decisions made during apply (e.g., final PR chain strategy, seed names from D1).
- [ ] 7.4 Verify: a stranger following only the README reaches a running, seeded app in under 10 minutes; `DECISIONS.md` reflects the final resolved decisions list (proposal + design + this file).
