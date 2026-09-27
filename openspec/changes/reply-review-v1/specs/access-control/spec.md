# Spec: access-control

## ADDED Requirements

### Requirement: A global role per user, scoped by brand memberships
Every user MUST have exactly one role, `specialist` or `team_lead`, which applies across all their brands. Which brands a user can access MUST be defined by their `brand_memberships(user_id, brand_id)` rows. A team lead acts as a team lead only in the brands they are a member of. There is no admin role.

#### Scenario: A team lead acts only within their member brands
- **GIVEN** Marta is a `team_lead` and a member of brands A and B, but not C
- **WHEN** Marta requests brand A's review queue
- **THEN** the request succeeds
- **WHEN** Marta attempts to insert a review for a reply in brand C
- **THEN** the insert is denied

### Requirement: RLS is the sole authority; JWT claims are navigation-only
Every read and write covered by this capability MUST be enforced by a Postgres Row-Level Security policy that consults `profiles` and `brand_memberships` through `SECURITY DEFINER` helpers (`is_brand_member(brand_id)`, `is_team_lead()`), evaluated at query time. Claims copied into the JWT by the Custom Access Token Hook MUST be used only for UI navigation and MUST NOT be trusted as an authorization source. A stale or forged claim MAY cause RLS to deny a request that the underlying membership table would have allowed (until token refresh), but MUST NEVER cause RLS to allow a request that the membership table would deny.

#### Scenario: Stale JWT claim narrows access, never widens it
- **GIVEN** a team lead's `brand_memberships` row for brand A was deleted after their JWT was minted, so the stale JWT still lists brand A
- **WHEN** the team lead requests brand A's reviews directly via the API
- **THEN** the request is denied, because RLS re-checks `brand_memberships`, not the JWT claim

#### Scenario: Enforcement holds even with a forged or tampered claim
- **GIVEN** a request carries a JWT whose claims list membership in a brand the `brand_memberships` table does not contain for that user
- **WHEN** the user requests that brand's data directly via the API
- **THEN** the request is denied, because RLS decisions come from the table, not the claim

### Requirement: Cross-brand isolation for specialists
A specialist MUST be able to read only replies they authored and the reviews of those replies. Authorship, not current membership, grants this access: a specialist keeps their own feedback history after leaving a brand, but never sees any other reply from that brand or any other brand. Direct API requests for other replies or reviews MUST return no rows, and any write attempt MUST be denied.

#### Scenario: Specialist cannot read another brand's replies or reviews
- **GIVEN** specialist Dani has no membership in brand C and never wrote a reply for it
- **WHEN** Dani issues a direct API query for brand C's replies or reviews
- **THEN** the response contains no rows

#### Scenario: Specialist keeps their own history after leaving a brand
- **GIVEN** Dani wrote reviewed replies for brand A and his brand A membership was later removed
- **WHEN** Dani opens his feedback view or queries his replies directly via the API
- **THEN** his own brand A replies and their reviews are still returned, and no other brand A reply is

#### Scenario: Specialist cannot insert a review anywhere
- **GIVEN** specialist Dani is a specialist (not team lead) in brand A
- **WHEN** Dani attempts to insert a review for a reply in brand A via a direct API request
- **THEN** the insert is denied

### Requirement: Isolation between specialists within the same brand
Within a single brand, a specialist MUST see only their own replies and reviews. A direct API request for another specialist's replies or reviews in a shared brand MUST return no rows, even though both specialists work in that brand.

#### Scenario: Specialist cannot read a peer's data in a shared brand
- **GIVEN** Dani and another specialist both work in brand A
- **WHEN** Dani issues a direct API query for the other specialist's replies or reviews in brand A
- **THEN** the response contains no rows

### Requirement: Team lead visibility is scoped to their own led brands
A team lead MUST see replies and reviews only for brands they are a member of. When a specialist works in multiple brands, a team lead MUST see that specialist's replies and reviews only for the brand(s) the team lead leads, never for the specialist's other brands.

#### Scenario: Team lead sees a shared specialist's data only for her own brand
- **GIVEN** specialist Dani works in brand A (led by Marta) and brand B (led by Nuria)
- **WHEN** Marta queries Dani's replies and reviews
- **THEN** only Dani's brand A data is returned, never brand B data

#### Scenario: Team lead of one brand cannot read or write another brand
- **GIVEN** Marta leads brand A only and does not lead brand B
- **WHEN** Marta issues a direct API query for brand B's replies or reviews
- **THEN** the response contains no rows
- **WHEN** Marta attempts to insert a review or a `brand_actions` row for brand B
- **THEN** the insert is denied

### Requirement: Reviews are immutable
There MUST be no RLS policy or application path permitting UPDATE or DELETE on `reviews`. Once a review is saved it MUST remain unchanged.

#### Scenario: Direct UPDATE of a review is denied
- **GIVEN** a saved review exists for a reply
- **WHEN** any user, including the reviewing team lead, issues a direct API UPDATE against that review row
- **THEN** the update is denied

#### Scenario: Direct DELETE of a review is denied
- **GIVEN** a saved review exists for a reply
- **WHEN** any user issues a direct API DELETE against that review row
- **THEN** the delete is denied

### Requirement: A reply can be reviewed exactly once
The database MUST enforce `UNIQUE(reviews.reply_id)`. A second review insert for a reply that already has one MUST be rejected by the database.

#### Scenario: Second review for the same reply is rejected
- **GIVEN** a reply already has a saved review
- **WHEN** a team lead for that brand attempts to insert a second review for the same reply
- **THEN** the database rejects the insert due to the unique constraint

### Requirement: `brand_actions` inserts are restricted to that brand's team leads
Only a team lead who is a member of a given brand MUST be permitted to insert a `brand_actions` row for that brand. This MUST be enforced by an RLS INSERT policy on `brand_actions`, not only by the UI.

#### Scenario: Team lead can record an action for her own brand
- **GIVEN** Marta leads brand A
- **WHEN** Marta inserts a `brand_actions` row for brand A
- **THEN** the insert succeeds

#### Scenario: Team lead cannot record an action for a brand she does not lead
- **GIVEN** Marta does not lead brand B
- **WHEN** Marta attempts to insert a `brand_actions` row for brand B via a direct API request
- **THEN** the insert is denied

#### Scenario: Specialist cannot record a brand action
- **GIVEN** Dani is a specialist (not team lead) in brand A
- **WHEN** Dani attempts to insert a `brand_actions` row for brand A
- **THEN** the insert is denied

### Requirement: Authorship cannot be spoofed
The author of every write MUST be the authenticated user. `reviews.reviewer_id` and `brand_actions.author_id` MUST equal `auth.uid()`, enforced by the RLS INSERT policies (WITH CHECK), not by the application.

#### Scenario: Team lead cannot write a review on behalf of another user
- **GIVEN** Marta leads brand A
- **WHEN** Marta inserts a review for a brand A reply via a direct API request with `reviewer_id` set to another user's id
- **THEN** the insert is denied

#### Scenario: Team lead cannot record an action on behalf of another user
- **GIVEN** Marta leads brand A
- **WHEN** Marta inserts a `brand_actions` row for brand A with `author_id` set to another user's id
- **THEN** the insert is denied
