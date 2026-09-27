# Spec: identity-switcher

## ADDED Requirements

### Requirement: Switching identity establishes a real Supabase session
The corner user switcher MUST let the current user pick from the seeded users and switch to a real Supabase session for that user via `signInWithPassword`. There MUST be no separate login form; the switcher is the only way to change identity.

#### Scenario: Switching user establishes a new session
- **GIVEN** the app is running with the seeded users available
- **WHEN** a user selects a different seeded user from the switcher
- **THEN** a new Supabase session is established for that user via `signInWithPassword`, and subsequent requests use that session

### Requirement: Post-switch views reflect the new session's authorization
After switching identity, every subsequent read or write MUST be evaluated under the new session's RLS authorization, not the previous session's.

#### Scenario: Data scope changes immediately after switching
- **GIVEN** the switcher is currently on team lead Marta, viewing brand A's queue
- **WHEN** the user switches to specialist Dani
- **THEN** the queue view is replaced by Dani's self-view, and any direct API request now runs under Dani's authorization

### Requirement: The landing page depends on the user's role
After switching, the user MUST land on a page that matches their role. A team lead MUST land on the review queue. A specialist MUST land on their own feedback view. Navigation MUST NOT offer pages the user's role does not allow, and brand links MUST be limited to the user's member brands; RLS still denies any direct request regardless of navigation.

#### Scenario: Team lead lands on the review queue
- **GIVEN** Marta is a team lead
- **WHEN** the switcher changes the identity to Marta
- **THEN** Marta lands on the review queue

#### Scenario: Specialist lands on their feedback view
- **GIVEN** Dani is a specialist
- **WHEN** the switcher changes the identity to Dani
- **THEN** Dani lands on his own feedback view and the navigation shows no queue or brand trend links
