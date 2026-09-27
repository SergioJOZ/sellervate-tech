# Spec: reply-review

## ADDED Requirements

### Requirement: Review queue lists unreviewed replies for led brands
For a team lead, the review queue MUST list only replies that (a) belong to a brand the current user, a team lead, is a member of, and (b) have no saved review yet. The queue MUST be ordered by `sent_at` descending (newest first). The queue MUST support filtering by brand, restricted to the brands the team lead leads.

#### Scenario: Queue shows only unreviewed replies from led brands, newest first
- **GIVEN** Marta leads brand A and brand B, and both have unreviewed replies with various `sent_at` timestamps
- **WHEN** Marta opens the queue
- **THEN** it lists only unreviewed replies from brand A and brand B, ordered by `sent_at` descending

#### Scenario: Reviewed replies do not appear in the queue
- **GIVEN** a reply in brand A already has a saved review
- **WHEN** Marta opens the queue
- **THEN** that reply does not appear

#### Scenario: Brand filter narrows the queue to one led brand
- **GIVEN** Marta leads brand A and brand B
- **WHEN** Marta filters the queue by brand A
- **THEN** only unreviewed replies from brand A are shown

#### Scenario: Empty queue
- **GIVEN** Marta leads brand A and brand A has no unreviewed replies
- **WHEN** Marta opens the queue filtered to brand A
- **THEN** the queue shows an empty state

### Requirement: Reviewing a reply requires a score, MAY include tags and a note
Saving a review MUST require a score from 1 to 5. It MAY include zero or more failure tags (multi-select) and a free-text note. The database MUST reject any score outside 1..5.

#### Scenario: Score is required to save
- **GIVEN** a team lead is reviewing a reply and has not selected a score
- **WHEN** the team lead attempts to save
- **THEN** the save is blocked until a score from 1 to 5 is selected

#### Scenario: Tags and note are optional
- **GIVEN** a team lead has selected a score of 4 and no tags or note
- **WHEN** the team lead confirms and saves
- **THEN** the review is saved with score 4, no tags, and no note

### Requirement: Saving a review requires an explicit confirmation step
Before a review is persisted, the UI MUST show an inline summary of the score, tags, and note, with "Back" and "Confirm" actions, and MUST state that the review cannot be edited after saving. The review MUST NOT be persisted until "Confirm" is chosen.

#### Scenario: Confirmation step precedes save
- **GIVEN** a team lead has filled in a score, tags, and a note
- **WHEN** the team lead submits the form
- **THEN** an inline summary of score, tags, and note is shown with "Back" and "Confirm", stating the review cannot be edited
- **WHEN** the team lead chooses "Confirm"
- **THEN** the review is saved

#### Scenario: Back returns to the editable form without saving
- **GIVEN** the confirmation summary is showing
- **WHEN** the team lead chooses "Back"
- **THEN** the form returns to its editable state and no review is saved

### Requirement: Saving a review removes the reply from the queue
Once a review is saved for a reply, that reply MUST no longer appear in any team lead's unreviewed queue.

#### Scenario: Reply disappears from queue after review
- **GIVEN** a reply is in Marta's queue for brand A
- **WHEN** Marta reviews and saves that reply
- **THEN** the reply no longer appears in the queue

### Requirement: The review form offers global tags plus the reply's brand tags
The failure tags offered for a reply MUST be the global tags (no brand) plus the tags of that reply's brand, and no other brand's tags. The database MUST reject a review tag that is neither global nor from the reply's brand.

#### Scenario: Brand-specific tags appear only for their brand
- **GIVEN** a tag that belongs to brand A and a set of global tags
- **WHEN** a team lead reviews a reply from brand B
- **THEN** the form offers the global tags and brand B's tags, but not brand A's tag
