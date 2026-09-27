# Reply Review

An internal tool for support team leads to review specialists' past replies, brand by brand. A lead scores an unreviewed reply (1–5, failure tags, a note), and the reviews add up to a per-brand weekly trend, recurring failures and a log of coaching actions. Specialists see only their own feedback, and that isolation is enforced in the database (Postgres RLS), not in the UI. The reasoning behind the scope and trade-offs is in [DECISIONS.md](DECISIONS.md).

## Prerequisites

- **Node.js 20+** (developed on Node 22) and **npm**
- **Docker**, running. Supabase runs locally in containers; the first start pulls images and takes a few minutes.

## Quick start

1. Clone and install:
   ```bash
   git clone <repo-url> sellervate-tech && cd sellervate-tech
   npm install
   ```
2. Start local Supabase (the Supabase CLI is a dev dependency, no global install needed):
   ```bash
   npm run db:start
   ```
3. Create your env file and add the anon key:
   ```bash
   cp .env.example .env.local
   npx supabase status -o env   # copy the ANON_KEY value
   ```
   Paste it into `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. The other values are already correct for local.
4. Reset the database to a clean, seeded state (applies migrations + `supabase/seed.sql`):
   ```bash
   npm run db:reset
   ```
5. Run the app:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000 and pick a user from the switcher in the corner.

## Switching role

There is no login screen. The corner dropdown lists the five seeded users; picking one signs in for real with `signInWithPassword` (enabled by `STUB_AUTH=true`, password from `SEED_USER_PASSWORD`). Team leads land on **Review replies** (the queue) and reach each brand under **Statistics**; specialists land on **My feedback**.

All seeded users share the password `reply-review-demo` (local demo only).

| User  | Role       | Brands             | What to look at                                                                                                    |
| ----- | ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Marta | Team lead  | Voltra, Boxwise    | Statistics → Boxwise: Dani's order-history dip, the ① coaching action and its before → after effect.               |
| Nuria | Team lead  | Lumé Skin          | The Lumé Skin queue and trend, including the occasional `gave_medical_advice` tag.                                 |
| Dani  | Specialist | Voltra, Boxwise    | Only his own reviewed replies, never anyone else's.                                                                |
| Leo   | Specialist | Boxwise, Lumé Skin | Shared between two leads: Marta reviews his Boxwise replies, Nuria his Lumé Skin ones. He sees feedback from both. |
| Sofía | Specialist | Lumé Skin          | Only her own reviewed replies.                                                                                     |

Emails are `<name>@reply-review.test` (`sofia@…` without the accent). The most recent week of replies is left unreviewed, so every lead has a queue.

## Ask the API directly

Isolation lives in the database, so you can check it without the UI. These commands need `curl` and [`jq`](https://jqlang.org/), and run against local Supabase at `http://127.0.0.1:54321`.

```bash
# Load ANON_KEY (and the other local values) into the shell
eval "$(npx supabase status -o env)"

token() {
  curl -s "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1@reply-review.test\",\"password\":\"reply-review-demo\"}" | jq -r .access_token
}
DANI=$(token dani); MARTA=$(token marta)
```

**Who can read which replies.** Count replies per specialist as each user:

```bash
for TOKEN in "$DANI" "$MARTA"; do
  curl -s "http://127.0.0.1:54321/rest/v1/replies?select=specialist_id" \
    -H "apikey: $ANON_KEY" -H "Authorization: Bearer $TOKEN" \
    | jq -c 'group_by(.specialist_id) | map({specialist: .[0].specialist_id, replies: length})'
done
```

Dani gets one group (his own id, `3333…`). Marta gets Dani and Leo (`4444…`), the specialists of the brands she leads, and nobody from Lumé Skin.

**Tags cannot cross brands.** As Marta, try to review an unreviewed Boxwise reply with the Voltra-only tag `skipped_diagnosis`:

```bash
REPLY=$(curl -s "http://127.0.0.1:54321/rest/v1/review_queue?brand_id=eq.bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&select=id&limit=1" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $MARTA" | jq -r '.[0].id')
TAG=$(curl -s "http://127.0.0.1:54321/rest/v1/tags?slug=eq.skipped_diagnosis&select=id" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $MARTA" | jq -r '.[0].id')

curl -s -w '\nHTTP %{http_code}\n' "http://127.0.0.1:54321/rest/v1/rpc/submit_review" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $MARTA" -H "Content-Type: application/json" \
  -d "{\"p_reply_id\":\"$REPLY\",\"p_score\":3,\"p_note\":\"cross-brand tag\",\"p_tag_ids\":[\"$TAG\"]}"
```

Expected: `HTTP 403` with `new row violates row-level security policy for table "review_tags"`. `submit_review` runs in one transaction, so the review itself is rolled back too and the reply stays in the queue.

## Scripts

| Script                 | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Next.js dev server on http://localhost:3000           |
| `npm run build`        | Production build                                      |
| `npm run start`        | Serve the production build                            |
| `npm run typecheck`    | `tsc --noEmit`                                        |
| `npm run lint`         | ESLint                                                |
| `npm run format:check` | Prettier check (`npm run format` to write)            |
| `npm run db:start`     | Start local Supabase (Docker)                         |
| `npm run db:stop`      | Stop local Supabase                                   |
| `npm run db:reset`     | Drop the local DB, re-apply migrations and `seed.sql` |

## Project structure

```
app/                         # Next.js App Router routes (queue, brands/[brandId], feedback)
features/<feature>/          # reviews, brand-trend, feedback, identity
  domain/  application/  ports/  infra/  ui/
supabase/
  migrations/                # schema, RLS, review integrity, views, auth hook
  seed.sql                   # users, brands, memberships, tags, ~8 weeks of replies
openspec/                    # specs and the reply-review-v1 change
```

Each feature follows a hexagonal layout: pure rules in `domain/`, use cases in `application/`, interfaces in `ports/`, Supabase adapters in `infra/`, components in `ui/`.

## Built with

- **Starter:** [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) (Next.js 16, App Router, TypeScript)
- **Supabase CLI** for local Postgres, Auth and the REST API
- **Tailwind CSS v4 + daisyUI v5** with a custom dark theme

**How it was built:** spec-driven with OpenSpec. `openspec/changes/reply-review-v1/` holds the proposal, specs, design and tasks. Every change landed through a reviewed pull request.

## Time spent

**Real time spent:** _TBD_
