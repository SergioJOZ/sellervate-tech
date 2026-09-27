## Exploration: reply-review-v1 (reviewing-problem framing, V1)

### Current State
Greenfield repo — no app code, only `openspec/config.yaml` (Next.js App Router + TS, Supabase local, Tailwind/daisyUI, npm, no tests). Brief source: `Sellervate-Technical-Exercise.pdf` (7 pages, read in full). Confirmed fixed decisions: reviewing-problem framing, stubbed auth via user switcher + `signInWithPassword`, Custom Access Token Hook + RLS for authorization, single OpenSpec change sliced into 5-7 PRs of ≤400 lines.

### Affected Areas (files to be created, not yet existing)
- `supabase/migrations/*` — schema: brands, profiles, brand_memberships, replies, reviews, access-token hook function
- `supabase/seed.sql` — brands, users, memberships, replies, reviews
- `app/` (App Router) — role-aware dashboard routes, review form, brand trend view
- `lib/supabase/{server,client}.ts` — server-side client with RLS-respecting session
- `DECISIONS.md`, `README.md` — required deliverables per brief, not exploration output but shape the scope

### Brief quotes anchoring the roles/visibility matrix
- "A specialist should see their own scores and whatever I wrote on them. Not everybody else's."
- "Most specialists cover two or three brands. I cover four of the six and Nuria covers the rest, so neither of us sees the whole picture." → team leads cover a **subset** of brands, not all six; visibility is per-brand-membership, not a single global "team lead" flag.
- "Marta leads three brands... reads five of them... Two weeks later that brand asks how things are going. She opens the brand and can answer: trend / what we keep getting wrong / what we changed about it."
- "Dani ... logs in and sees his own scores and what Marta wrote on them. He does not see anybody else's."
- Auth: "Authorisation cannot be stubbed... If we switch to a specialist and ask the API directly for another brand's data, it should say no."

#### Roles & visibility matrix (draft — needs confirmation, see OPEN-1)

| Actor | Reads | Writes | Scope |
|---|---|---|---|
| Specialist | own replies, own reviews (score + notes) | nothing (reviews are read-only to them) | self only, across whatever brands they work in |
| Team lead | replies + reviews for brands they lead; can list specialists under those brands | creates/edits reviews for replies in their brands | subset of brands (their memberships), never all six by default |
| Admin/ops (OPEN) | everything, all brands | possibly manage brand/user/membership records | global — brief never mentions this role explicitly |

The brief never explicitly names an admin/ops role — it only contrasts "specialist" and "team lead." A seed/setup actor is implied (someone must assign brand memberships) but could be done via seed SQL, not a UI role.

### Data model candidates

| Entity | Purpose | Key fields (draft) | Migration risk if wrong |
|---|---|---|---|
| `brands` | tenant boundary | id, name, slug | Low — stable, unlikely to change shape |
| `profiles` | app-level user record mirroring `auth.users` | id (=auth uid), display_name, global_role? | Medium — whether "role" is global or per-brand is the single biggest fork (see OPEN-2) |
| `brand_memberships` | who works which brand, in what capacity | user_id, brand_id, role (`specialist`\|`team_lead`) | High-value: a single global role column cannot express per-brand role differences |
| `replies` | the artifact under review | id, brand_id, specialist_id (author), body, sent_at, **source** (`manual`\|future `helpdesk`), **external_id** (nullable) | Low-medium — `source`+`external_id` (nullable, unique per source) should exist from day one for future helpdesk ingestion |
| `reviews` | the judgment | id, reply_id, reviewer_id (team lead), score, tags/notes, created_at, (edited_at?) | High — score scale and structured tags vs free text are cheap now, expensive after real review rows accumulate |
| `review_tags` (optional) | structured failure reasons | id, label, brand_id (nullable = global) | Only needed if going structured-tags route (see OPEN-4) |

Brief line shaping the reviews model: "she records how good it was and what was off about it: too slow, wrong tone for that brand, answered a different question than the one asked, technically correct but would not have stopped the customer writing in again" — a small closed-ish set of failure modes, suggesting structured tags plus a free-text note.

"Here is what we changed about it" implies some place for remediation/outcome notes, separate from the score itself.

### Claims design for the Custom Access Token Hook

