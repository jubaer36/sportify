# Fixture Generator Implementation Guide

## Overview
The fixture generator automatically calculates the number of rounds based on team count and allows configuration of each round as either Knockout or Round Robin format.

## Key Features

### 1. Automatic Round Calculation
- **Formula**: `rounds = ceil(log2(teamCount))`
- **Examples**:
  - 50 teams → 6 rounds (bracket size: 64)
  - 32 teams → 5 rounds (bracket size: 32)
  - 16 teams → 4 rounds (bracket size: 16)
  - 8 teams → 3 rounds (bracket size: 8)

### 2. Team Progression
Each round reduces teams by half:
- **Round 1**: All participating teams
- **Round 2**: Winners from Round 1 (50% of previous round)
- **Round 3**: Winners from Round 2 (25% of original)
- And so on until the Final

### 3. Round Types
- **Knockout**: Elimination format - each team paired with another, loser is eliminated
- **Round Robin**: Each team plays every other team in the round

## Backend Implementation

### API Endpoints

#### 1. Get Teams by Tournament
```http
GET /api/teams/tournament/{tournamentId}
Authorization: Bearer <token>
```
Returns all teams participating in the tournament.

#### 2. Generate Fixture (Default)
```http
GET /api/tournaments/{tournamentId}/fixture
Authorization: Bearer <token>
```
Generates fixture with default Knockout format for all rounds.

#### 3. Generate Fixture (Custom Round Types)
```http
POST /api/tournaments/{tournamentId}/fixture
Authorization: Bearer <token>
Content-Type: application/json

[
  { "roundValue": 6, "type": "KNOCKOUT" },
  { "roundValue": 5, "type": "KNOCKOUT" },
  { "roundValue": 4, "type": "ROUND_ROBIN" },
  { "roundValue": 3, "type": "KNOCKOUT" },
  { "roundValue": 2, "type": "KNOCKOUT" },
  { "roundValue": 1, "type": "KNOCKOUT" }
]
```

### Backend Classes

#### FixtureDTO
```java
public class FixtureDTO {
    private Long tournamentId;
    private String tournamentName;
    private String sportName;
    private List<RoundFixtureDTO> rounds;
    
    public static class RoundFixtureDTO {
        private Long roundId;
        private Integer roundValue;
        private String roundName;
        private Round.TournamentType type;
        private List<MatchDTO> matches;
    }
}
```

#### TournamentService Methods
- `generateFixture(Long tournamentId)` - Default generation
- `generateFixtureWithRoundTypes(Long tournamentId, List<RoundTypeConfig> roundConfigs)` - Custom generation
- `generateKnockoutMatches(...)` - Creates knockout pairings
- `generateRoundRobinMatches(...)` - Creates round-robin matches

## Frontend Implementation

### Component: `/frontend/app/admin/fixture-generator/page.tsx`

#### State Management
```typescript
const [tournaments, setTournaments] = useState<Tournament[]>([]);
const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
const [teams, setTeams] = useState<Team[]>([]);
const [totalRounds, setTotalRounds] = useState(0);
const [roundConfigs, setRoundConfigs] = useState<RoundConfig[]>([]);
const [fixture, setFixture] = useState<Fixture | null>(null);
```

#### Key Functions

##### Calculate Rounds
```typescript
const calculateRounds = (teamCount: number): number => {
  if (teamCount <= 1) return 0;
  return Math.ceil(Math.log2(teamCount));
};
```

##### Get Teams in Round
```typescript
const getTeamsInRound = (roundNumber: number, totalTeams: number): number => {
  const totalRounds = calculateRounds(totalTeams);
  const teamsInRound = Math.pow(2, totalRounds - roundNumber + 1);
  return Math.min(teamsInRound, totalTeams);
};
```

##### Initialize Rounds
```typescript
const initializeRounds = (teamCount: number) => {
  const rounds = calculateRounds(teamCount);
  setTotalRounds(rounds);
  const configs: RoundConfig[] = [];
  for (let i = 1; i <= rounds; i++) {
    configs.push({ roundValue: rounds - i + 1, type: 'KNOCKOUT' });
  }
  setRoundConfigs(configs);
};
```

### UI Components

#### 1. Tournament Selection
- Dropdown to select tournament
- Auto-fetches teams when tournament is selected
- Auto-calculates rounds based on team count

#### 2. Tournament Information Panel
Displays:
- Total Teams
- Total Rounds
- Bracket Size (2^rounds)

