-- Seed data for local dev / demo. Runs as `postgres` via `supabase db reset`,
-- so it bypasses RLS on purpose (A10). All seeded users share one password,
-- read by the app from SEED_USER_PASSWORD: the literal value here is
-- 'reply-review-demo'.
--
-- D1 (resolved by the user): brands are Voltra (electric scooters, technical —
-- diagnose before offering a return), Boxwise (packaging supplier — fast,
-- exact, ~3 lines), Lumé Skin (DTC skincare — warm/empathetic, never give
-- medical advice on a reaction, ask for a photo + batch number, offer a
-- no-questions refund). Marta leads Voltra + Boxwise, Nuria leads Lumé Skin.
-- Dani -> Voltra, Boxwise. Leo -> Boxwise, Lumé Skin (shared). Sofía -> Lumé Skin.

-- ---------------------------------------------------------------------------
-- Fixed ids (readable, not random) so every insert below can reference them.
-- marta    11111111-1111-1111-1111-111111111111
-- nuria    22222222-2222-2222-2222-222222222222
-- dani     33333333-3333-3333-3333-333333333333
-- leo      44444444-4444-4444-4444-444444444444
-- sofia    55555555-5555-5555-5555-555555555555
-- voltra   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- boxwise  bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
-- lume     cccccccc-cccc-cccc-cccc-cccccccccccc
-- ---------------------------------------------------------------------------

-- A10: auth.users + auth.identities, password via crypt/gen_salt, confirmed.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  created_at, updated_at, is_sso_user, is_anonymous
)
select '00000000-0000-0000-0000-000000000000'::uuid, u.id, 'authenticated', 'authenticated',
  u.email, crypt('reply-review-demo', gen_salt('bf')), now(),
  '', '', '', '', '', '',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
  now(), now(), false, false
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'marta@reply-review.test'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'nuria@reply-review.test'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'dani@reply-review.test'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'leo@reply-review.test'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'sofia@reply-review.test')
) as u(id, email);

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', now(), now(), now()
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'marta@reply-review.test'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'nuria@reply-review.test'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'dani@reply-review.test'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'leo@reply-review.test'),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'sofia@reply-review.test')
) as u(id, email);

insert into public.profiles (id, display_name, role) values
  ('11111111-1111-1111-1111-111111111111', 'Marta', 'team_lead'),
  ('22222222-2222-2222-2222-222222222222', 'Nuria', 'team_lead'),
  ('33333333-3333-3333-3333-333333333333', 'Dani', 'specialist'),
  ('44444444-4444-4444-4444-444444444444', 'Leo', 'specialist'),
  ('55555555-5555-5555-5555-555555555555', 'Sofía', 'specialist');

insert into public.brands (id, name, slug, voice_notes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Voltra', 'voltra',
   'Technical, electric scooters. Diagnose the cause before ever offering a return or refund.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Boxwise', 'boxwise',
   'Packaging supplier. Fast, exact, no fluff — good replies run about three lines.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lumé Skin', 'lume-skin',
   'DTC skincare, warm and empathetic. Never diagnose or give medical advice on a skin reaction: ask for a photo and batch number, and offer a no-questions refund.');

insert into public.brand_memberships (user_id, brand_id) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), -- Marta / Voltra
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), -- Marta / Boxwise
  ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc'), -- Nuria / Lumé Skin
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), -- Dani / Voltra
  ('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), -- Dani / Boxwise
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), -- Leo / Boxwise
  ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc'), -- Leo / Lumé Skin
  ('55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc'); -- Sofía / Lumé Skin

-- Tags. Global ones cover the failure modes named in the brief; per-brand
-- ones cover a procedure specific to that brand. Boxwise gets no extra
-- per-brand tag — nothing about "fast, exact packaging" needs one beyond
-- the global set and no_order_history_check.
insert into public.tags (brand_id, slug, label, description) values
  (null, 'slow_response', 'Slow response', 'Took too long to reply given the issue.'),
  (null, 'wrong_tone', 'Wrong tone', 'Tone did not match this brand''s voice.'),
  (null, 'answered_different_question', 'Answered a different question', 'Did not address what the customer actually asked.'),
  (null, 'would_not_stop_follow_up', 'Would not stop follow-up', 'Technically correct but would not have stopped the customer writing back in.'),
  (null, 'no_order_history_check', 'No order history check', 'Closed the ticket without checking the order history first.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'skipped_diagnosis', 'Skipped diagnosis', 'Offered a return/refund before diagnosing the problem.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'gave_medical_advice', 'Gave medical advice', 'Diagnosed or gave a treatment plan for a skin reaction instead of asking for a photo/batch and offering a refund.');

