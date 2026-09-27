# Spec: specialist-feedback

## ADDED Requirements

### Requirement: Self-view shows only the specialist's own reviewed replies
The specialist self-view MUST show only replies authored by the current specialist that have a saved review, together with that review's score, tags, and note. It MUST NOT show unreviewed replies (it is a feedback feed, not an inbox), and MUST NOT show any other specialist's replies or reviews, in any brand.

#### Scenario: Self-view shows own reviewed replies with feedback
- **GIVEN** specialist Dani has reviewed replies in brand A
- **WHEN** Dani opens the self-view
- **THEN** it lists Dani's reviewed replies together with each review's score, tags, and note

#### Scenario: Self-view excludes unreviewed replies
- **GIVEN** specialist Dani has replies with no saved review yet
- **WHEN** Dani opens the self-view
- **THEN** those unreviewed replies do not appear

#### Scenario: Self-view excludes other specialists' data
- **GIVEN** another specialist works in the same brand as Dani and has their own reviewed replies
- **WHEN** Dani opens the self-view
- **THEN** none of the other specialist's replies or reviews appear

#### Scenario: Specialist with no reviewed replies yet
- **GIVEN** specialist Dani has no reviewed replies in any brand
- **WHEN** Dani opens the self-view
- **THEN** the page shows an empty state instead of a list