#### 3. Round Configuration Panel
For each round:
- Round name (Final, Semi-final, Quarter-final, etc.)
- Team progression (e.g., "32 teams → 16 teams advance")
- Radio buttons to select Knockout or Round Robin

#### 4. Generate Fixture Button
- Sends round configurations to backend
- Displays generated fixture

#### 5. Save Fixture Button
- Saves rounds and matches to database
- Creates Round and Match entities

## Usage Flow

### For Administrators

1. **Navigate to Fixture Generator**
   - `/admin/fixture-generator`

2. **Select Tournament**
   - Choose from dropdown
   - System automatically:
     - Fetches participating teams
     - Calculates required rounds
     - Initializes round configurations

3. **Review Tournament Info**
   - Check total teams
   - Verify number of rounds
   - Note bracket size

4. **Configure Rounds** (Optional)
   - Each round defaults to Knockout
   - Change to Round Robin if desired
   - View team progression for each round

5. **Generate Fixture**
   - Click "Generate Fixture"
   - System creates matches based on configurations

6. **Review & Save**
   - Review generated matches
   - Click "Save Fixture" to persist to database

## Example: 50 Teams Tournament

### Calculations
- Teams: 50
- Rounds: ceil(log2(50)) = ceil(5.64) = 6
- Bracket Size: 2^6 = 64

### Round Progression
| Round | Name | Teams Start | Teams Advance |
|-------|------|-------------|---------------|
| 1 | Round of 64 | 50 | 25 |
| 2 | Round of 32 | 25 | 13 |
| 3 | Round of 16 | 13 | 7 |
| 4 | Quarter-final | 7 | 4 |
| 5 | Semi-final | 4 | 2 |
| 6 | Final | 2 | 1 |

### Match Generation

#### Knockout Format (Default)
- **Round 1**: 25 matches (50 teams → 25 winners)
- **Round 2**: 13 matches (25 teams → 13 winners, 1 bye)
- **Round 3**: 7 matches (13 teams → 7 winners, 1 bye)
- **Round 4**: 4 matches (7 teams → 4 winners, 1 bye)
- **Round 5**: 2 matches (4 teams → 2 winners)
- **Round 6**: 1 match (2 teams → 1 champion)

#### Round Robin Example (Round 4)
If Round 4 is set to Round Robin with 7 teams:
- Total matches: C(7,2) = 21 matches
- Each team plays every other team once
- Points determine who advances

## Authentication

All API requests require JWT Bearer token:
```typescript
const token = localStorage.getItem('token');
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## API Port
- Backend: `http://localhost:8090`
- All requests use this base URL

## Database Schema

### Round Entity
```java
@Entity
@Table(name = "rounds")
public class Round {
    private Long roundId;
    private Integer roundValue;
    private String roundName;
    private Tournament tournament;
    private TournamentType type; // KNOCKOUT or ROUND_ROBIN
    private List<Match> matches;
}
```

### Match Entity
```java
@Entity
@Table(name = "matches")
public class Match {
    private Long matchId;
    private Tournament tournament;
    private Sport sport;
    private Team team1;
    private Team team2;
    private LocalDateTime scheduledTime;
    private String venue;
    private MatchStatus status;
    private Team winnerTeam;
    private Round round;
}
```

## Future Enhancements

1. **Seeding System**: Rank teams and pair top seeds with lower seeds
2. **Bye Management**: Handle byes more intelligently in knockout rounds
3. **Schedule Generation**: Assign dates/times to matches
4. **Venue Assignment**: Automatically assign venues to matches
5. **Live Updates**: Real-time fixture updates as matches complete
6. **Export**: PDF/Excel export of fixtures
7. **Visualization**: Bracket visualization for knockout rounds

## Troubleshooting

### Issue: Teams not loading
- **Solution**: Check authentication token, verify tournament has teams assigned

### Issue: Incorrect round count
- **Solution**: Verify team count, check `calculateRounds` function

### Issue: Save fixture fails
- **Solution**: Ensure rounds are configured, check backend logs for errors

## Testing Checklist

- [ ] Tournament selection loads teams
- [ ] Round count calculated correctly for various team counts
- [ ] Team progression shows correct numbers
- [ ] Knockout format generates correct pairings
- [ ] Round Robin format generates all combinations
- [ ] Save fixture creates Round entities
- [ ] Save fixture creates Match entities
- [ ] Authentication required for all operations
- [ ] Error handling displays user-friendly messages