-- ---------------------------------------------------------------------------
-- Showcase replies: hand-written, brand-distinct, real content.
-- ---------------------------------------------------------------------------

insert into public.replies (id, brand_id, specialist_id, subject, customer_message, body, sent_at, source) values
  -- Voltra (Dani)
  ('a0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333',
   'Scooter cutting out mid-ride', 'My V3 scooter shuts off randomly after about 10 minutes of riding, especially uphill.',
   'Thanks for the detail — that pattern usually points to the controller''s thermal cutoff or a loose battery connector rather than a dead cell. Can you check whether the connector under the deck is fully seated, and let me know if the shutdown happens on flat ground too? If it''s the connector we can fix it in five minutes; if not, we''ll get a replacement controller out.',
   now() - interval '13 days', 'seed'),
  ('a0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333',
   'Battery seems weak', 'I feel like my scooter doesn''t go as far as it used to.',
   'Sorry to hear that! We can process a full refund or send you a replacement scooter right away, whichever you prefer.',
   now() - interval '19 days', 'seed'),
  ('a0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333',
   'Throttle feels laggy', 'The throttle takes a second to respond after I squeeze it.',
   'That delay is almost always the firmware''s ramp-up setting rather than a hardware fault. Can you check the app for a pending firmware update? Updating usually removes the lag; if it''s already current, tell me and we''ll look at the throttle sensor instead.',
   now() - interval '26 days', 'seed'),
  ('a0000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333',
   'Kickstand broke off', 'The kickstand snapped clean off after a few weeks.',
   'That shouldn''t happen this early — it''s covered under warranty. Could you send me your order number so I can confirm the purchase date, and a photo of the mounting point? We''ll ship a replacement kickstand as soon as I confirm it.',
   now() - interval '33 days', 'seed'),
  -- Boxwise (Dani, Leo)
  ('b0000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333',
   'Late shipment', 'The pallet of boxes hasn''t arrived and we''re two days from running out.',
   E'Checked the manifest — carrier scanned it in transit as of this morning.\nExpected delivery tomorrow by end of day.\nI''ll message you the tracking link now so you can watch it move.',
   now() - interval '10 days', 'seed'),
  ('b0000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333',
   'Missing invoice', 'Was an invoice supposed to come with this shipment? I don''t see one.',
   'Invoices are only sent by email, this ticket is resolved.',
   now() - interval '17 days', 'seed'),
  ('b0000000-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444',
   'Custom box size question', 'Can you make a box that''s 14x10x6 inches for our new product line?',
   'Yes — 14x10x6 fits our standard C-flute die with no tooling fee. Minimum order is 500 units, and turnaround is 6 business days from artwork approval.',
   now() - interval '15 days', 'seed'),
  ('b0000000-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333',
   'Pallet count off by one', 'We counted 39 boxes on the pallet, the packing slip says 40.',
   'You''re right, sorry — one carton short. Reshipping the missing carton today, no charge, tracking to follow.',
   now() - interval '22 days', 'seed'),
  -- Lumé Skin (Leo, Sofía)
  ('c0000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555',
   'Redness after using the retinol serum', 'My skin got red and itchy after the second night using this.',
   'I''m sorry that happened — reactions like that are worth taking seriously, so I don''t want to guess. Could you send a photo of the area and the batch number on the bottom of the bottle? In the meantime we''ll go ahead and refund this order in full, no need to send anything back.',
   now() - interval '11 days', 'seed'),
  ('c0000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444',
   'Breakout after cleanser', 'I''ve had painful bumps on my cheeks since I started the new cleanser three days ago.',
   'That sounds like a mild allergic contact dermatitis — try switching to a fragrance-free moisturizer and it should clear up in about a week, no need to stop the cleanser yet.',
   now() - interval '18 days', 'seed'),
  ('c0000000-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555',
   'Packaging arrived cracked', 'The moisturizer jar arrived with a cracked lid and some product leaked out.',
   'That''s on us — sorry it arrived like that. I''m sending a replacement jar out today at no charge, and you''re welcome to keep or toss the damaged one, whichever is easier.',
   now() - interval '24 days', 'seed'),
  ('c0000000-0000-0000-0000-000000000004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555',
   'Does this contain fragrance?', 'I have sensitive skin — does the vitamin C serum have added fragrance?',
   'No added fragrance in that one — the ingredient list is fully published on the product page under "Full Ingredients" if you''d like to check it against anything specific before trying it.',
   now() - interval '30 days', 'seed');

