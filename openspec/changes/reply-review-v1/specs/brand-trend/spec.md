# Spec: brand-trend

## ADDED Requirements

### Requirement: Brand page is visible only to that brand's team leads
The brand trend page MUST be accessible only to team leads who are members of that brand. It MUST show the weekly average score trend, the most frequent failure tags, and `brand_actions` as markers on the trend.

#### Scenario: Team lead views her brand's trend
- **GIVEN** Marta leads brand A, which has reviews across several weeks
- **WHEN** Marta opens brand A's trend page
- **THEN** she sees the weekly average score trend, the most frequent failure tags, and `brand_actions` markers on the trend

#### Scenario: Team lead cannot view a brand she does not lead
- **GIVEN** Marta does not lead brand B
- **WHEN** Marta requests brand B's trend data directly via the API
- **THEN** the response contains no rows

### Requirement: Weekly trend shows the average score with the review count per week
Each week on the trend MUST show the average score for that week alongside the number of reviews (`n`) in that week, so a low-volume week is not read as a strong signal.

#### Scenario: Weekly point includes n
- **GIVEN** brand A has 2 reviews in one week and 20 in the next
- **WHEN** Marta views the trend
- **THEN** each week's point shows both the average score and its review count `n`

### Requirement: Recording a brand action requires being a team lead who is a member of that brand
The brand page MUST offer a minimal form (date, note, optional tag) to record a `brand_actions` entry, available only to that brand's team leads. The insert MUST be enforced server-side by RLS regardless of what the UI allows.

#### Scenario: Team lead records an action on her own brand
- **GIVEN** Marta leads brand A
- **WHEN** Marta submits the action form with a date and note for brand A
- **THEN** the action is saved and appears as a marker on brand A's trend

#### Scenario: Direct insert of an action for a brand not led by the user is denied
- **GIVEN** Marta does not lead brand B
- **WHEN** a direct API insert of a `brand_actions` row for brand B is attempted using Marta's session
- **THEN** the insert is denied

### Requirement: Brand with no reviews yet shows an empty trend
If a brand has no saved reviews, the trend page MUST show an empty state instead of a chart with no data.

#### Scenario: Empty trend for a brand with zero reviews
- **GIVEN** brand C has no saved reviews
- **WHEN** its team lead opens brand C's trend page
- **THEN** the page shows an empty state instead of a trend chart

### Requirement: Recurring failures compare the last four weeks with the four before
The brand page MUST list failure tags counted over the last four weeks, ordered by that count descending and then alphabetically, each shown next to its count for the previous four weeks.

#### Scenario: A tag that dropped after an action is visible as a drop
- **GIVEN** brand A has 9 reviews tagged `no_order_history` in the previous four weeks and 3 in the last four weeks
- **WHEN** Marta opens brand A's page
- **THEN** the tag shows 3 for the last four weeks next to 9 for the previous four weeks

### Requirement: Per-specialist breakdown within a brand
The brand page MUST show, for the last four weeks, one row per specialist with reviews in that brand: average score, review count `n`, and most frequent failure tag. It MUST include only that brand's reviews, even for specialists who also work in other brands.

#### Scenario: A shared specialist's row only counts this brand
- **GIVEN** a specialist works in brand A and in a brand Marta is not a member of
- **WHEN** Marta opens brand A's page
- **THEN** that specialist's row is computed only from brand A reviews
