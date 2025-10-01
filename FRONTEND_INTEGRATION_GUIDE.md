# Frontend Integration Guide - Fixture Generation

## Overview
This guide helps integrate the restructured fixture generation system into the admin dashboard.

## UI Flow

### 1. Tournament Creation Page
After creating a tournament and teams register, show:
```
[Generate Fixture] button
```

### 2. Fixture Generation Page
**Step 1: Generate Initial Structure**

Button: "Generate Fixture Structure"
```typescript
const generateFixture = async (tournamentId: number) => {
  const response = await fetch(`/api/tournaments/${tournamentId}/fixture`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const fixture = await response.json();
  // Display fixture structure
  displayFixture(fixture);
};
```

**Response Structure:**
```typescript
interface FixtureDTO {
  tournamentId: number;
  tournamentName: string;
  sportName: string;
  rounds: RoundFixtureDTO[];
}

interface RoundFixtureDTO {
  roundId: number;
  roundValue: number;
  roundName: string;
  type: 'KNOCKOUT' | 'ROUND_ROBIN' | null;
  matches: MatchDTO[];
}
```

### 3. Round Management Page

**Display:**
```
Tournament: Summer Basketball 2025
Teams Registered: 36
Upscaled to: 64
Total Rounds: 6

┌─────────────────────────────────────┐
│ Round 6 - Round of 64               │
│ Status: Not Started                 │
│ Type: Not Selected                  │
│                                     │
│ [Select Type] ▼                     │
│   ○ Knockout                        │
│   ○ Round Robin                     │
│                                     │
│ [Start Round]                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Round 5 - Round of 32               │
│ Status: Locked (Previous round not  │
│         complete)                   │
└─────────────────────────────────────┘
```

**Code:**
```typescript
const selectRoundType = async (roundId: number, type: 'KNOCKOUT' | 'ROUND_ROBIN') => {
  const response = await fetch(`/api/tournaments/rounds/${roundId}/select-type`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ type }),
  });
  
  if (response.ok) {
    // Type selected, matches generated
    // Redirect to matches page
    window.location.href = `/admin/rounds/${roundId}/matches`;
  }
};
```

### 4. Round Progress Page

**Display:**
```
Round 6 - Round of 64 (Knockout)

Match Status: 28/32 Completed

Match 1: Team A vs Team B - ✓ Completed (Winner: Team A)
Match 2: Team C vs Team D - ⏳ In Progress
Match 3: Team E vs Team F - ✓ Completed (Winner: Team E)
...

[Check if Round Complete]
[Advance to Next Round] (disabled until complete)
```

**Code:**
```typescript
const checkRoundComplete = async (roundId: number) => {
  const response = await fetch(`/api/tournaments/rounds/${roundId}/is-complete`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const isComplete = await response.json();
  return isComplete;
};

const advanceToNextRound = async (roundId: number, nextRoundType: 'KNOCKOUT' | 'ROUND_ROBIN') => {
  const response = await fetch(`/api/tournaments/rounds/${roundId}/advance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ type: nextRoundType }),
  });
  
  if (response.ok) {
    // Advanced to next round
    // Show success message and refresh
    alert('Advanced to next round successfully!');
    window.location.reload();
  }
};
```

### 5. Advance Round Modal

**Display:**
```
┌─────────────────────────────────────┐
│ Advance to Round 5                  │
│                                     │
│ Current: Round 6 (Knockout)         │
│ Winners: 32 teams                   │
│                                     │
│ Select type for Round 5:            │
│ ○ Knockout (16 matches)             │
│ ○ Round Robin (496 matches)         │
│                                     │
│ [Cancel]  [Advance Round]           │
└─────────────────────────────────────┘
```

## Complete React Component Example

```typescript
import React, { useState, useEffect } from 'react';

interface Tournament {
  tournamentId: number;
  name: string;
}

interface Round {
  roundId: number;
  roundValue: number;
  roundName: string;
  type: 'KNOCKOUT' | 'ROUND_ROBIN' | null;
  matchCount: number;
  completedMatches: number;
}

