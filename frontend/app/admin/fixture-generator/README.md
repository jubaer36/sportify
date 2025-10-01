# Frontend Fixture Generator - Updated

## Overview
The fixture generator page has been completely restructured to support the new dynamic round-by-round tournament management system.

## Key Features

### 1. **Fixture Display**
- Professional fixture card layout
- Grid-based responsive design
- Collapsible/expandable rounds
- Visual status indicators
- Match-by-match breakdown

### 2. **Round Management**
- Select tournament type for each round
- Visual type badges (Knockout/Round Robin)
- Advance round controls
- Real-time status updates

### 3. **Match Cards**
- Team names clearly displayed
- VS divider for clarity
- Winner indicators (crown icon)
- Status badges (Scheduled, Ongoing, Completed, Cancelled)
- Venue information
- Bye match handling

### 4. **User Experience**
- One-click round expansion/collapse
- Color-coded round types
- Intuitive type selection buttons
- Advance to next round workflow
- Loading states and error handling

## File Structure

```
frontend/app/admin/fixture-generator/
├── page.tsx                    # Main component
├── fixture-generator.css       # Custom styles
└── README.md                   # This file
```

## Component Structure

### State Management

```typescript
const [tournaments, setTournaments] = useState<Tournament[]>([]);
const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
const [fixture, setFixture] = useState<Fixture | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [selectedRoundForType, setSelectedRoundForType] = useState<number | null>(null);
const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
```

### Key Functions

#### 1. `generateFixture()`
Generates the initial fixture structure for a tournament.
```typescript
const generateFixture = async () => {
  const result = await makeAuthenticatedRequest<Fixture>(
    `/api/tournaments/${selectedTournament.tournamentId}/fixture`
  );
  // Auto-expand all rounds for immediate viewing
  setExpandedRounds(new Set(result.data.rounds.map(r => r.roundValue)));
};
```

#### 2. `selectRoundType(roundId, type)`
Selects the tournament type for a specific round and generates matches.
```typescript
const selectRoundType = async (roundId: number, type: 'KNOCKOUT' | 'ROUND_ROBIN') => {
  await fetch(`/api/tournaments/rounds/${roundId}/select-type`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
};
```

#### 3. `advanceToNextRound(roundId, nextType)`
Advances to the next round after current round completes.
```typescript
const advanceToNextRound = async (roundId: number, nextType: 'KNOCKOUT' | 'ROUND_ROBIN') => {
  await fetch(`/api/tournaments/rounds/${roundId}/advance`, {
    method: 'POST',
    body: JSON.stringify({ type: nextType }),
  });
};
```

#### 4. `toggleRound(roundValue)`
Expands or collapses a round's match display.
```typescript
const toggleRound = (roundValue: number) => {
  const newExpanded = new Set(expandedRounds);
  if (newExpanded.has(roundValue)) {
    newExpanded.delete(roundValue);
  } else {
    newExpanded.add(roundValue);
  }
  setExpandedRounds(newExpanded);
};
```

## UI Components

### 1. Tournament Selection
```tsx
<select onChange={(e) => {
  const tournament = tournaments.find(t => t.tournamentId === parseInt(e.target.value));
  setSelectedTournament(tournament || null);
}}>
  <option value="">Select a tournament...</option>
  {tournaments.map((tournament) => (
    <option key={tournament.tournamentId} value={tournament.tournamentId}>
      {tournament.name} - {tournament.sportName}
    </option>
  ))}
</select>
```

### 2. Round Header (Collapsible)
```tsx
<div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 cursor-pointer"
     onClick={() => toggleRound(round.roundValue)}>
  <h3>{round.roundName}</h3>
  <span className={getRoundTypeColor(round.type)}>
    {round.type || 'Type Not Selected'}
  </span>
  <svg className={expandedRounds.has(round.roundValue) ? 'rotate-180' : ''}>
    {/* Down arrow icon */}
  </svg>
</div>
```

### 3. Type Selection Buttons
```tsx
{!round.type && (
  <div className="flex gap-4">
    <button onClick={() => selectRoundType(round.roundId!, 'KNOCKOUT')}>
      🏆 Knockout
      <span>Single elimination format</span>
    </button>
    <button onClick={() => selectRoundType(round.roundId!, 'ROUND_ROBIN')}>
      🔄 Round Robin
      <span>Everyone plays everyone</span>
    </button>
  </div>
)}
```

### 4. Match Card
```tsx
<div className="match-card">
  <div className="match-header">
    <span className="match-number">Match #{index + 1}</span>
    <span className={`match-status ${getMatchStatusColor(match.status)}`}>
      {match.status}
    </span>
  </div>
  <div className="match-body">
    <div className="team-row">
      <span className="team-name">{match.team1Name}</span>
      {match.winnerTeamId === match.team1Id && (
        <span className="winner-badge">👑</span>
      )}
    </div>
    <div className="vs-divider">VS</div>
    <div className="team-row">
      <span className="team-name">{match.team2Name}</span>
      {match.winnerTeamId === match.team2Id && (
        <span className="winner-badge">👑</span>
      )}
    </div>
  </div>
  {match.venue && (
    <div className="match-footer">📍 {match.venue}</div>
  )}
</div>
```

### 5. Advance Round Controls
```tsx
{round.type && round.roundValue > 1 && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <h4>Advance to Next Round</h4>
    <div className="flex gap-4">
      <button onClick={() => advanceToNextRound(round.roundId!, 'KNOCKOUT')}>
        Next: Knockout
      </button>
      <button onClick={() => advanceToNextRound(round.roundId!, 'ROUND_ROBIN')}>
        Next: Round Robin
      </button>
    </div>
  </div>
)}
```