| Option | What's in JWT | Where role/brand checked | Pros | Cons |
|---|---|---|---|---|
| A. Membership list in claims | `memberships: [{brand_id, role}]` baked in at token mint | RLS reads `auth.jwt()` directly | Fast RLS, simple policies | Stale until token refresh |
| B. Thin claims + live lookup | just `sub` / role hint | RLS calls a `SECURITY DEFINER` helper over `brand_memberships` | Always correct | Helper function, per-query lookup (irrelevant at this scale) |
| C. Hybrid: role in claims, brand scoping via live join | role hint | split | Balances readability and correctness | Authority split across two places |

### Core user journeys (from the "Monday morning" narrative)

| Journey | Actor | Minimal for V1? |
|---|---|---|
| Review queue: list recent replies for my brand(s), open one, score it, leave notes | Team lead | Yes — core loop |
| Brand trend view: score history / recurring failures / what changed | Team lead | Yes, as a readable list + aggregate |
| Self view: own replies + own reviews only | Specialist | Yes — required and is the isolation test case |
| Role switcher (corner UI) | Any | Yes — replaces login |
| Cross-brand comparison / coaching library / auto-scoring | — | No |

### What to explicitly cut and why
- **Auto/AI scoring** — brief warns against it; belongs in `DECISIONS.md` as a paragraph.
- **Real authentication / login form** — stubbed by design.
- **Helpdesk ingestion** — "not now"; only keep it structurally possible (`source`/`external_id`).
- **Coaching library** — a different reading of the brief.
- **Disputes, multi-reviewer consensus, notifications, Slack integration** — not in brief.
- **Admin/ops UI** — seed data creates memberships.

### Open decisions (priority order)
1. **OPEN-1** — Two roles (`specialist`, `team_lead`) or a third (`admin`/`ops`)?
2. **OPEN-2** — Role global per user (`profiles.role`) or per brand membership (`brand_memberships.role`)?
3. **OPEN-3** — Claims strategy: memberships in JWT (stale until refresh) vs thin claims + live RLS lookup vs hybrid.
4. **OPEN-4** — Review structure: score + free text, or score + structured failure tags + free text?
5. **OPEN-5** — Can a reply be reviewed more than once (1:1 vs 1:many)?
6. **OPEN-6** — Can a review be edited, and by whom?
7. **OPEN-7** — Tags/criteria global or per brand?
8. **OPEN-8** — Review queue window: calendar "yesterday", last 24h, or "unreviewed" filter?
9. **OPEN-9** — Seed data: brand concepts and personas.

### Decisions (made by the user)

| # | Decision |
|---|---|
| 1 | Two roles only: `specialist`, `team_lead`. Memberships come from seed data; no admin role or UI. |
| 2 | Role is per brand: `brand_memberships(user_id, brand_id, role)`, PK `(user_id, brand_id)`. |
| 3 | Hybrid authorization: the Custom Access Token Hook adds memberships to the JWT for UI/navigation only. RLS always checks the table through a `security definer` helper (`is_brand_member(brand_id, role)`). A stale claim can produce a 403, never a leak. |
| 4 | A review records a score, multi-select failure tags and a free-text note. |
| 5 | One review per reply: `UNIQUE(reviews.reply_id)`. |
| 6 | Reviews are immutable once saved (no UPDATE policy). |
| 7 | Tags live in a table with optional `brand_id` (`NULL` = global) plus a `review_tags` join table. A Postgres enum was considered and rejected: values cannot be dropped and per-brand tags would require a remodel. |
| 8 | Review queue: unreviewed replies of brands where the user is `team_lead`, ordered by `sent_at DESC`, filterable by brand. |
| 9 | Seed: three brands (technical scooter brand, fast/exact packaging brand, warm/empathetic DTC skincare brand whose key procedure is never giving medical advice on skin reactions). Marta leads two, Nuria leads one; specialists overlap brands so isolation is visible. Names and content to be defined with the seed. |
| 10 | "What we changed about it" is a brand-level action log: `brand_actions(brand_id, author_id, taken_at, note, tag_id NULL)`, shown as markers on the brand trend. |
| 11 | Score scale 1–5 (`smallint`, `CHECK 1..5`): 1 Harmful, 2 Poor, 3 Acceptable, 4 Good, 5 Exemplary. |

### Ready for Proposal
Yes — all open decisions resolved.