const FixtureGenerator: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'KNOCKOUT' | 'ROUND_ROBIN' | null>(null);

  useEffect(() => {
    generateFixture();
  }, []);

  const generateFixture = async () => {
    const response = await fetch(`/api/tournaments/${tournament.tournamentId}/fixture`);
    const fixture = await response.json();
    setRounds(fixture.rounds);
  };

  const selectType = async (roundId: number, type: 'KNOCKOUT' | 'ROUND_ROBIN') => {
    const response = await fetch(`/api/tournaments/rounds/${roundId}/select-type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });

    if (response.ok) {
      generateFixture(); // Refresh
    }
  };

  const checkComplete = async (roundId: number) => {
    const response = await fetch(`/api/tournaments/rounds/${roundId}/is-complete`);
    return await response.json();
  };

  const advance = async (roundId: number, nextType: 'KNOCKOUT' | 'ROUND_ROBIN') => {
    const response = await fetch(`/api/tournaments/rounds/${roundId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: nextType }),
    });

    if (response.ok) {
      generateFixture(); // Refresh
    }
  };

  return (
    <div className="fixture-generator">
      <h2>Tournament: {tournament.name}</h2>
      
      {rounds.map((round) => (
        <div key={round.roundId} className="round-card">
          <h3>{round.roundName}</h3>
          
          {!round.type ? (
            <div className="type-selector">
              <label>Select Type:</label>
              <select onChange={(e) => {
                const type = e.target.value as 'KNOCKOUT' | 'ROUND_ROBIN';
                selectType(round.roundId, type);
              }}>
                <option value="">Choose...</option>
                <option value="KNOCKOUT">Knockout</option>
                <option value="ROUND_ROBIN">Round Robin</option>
              </select>
            </div>
          ) : (
            <div className="round-info">
              <p>Type: {round.type}</p>
              <p>Progress: {round.completedMatches}/{round.matchCount} matches</p>
              
              {round.completedMatches === round.matchCount && (
                <button onClick={async () => {
                  const nextType = window.confirm('Next round: Knockout (OK) or Round Robin (Cancel)?')
                    ? 'KNOCKOUT'
                    : 'ROUND_ROBIN';
                  await advance(round.roundId, nextType);
                }}>
                  Advance to Next Round
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FixtureGenerator;
```

## API Quick Reference

| Endpoint | Method | Purpose | Body |
|----------|--------|---------|------|
| `/api/tournaments/{id}/fixture` | GET | Generate fixture structure | - |
| `/api/tournaments/rounds/{id}/select-type` | POST | Select round type | `{ "type": "KNOCKOUT" }` |
| `/api/tournaments/rounds/{id}/is-complete` | GET | Check if round done | - |
| `/api/tournaments/rounds/{id}/advance` | POST | Advance to next round | `{ "type": "ROUND_ROBIN" }` |
| `/api/tournaments/rounds/available-types` | GET | Get available types | - |

## CSS Styling Example

```css
.fixture-generator {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.round-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: white;
}

.round-card.locked {
  opacity: 0.6;
  pointer-events: none;
}

.round-card.active {
  border-color: #4CAF50;
}

.round-card.complete {
  border-color: #2196F3;
}

.type-selector {
  margin: 15px 0;
}

.type-selector select {
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
}

.advance-button {
  background: #4CAF50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.advance-button:hover {
  background: #45a049;
}

.advance-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

## Error Handling

```typescript
const handleApiError = (error: any) => {
  if (error.status === 400) {
    alert('Invalid request. Please check your input.');
  } else if (error.status === 403) {
    alert('You do not have permission to perform this action.');
  } else if (error.status === 404) {
    alert('Resource not found.');
  } else {
    alert('An error occurred. Please try again.');
  }
};

// Usage
try {
  await selectType(roundId, type);
} catch (error) {
  handleApiError(error);
}
```

## State Management (Redux/Context)

```typescript
// actions.ts
export const GENERATE_FIXTURE = 'GENERATE_FIXTURE';
export const SELECT_ROUND_TYPE = 'SELECT_ROUND_TYPE';
export const ADVANCE_ROUND = 'ADVANCE_ROUND';

export const generateFixtureAction = (tournamentId: number) => async (dispatch: any) => {
  const response = await fetch(`/api/tournaments/${tournamentId}/fixture`);
  const fixture = await response.json();
  
  dispatch({
    type: GENERATE_FIXTURE,
    payload: fixture,
  });
};

// reducer.ts
const initialState = {
  fixture: null,
  loading: false,
  error: null,
};

export const fixtureReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case GENERATE_FIXTURE:
      return {
        ...state,
        fixture: action.payload,
        loading: false,
      };
    // ... other cases
    default:
      return state;
  }
};
```

## Testing

```typescript
describe('Fixture Generation', () => {
  it('should generate fixture structure', async () => {
    const fixture = await generateFixture(1);
    expect(fixture.rounds).toHaveLength(6);
    expect(fixture.rounds[0].type).toBeNull();
  });

  it('should select round type', async () => {
    await selectRoundType(1, 'KNOCKOUT');
    const round = await getRound(1);
    expect(round.type).toBe('KNOCKOUT');
  });

  it('should check round completion', async () => {
    const isComplete = await checkRoundComplete(1);
    expect(isComplete).toBe(false);
  });
});
```
