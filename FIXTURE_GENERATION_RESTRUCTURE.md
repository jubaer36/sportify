# Fixture Generation System - Restructured

## Overview
The fixture generation system has been restructured to support a dynamic, round-by-round tournament format where the tournament type (Round Robin or Knockout) can be selected after each round completes.

## Key Changes

### 1. Team Count Upscaling
- The system now counts registered teams and upscales to the nearest power of 2
- Examples:
  - 36 teams → 64 teams (upscaled)
  - 10 teams → 16 teams (upscaled)
  - 50 teams → 64 teams (upscaled)

### 2. Dynamic Round Calculation
- Number of rounds = log₂(upscaled team count)
- Examples:
  - 32 teams → 5 rounds (2⁵ = 32)
  - 64 teams → 6 rounds (2⁶ = 64)
  - 128 teams → 7 rounds (2⁷ = 128)

### 3. Flexible Tournament Type Selection
- Each round can be either:
  - **Knockout**: Single elimination, winner advances
  - **Round Robin**: Every team plays every other team
- The type is selected when the round is about to start, not at fixture generation time
- After each round completes, the admin selects the type for the next round

## Workflow

### Step 1: Generate Initial Fixture Structure
```
POST /api/tournaments/{tournamentId}/fixture
```

**Process:**
1. Fetch the tournament
2. Fetch all registered teams for the tournament
3. Count teams and upscale to nearest power of 2
4. Calculate number of rounds using log₂
5. Create round entities in database (without type initially)
6. Return fixture structure with preview matches

**What happens:**
- All rounds are created in the database with `type = null`
- Only the first round shows preview matches (using registered teams)
- Subsequent rounds are empty until previous rounds complete

### Step 2: Select Round Type and Generate Matches
```
POST /api/tournaments/rounds/{roundId}/select-type
Body: { "type": "KNOCKOUT" | "ROUND_ROBIN" }
```

**Process:**
1. Admin selects the tournament type for the round
2. System fetches appropriate teams:
   - First round: All registered teams
   - Subsequent rounds: Winners from previous round
3. Generate matches based on selected type:
   - **Knockout**: Pair teams randomly (team₁ vs team₂)
   - **Round Robin**: Create matches for all possible pairs
4. Save matches to database

### Step 3: Play the Round
- Matches are played and results are recorded
- Winners are determined for each match
- System tracks match status (SCHEDULED → ONGOING → COMPLETED)

### Step 4: Check Round Completion
```
GET /api/tournaments/rounds/{roundId}/is-complete
```

**Returns:** `true` if all matches in the round are completed, `false` otherwise

### Step 5: Advance to Next Round
```
POST /api/tournaments/rounds/{roundId}/advance
Body: { "type": "KNOCKOUT" | "ROUND_ROBIN" }
```

**Process:**
1. Verify current round is complete
2. Select type for next round
3. Fetch winners from current round
4. Generate matches for next round with selected type
5. Continue until tournament completes

## API Endpoints

### 1. Generate Fixture Structure
**Endpoint:** `GET /api/tournaments/{tournamentId}/fixture`
**Auth:** Admin only
**Response:** Complete fixture structure with preview

### 2. Select Round Type
**Endpoint:** `POST /api/tournaments/rounds/{roundId}/select-type`
**Auth:** Admin only
**Body:**
```json
{
  "type": "KNOCKOUT"
}
```
**Response:** 200 OK on success

### 3. Check Round Completion
**Endpoint:** `GET /api/tournaments/rounds/{roundId}/is-complete`
**Auth:** Admin only
**Response:**
```json
true
```

### 4. Advance to Next Round
**Endpoint:** `POST /api/tournaments/rounds/{roundId}/advance`
**Auth:** Admin only
**Body:**
```json
{
  "type": "ROUND_ROBIN"
}
```
**Response:** 200 OK on success

### 5. Get Available Types
**Endpoint:** `GET /api/tournaments/rounds/available-types`
**Auth:** Admin only
**Response:**
```json
["KNOCKOUT", "ROUND_ROBIN"]
```

