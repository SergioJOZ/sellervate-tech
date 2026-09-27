# Decisions

## Product

**The real problem.** Review already happens, but it leaves no record. A lead can judge a reply in seconds, then the judgement disappears into Slack. So nobody can coach from it, nobody can answer a brand that asks "are we getting better?", and a specialist can skip a procedure for a month until the brand notices. On top of that, "good" means something different for every brand.

**What I built first: the review loop.** I read the notes as a _reviewing_ problem. If a review is stored as data (a 1–5 score, failure tags and a note), the other two readings become queries over it: the brand trend is a GROUP BY and a coaching library is a filter. Going the other way, from a report to the data behind it, does not work.

**What V1 is.** A lead reviews unreviewed replies in a split pane, with a confirm step: reviews are immutable, one per reply. Each brand has a statistics page that answers the Monday-morning questions in order: the trend, what we changed (with the before/after of each action), and what we keep getting wrong. A specialist sees only their own feedback, with a summary.

**Cut, and why**

| Cut                      | Why                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Coaching library         | A different reading of the notes. Once reviews are data, it becomes a filter over them.        |
| Editing and re-reviewing | A review is a record. Immutability keeps the trend honest, and the confirm step replaces undo. |
| Admin UI                 | Memberships come from the seed.                                                                |
| Helpdesk ingestion       | "Not now." `replies.source` and `external_id` keep it possible without a migration.            |

Two items came _in_ after walking through the running app. Leads can create tags for their own brand, because a new failure needs a name on the spot. Specialists got a summary, because a bare list doesn't tell Dani how he is doing.

**Where a model would earn its place.** In the queue, not in the score. A model could rank first the replies most likely to break a brand rule, such as medical advice at Lumé Skin. It would only reorder the queue, and a lead would still read every reply. I'd trust it once it beats random sampling at surfacing replies that leads later score 1–2.

**What I'd ask before V2.** How should a lead pick which five replies to read: at random, by risk, or by specialist? Who owns a brand's criteria, the lead or the brand? Do Marta's 3 and Nuria's 3 mean the same thing? Should a specialist be able to answer a review?

## Architecture

**Authorization lives in Postgres.** Every table has RLS. The policies use two `security definer` helpers, `is_team_lead()` and `is_brand_member(brand_id)`, that read the tables at query time. The Custom Access Token Hook adds `user_role` and `brand_ids` to the JWT, but only navigation reads them. A stale claim can cause a 403, never a leak. Next.js never uses the service role on a request path: every adapter is built per request from the user's own session. Querying PostgREST directly as a specialist for another brand's data returns nothing. The README shows the `curl` commands to check it.

**Stubbed login, real tokens.** The seed creates real Supabase Auth users. The corner switcher calls `signInWithPassword` on the server, behind a `STUB_AUTH` flag, so the hook and RLS run exactly as they would in production. Real authentication means swapping the switcher for SSO (for example Google Workspace through Supabase Auth). Nothing below it changes.

**Data model.** Two choices protect future migrations. Tags are rows with a nullable `brand_id`, not an enum, because enum values can't be dropped and brands need their own criteria. The role is global: moving it to per-brand later is additive, and going back is not. Reviews and tags are immutable through `REVOKE UPDATE, DELETE`, so an edit fails loudly instead of silently changing 0 rows. The full model is in `openspec/changes/reply-review-v1/design.md`.

**Shape.** The code is hexagonal per feature. Reads happen in Server Components and writes in Server Actions. Aggregates are `security_invoker` views, so RLS still applies to them.

**What breaks first.** At helpdesk volume, "every unreviewed reply" stops being a usable queue and needs a sampling policy. After that, the on-the-fly aggregates will need weekly rollups.

## AI

**How I worked.** I used spec-driven development with OpenSpec. A single change holds the proposal, specs, design and tasks, and the planning itself was PR #1. Agents asked, I decided, and every decision is recorded in `openspec/changes/reply-review-v1/`. After that there was one branch per task slice. The agent wrote the code, I read the diff, and fixes went in as follow-up commits. Late in the build I ran agents in parallel, each in its own git worktree.

**Where the agent was right.** The `REVOKE` for immutability, and saving a review and its tags in one RPC.

**Where I overrode it**

- The proposal only isolated brands from each other. It missed isolation _within_ a brand, where one specialist could read another's reviews.
- The spec didn't force `reviewer_id = auth.uid()`, so one lead could have written a review under another's name.
- A policy checked a tag's brand with a `LEFT JOIN`. The `tags` table has RLS, so a tag from a brand the lead can't see came back as NULL, which read as "global", and it could be attached through the API.
- The queue list lived in a layout that never refreshed after a save.
- Score colours were built as template-literal classes that Tailwind never generated.

**The prompt I'm pleased with.** Every agent prompt carried this rule, which is why agents came back with questions instead of assumptions:

> CRITICAL RULE: the user makes every decision. Do NOT choose. For each open point, lay out the options with concrete tradeoffs and a recommendation, and mark it clearly as "OPEN — needs user decision".

## Status

**Time spent:** 4 h 43 min (3:00 pm to 7:43 pm), inside the 6-hour cap.

All three journeys, the RLS, the seed and the README are finished. Visual QA on small screens is half done, and real authentication and ingestion were never touched. I would pick things up in this order: a queue sampling policy, an automated RLS suite, then SSO.

**What I'd test first:** tenant isolation, with direct PostgREST calls per role. It is the only failure that loses a client. I checked it by hand with `curl` on every PR, which was cheaper than building a harness in hour five.

**The one thing I'd flag hardest: the last three PRs are huge** (950, 1,100 and 1,900 authored lines against a 400-line budget). I ran agents in parallel to save time, and review size paid for it. Each PR is split into commits and its description lists what to read first, but no reviewer reads 1,900 lines in five minutes. I left them because re-slicing merged history means rewriting it, and the brief asks us not to. Next time I'd cap the slice size in the tasks, before the agents start.