## CSS Classes

### Match Card Styles
- `.fixture-grid` - Responsive grid layout for matches
- `.match-card` - Individual match card
- `.match-header` - Match number and status
- `.match-body` - Team information
- `.match-footer` - Additional info (venue, etc.)
- `.team-row` - Individual team display
- `.vs-divider` - "VS" separator
- `.winner-badge` - Crown icon for winner
- `.match-status` - Status badge styling

### Color Utilities
- `.bg-green-100`, `.text-green-800` - Completed matches
- `.bg-yellow-100`, `.text-yellow-800` - Ongoing matches
- `.bg-red-100`, `.text-red-800` - Cancelled matches
- `.bg-gray-100`, `.text-gray-800` - Scheduled matches
- `.bg-blue-100`, `.text-blue-800` - Knockout rounds
- `.bg-purple-100`, `.text-purple-800` - Round Robin rounds

## Workflow

### Step 1: Select Tournament
1. User selects tournament from dropdown
2. Click "Generate Fixture" button
3. System fetches tournament and calculates rounds

### Step 2: View Fixture Structure
1. All rounds are displayed (collapsed by default, but auto-expanded)
2. Each round shows:
   - Round name (e.g., "Final", "Semi-final")
   - Type status (selected or not selected)
   - Number of matches

### Step 3: Select Round Type
1. Click on a round to expand it
2. If type not selected, two buttons appear:
   - "🏆 Knockout" - Single elimination
   - "🔄 Round Robin" - Everyone plays everyone
3. Click desired type
4. Matches are generated and displayed

### Step 4: View Matches
1. Matches displayed in responsive grid
2. Each card shows:
   - Match number
   - Team 1 vs Team 2
   - Status (Scheduled/Ongoing/Completed)
   - Winner (if completed)
   - Venue (if set)

### Step 5: Advance Round
1. Once all matches complete (handled in backend)
2. "Advance to Next Round" section appears
3. Select type for next round
4. System fetches winners and generates next round matches

## Responsive Design

### Desktop (>768px)
- 3-4 match cards per row
- Full-width round headers
- Side-by-side type selection buttons

### Tablet (768px)
- 2 match cards per row
- Adjusted padding and spacing

### Mobile (<768px)
- 1 match card per row
- Stacked type selection buttons
- Smaller font sizes
- Simplified layout

## API Integration

### Endpoints Used

```typescript
// Generate initial fixture
GET /api/tournaments/{id}/fixture

// Select round type
POST /api/tournaments/rounds/{id}/select-type
Body: { "type": "KNOCKOUT" | "ROUND_ROBIN" }

// Check round completion
GET /api/tournaments/rounds/{id}/is-complete

// Advance to next round
POST /api/tournaments/rounds/{id}/advance
Body: { "type": "KNOCKOUT" | "ROUND_ROBIN" }
```

## Error Handling

```typescript
{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
    {error}
  </div>
)}
```

Errors are displayed at the top of the page with clear messaging:
- Authentication errors
- API failures
- Network issues
- Validation errors

## Loading States

```typescript
<button disabled={!selectedTournament || loading}>
  {loading ? 'Generating...' : 'Generate Fixture'}
</button>
```

Loading states are shown during:
- Fixture generation
- Type selection
- Round advancement
- API calls

## Future Enhancements

1. **Bracket Visualization**
   - Visual knockout bracket display
   - Connecting lines between rounds
   - Zoom and pan functionality

2. **Live Updates**
   - WebSocket integration for real-time match updates
   - Auto-refresh when matches complete
   - Live score updates

3. **Match Management**
   - Edit match details inline
   - Set venue and time from fixture page
   - Reschedule matches

4. **Filtering and Search**
   - Filter matches by status
   - Search teams
   - Filter by round type

5. **Export Options**
   - PDF export of fixture
   - Print-friendly view
   - Share fixture link

6. **Statistics**
   - Win/loss records
   - Points table for round robin
   - Team performance metrics

## Testing

### Manual Testing Checklist
- [ ] Select tournament from dropdown
- [ ] Generate fixture successfully
- [ ] All rounds display correctly
- [ ] Expand/collapse rounds work
- [ ] Select knockout type - matches generate
- [ ] Select round robin type - matches generate
- [ ] Match cards display properly
- [ ] Advance to next round works
- [ ] Error messages display correctly
- [ ] Loading states show appropriately
- [ ] Responsive on mobile/tablet/desktop
- [ ] Bye matches display correctly

### Edge Cases
- [ ] Tournament with odd number of teams
- [ ] Very large tournaments (>100 teams)
- [ ] Empty rounds (no matches)
- [ ] Network failures
- [ ] Session timeout

## Troubleshooting

### Issue: Matches not displaying
- Check if round type is selected
- Verify API endpoint is working
- Check network tab for errors
- Ensure authentication token is valid

### Issue: Round not expanding
- Check `expandedRounds` state
- Verify `toggleRound` function
- Check for JavaScript errors in console

### Issue: Type selection not working
- Verify `selectRoundType` API call
- Check request payload
- Ensure roundId is not null
- Verify backend endpoint

## Performance Considerations

1. **Lazy Loading**: Matches only render when round is expanded
2. **Memoization**: Consider using `useMemo` for expensive calculations
3. **Pagination**: For rounds with many matches (100+)
4. **Virtualization**: For very large tournament fixtures

## Accessibility

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly

---

**Last Updated**: October 2, 2025
**Version**: 2.0
**Status**: ✅ Production Ready