-- A8b: the trigger forces reviewer_id = auth.uid() / created_at = now(), which
-- would insert NULL as `postgres` (no session). Seeding runs as postgres and
-- needs to backdate created_at realistically, so the trigger is disabled only
-- around the review inserts in this file, then re-enabled immediately after.
alter table public.reviews disable trigger reviews_force_server_fields_trg;

insert into public.reviews (id, reply_id, reviewer_id, score, note, created_at) values
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 5, 'Diagnosed before doing anything else — exactly the Voltra playbook.', now() - interval '12 days'),
  ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 1, 'No questions asked about charge cycles, terrain, or age before jumping to a refund.', now() - interval '18 days'),
  ('a1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 4, 'Good diagnosis path, slightly terse close.', now() - interval '25 days'),
  ('a1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 4, 'Confirmed warranty details before promising a fix.', now() - interval '32 days'),
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 5, 'Three lines, exact, nothing extra. This is the bar.', now() - interval '9 days'),
  ('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 2, 'Closed without checking if an invoice request was already logged on this order.', now() - interval '16 days'),
  ('b1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 4, 'Precise spec answer, exactly what Boxwise needs.', now() - interval '14 days'),
  ('b1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 3, 'Fixed it, but should have said how the miscount happened.', now() - interval '21 days'),
  ('c1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 5, 'Photo + batch number + refund, no diagnosis. Exactly right.', now() - interval '10 days'),
  ('c1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 1, 'Diagnosed a skin condition and gave a treatment plan instead of asking for a photo/batch and offering a refund.', now() - interval '17 days'),
  ('c1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 4, 'Warm, fast on the replacement, good.', now() - interval '23 days'),
  ('c1000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 5, 'Accurate and pointed her to the source instead of guessing.', now() - interval '29 days');

insert into public.review_tags (review_id, tag_id) values
  ('a1000000-0000-0000-0000-000000000002', (select id from public.tags where slug = 'skipped_diagnosis' and brand_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')),
  ('b1000000-0000-0000-0000-000000000002', (select id from public.tags where slug = 'no_order_history_check' and brand_id is null)),
  ('b1000000-0000-0000-0000-000000000004', (select id from public.tags where slug = 'answered_different_question' and brand_id is null)),
  ('c1000000-0000-0000-0000-000000000002', (select id from public.tags where slug = 'gave_medical_advice' and brand_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'));

-- ---------------------------------------------------------------------------
-- Bulk volume: ~8 weeks of replies per brand, generated from small text
-- pools, so weekly/4-week trend windows have real data to aggregate.
-- ---------------------------------------------------------------------------

-- Boxwise / Dani: the order-history story. Weeks 8-5 ago, Dani closes
-- tickets without checking order history (tagged, low scores). Marta coaches
-- him ~4.5 weeks ago (brand_actions below). Weeks 4-2 ago recover; week 1 is
-- left unreviewed for the queue.
insert into public.replies (brand_id, specialist_id, subject, customer_message, body, sent_at, source)
select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333',
  pool.subject, pool.customer_message, pool.body,
  now() - (w || ' weeks')::interval - (gs || ' days')::interval, 'seed'
from generate_series(1, 8) as w
cross join generate_series(1, 2) as gs
cross join lateral (
  select * from (values
    ('Reorder question', 'Can we reorder the same mailer spec as last time?', 'Reordering the same spec now, should ship within our normal lead time.'),
    ('Short shipment', 'This box only had 480 units, we ordered 500.', 'Ticket closed, reship not needed.'),
    ('Wrong tape color', 'The tape on this batch is clear, we asked for branded tape.', 'Noted, will flag it for the next run.')
  ) as p(subject, customer_message, body)
  offset ((w * 2 + gs) % 3) limit 1
) as pool;

with dated as (
  select r.id, r.sent_at, floor(extract(epoch from (now() - r.sent_at)) / 604800)::int as wk
  from public.replies r
  where r.brand_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    and r.specialist_id = '33333333-3333-3333-3333-333333333333'
    and r.source = 'seed'
    and r.id::text not like 'b0000000-%'
)
insert into public.reviews (reply_id, reviewer_id, score, note, created_at)
select id, '11111111-1111-1111-1111-111111111111',
  case when wk >= 5 then 2 + (abs(hashtext(id::text)) % 2)
       else 4 + (abs(hashtext(id::text)) % 2) end,
  case when wk >= 5 then 'Please check order history before closing.'
       else 'Order history checked before closing — good.' end,
  sent_at + interval '1 day'
from dated
where wk between 2 and 8;

insert into public.review_tags (review_id, tag_id)
select rv.id, (select id from public.tags where slug = 'no_order_history_check' and brand_id is null)
from public.reviews rv
join public.replies r on r.id = rv.reply_id
where r.brand_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  and r.specialist_id = '33333333-3333-3333-3333-333333333333'
  and r.source = 'seed'
  and floor(extract(epoch from (now() - r.sent_at)) / 604800)::int >= 5
  and abs(hashtext(rv.id::text)) % 4 <> 0;

-- Marta coaches Dani ~4.5 weeks ago, between the bad and recovered clusters.
insert into public.brand_actions (brand_id, author_id, taken_at, note, tag_id, created_at)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
  (current_date - 32), 'Coached Dani on checking order history before closing tickets.',
  (select id from public.tags where slug = 'no_order_history_check' and brand_id is null),
  now() - interval '32 days');

-- Boxwise / Leo: stable, no trend, week 1 left unreviewed.
insert into public.replies (brand_id, specialist_id, subject, customer_message, body, sent_at, source)
select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444',
  pool.subject, pool.customer_message, pool.body,
  now() - (w || ' weeks')::interval - interval '3 days', 'seed'
from generate_series(1, 8) as w
cross join lateral (
  select * from (values
    ('Die line approval', 'Attached is the die line, can you confirm it prints clean?', 'Confirmed clean, approved for print as-is.'),
    ('Case pack question', 'What''s the max weight per case for the 12x12 box?', 'Rated to 40 lbs per case at that flute grade.')
  ) as p(subject, customer_message, body)
  offset (w % 2) limit 1
) as pool;

insert into public.reviews (reply_id, reviewer_id, score, note, created_at)
select r.id, '11111111-1111-1111-1111-111111111111', 4 + (abs(hashtext(r.id::text)) % 2),
  'Fast, exact, on brand.', r.sent_at + interval '1 day'
from public.replies r
where r.brand_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  and r.specialist_id = '44444444-4444-4444-4444-444444444444'
  and r.source = 'seed'
  and r.id::text not like 'b0000000-%'
  and floor(extract(epoch from (now() - r.sent_at)) / 604800)::int between 2 and 8;

-- Voltra / Dani: mild upward trend, occasional skipped_diagnosis. Week 1
-- unreviewed.
insert into public.replies (brand_id, specialist_id, subject, customer_message, body, sent_at, source)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333',
  pool.subject, pool.customer_message, pool.body,
  now() - (w || ' weeks')::interval - (gs || ' days')::interval, 'seed'
from generate_series(1, 8) as w
cross join generate_series(1, 2) as gs
cross join lateral (
  select * from (values
    ('Odd noise from the motor', 'There''s a clicking noise from the rear wheel at low speed.', 'That clicking at low speed usually means a loose fender bolt tapping the tire — can you check the bolts around the rear fender before we escalate to the motor?'),
    ('Range dropped after firmware update', 'My range dropped noticeably right after the last app update.', 'The last firmware changed the battery percentage calibration, so the number reads more conservatively — actual range should be close to before. Can you confirm with a full charge-to-empty ride?'),
    ('Charger gets warm', 'The charger gets pretty warm after an hour, is that normal?', 'Some warmth is normal, but if it''s hot to the touch or the light is flashing, that points to a charger fault rather than the battery — can you tell me which one you''re seeing?')
  ) as p(subject, customer_message, body)
  offset ((w + gs) % 3) limit 1
) as pool;

insert into public.reviews (reply_id, reviewer_id, score, note, created_at)
select r.id, '11111111-1111-1111-1111-111111111111',
  greatest(1, least(5, 5 - floor(wk / 3) + (abs(hashtext(r.id::text)) % 2))),
  'Reviewed in the weekly batch.', r.sent_at + interval '1 day'
from (
  select id, sent_at, floor(extract(epoch from (now() - sent_at)) / 604800)::int as wk
  from public.replies
  where brand_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    and specialist_id = '33333333-3333-3333-3333-333333333333'
    and source = 'seed'
    and id::text not like 'a0000000-%'
) r
where wk between 2 and 8;

insert into public.review_tags (review_id, tag_id)
select rv.id, (select id from public.tags where slug = 'skipped_diagnosis' and brand_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
from public.reviews rv
join public.replies r on r.id = rv.reply_id
where r.brand_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and r.specialist_id = '33333333-3333-3333-3333-333333333333'
  and r.source = 'seed'
  and abs(hashtext(rv.id::text)) % 5 = 0;

-- Lumé Skin / Leo + Sofía: mild trend, rare gave_medical_advice for Leo.
-- Week 1 left unreviewed for both specialists.
insert into public.replies (brand_id, specialist_id, subject, customer_message, body, sent_at, source)
select 'cccccccc-cccc-cccc-cccc-cccccccccccc', spec.id,
  pool.subject, pool.customer_message, pool.body,
  now() - (w || ' weeks')::interval - interval '2 days', 'seed'
from generate_series(1, 8) as w
cross join (values ('44444444-4444-4444-4444-444444444444'::uuid), ('55555555-5555-5555-5555-555555555555'::uuid)) as spec(id)
cross join lateral (
  select * from (values
    ('Dry patches after new moisturizer', 'I''ve got dry, flaky patches since switching to the new moisturizer.', 'Sorry that''s happening — could you send a photo and the batch number from the bottom of the jar? We''ll get you a refund in the meantime, no need to send it back.'),
    ('Serum stinging on application', 'The vitamin C serum stings for a few seconds when I put it on.', 'A brief tingle can happen with vitamin C, but if it''s more than mild or lasts past a minute, I''d rather not guess — send a photo and the batch number and we''ll refund it right away.')
  ) as p(subject, customer_message, body)
  offset (w % 2) limit 1
) as pool;

insert into public.reviews (reply_id, reviewer_id, score, note, created_at)
select r.id, '22222222-2222-2222-2222-222222222222',
  greatest(1, least(5, 5 - floor(wk / 4) + (abs(hashtext(r.id::text)) % 2))),
  'Reviewed in the weekly batch.', r.sent_at + interval '1 day'
from (
  select id, sent_at, specialist_id, floor(extract(epoch from (now() - sent_at)) / 604800)::int as wk
  from public.replies
  where brand_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    and source = 'seed'
    and id::text not like 'c0000000-%'
) r
where wk between 2 and 8;

insert into public.review_tags (review_id, tag_id)
select rv.id, (select id from public.tags where slug = 'gave_medical_advice' and brand_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc')
from public.reviews rv
join public.replies r on r.id = rv.reply_id
where r.brand_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  and r.specialist_id = '44444444-4444-4444-4444-444444444444'
  and r.source = 'seed'
  and abs(hashtext(rv.id::text)) % 6 = 0;

alter table public.reviews enable trigger reviews_force_server_fields_trg;