## Database Schema Changes

### Round Entity
- `type` field changed from `nullable = false` to `nullable = true`
- Allows rounds to be created without initially committing to a type

### Match Entity
- No changes required
- Matches are only created when round type is selected

## Example Tournament Flow

### Scenario: 36 Teams Registered

1. **Fixture Generation:**
   - 36 teams → upscale to 64 teams
   - log₂(64) = 6 rounds needed
   - Rounds created: Round 6, Round 5, Round 4, Round 3, Round 2, Round 1 (Final)

2. **Round 6 (First Round - Round of 64):**
   - Admin selects: ROUND_ROBIN
   - All 36 teams play each other in round-robin format
   - Total matches: 36 × 35 / 2 = 630 matches
   - Top 32 teams advance based on points/wins

3. **Round 5 (Round of 32):**
   - After Round 6 completes, admin selects: KNOCKOUT
   - 32 winners from Round 6 are paired
   - 16 matches created
   - 16 winners advance

4. **Round 4 (Round of 16):**
   - Admin selects: KNOCKOUT
   - 16 teams paired
   - 8 matches created
   - 8 winners advance

5. **Round 3 (Quarter-finals):**
   - Admin selects: ROUND_ROBIN
   - 8 teams play each other
   - Total matches: 8 × 7 / 2 = 28 matches
   - Top 4 advance

6. **Round 2 (Semi-finals):**
   - Admin selects: KNOCKOUT
   - 4 teams paired
   - 2 matches created
   - 2 winners advance

7. **Round 1 (Final):**
   - Admin selects: KNOCKOUT
   - 2 teams face off
   - 1 match created
   - Champion determined

## Benefits of New System

1. **Flexibility:** Tournament format can adapt based on tournament progress
2. **Dynamic Planning:** Admins can choose the best format for each stage
3. **Scalability:** Automatically handles any team count by upscaling
4. **Clear Structure:** Number of rounds is predetermined and clear
5. **Mixed Formats:** Combine round-robin and knockout in the same tournament

## Code Changes Summary

### TournamentService.java
- New method: `generateFixture()` - restructured with upscaling logic
- New method: `upscaleToNearestPowerOf2()` - upscale team count
- New method: `generateRoundStructure()` - create round without committing to type
- New method: `selectRoundTypeAndGenerateMatches()` - select type and create matches
- New method: `getTeamsForRound()` - get appropriate teams for round
- New method: `getWinnersFromRound()` - extract winners from completed round
- New method: `generateAndSaveKnockoutMatches()` - save knockout matches
- New method: `generateAndSaveRoundRobinMatches()` - save round-robin matches
- New method: `isRoundComplete()` - check if all matches finished
- New method: `advanceToNextRound()` - move to next round with type selection

### TournamentController.java
- Updated: `generateFixture()` - endpoint documentation
- New endpoint: `selectRoundType()` - POST /rounds/{roundId}/select-type
- New endpoint: `isRoundComplete()` - GET /rounds/{roundId}/is-complete
- New endpoint: `advanceToNextRound()` - POST /rounds/{roundId}/advance
- New endpoint: `getAvailableRoundTypes()` - GET /rounds/available-types
- New DTO: `RoundTypeSelection` - for type selection requests

### Round.java
- Changed: `type` field from `nullable = false` to `nullable = true`

### RoundRepository.java
- New method: `findByTournament_TournamentIdAndRoundValue()` - find specific round

## Migration Notes

If you have existing tournaments in the database:
1. Existing rounds with `type = null` need to be updated
2. Run a migration to set default types for existing rounds
3. Consider archiving old tournaments created with the previous system

## Future Enhancements

1. **Automatic Advancement:** Option to auto-advance when round completes
2. **Type Recommendations:** AI/algorithm suggests best type for next round
3. **Conditional Rules:** Set rules like "if >8 teams, use round-robin"
4. **Points System:** Better handling of round-robin points and rankings
5. **Bye Handling:** Improved handling of teams with byes in knockout rounds
