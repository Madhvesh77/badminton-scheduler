# 🏸 Badminton Match Scheduler

A full-stack TypeScript web application that automatically generates fair badminton match schedules with balanced rest distribution for singles and doubles matches across multiple courts.

## Features

- **Smart Scheduling Algorithm**: Uses greedy selection with heuristics to maximize match coverage and balance rest distribution
- **Flexible Match Types**: Supports both singles (1v1) and doubles (2v2) matches
- **Multi-Court Support**: Schedule matches across multiple courts simultaneously
- **Round Completion Tracking**: Mark rounds as completed with undo functionality
- **Fair Rest Distribution**: For odd-player scenarios, ensures no player rests significantly more than others
- **Export & Copy**: Download or copy schedules to share with players
- **Persistent Storage**: Schedules saved to JSON file with automatic reload

## Tech Stack

**Backend:**

- Node.js + Express
- TypeScript (strict mode)
- Jest for testing
- Simple JSON file persistence

**Frontend:**

- React 18
- TypeScript
- Vite
- Modern responsive CSS

## Algorithm Overview

The scheduler implements a sophisticated algorithm that:

1. **Generates all possible teams** based on match type (singles: individual players, doubles: all pairs)
2. **Creates all valid matches** (team combinations with no player overlap)
3. **Uses greedy selection with rarity heuristics**:
   - Prioritizes players appearing in fewer remaining matches
   - Balances rest counts to ensure fair rotation
4. **Guarantees round constraints**: No player appears in multiple matches within the same round
5. **Maximizes coverage**: Schedules all possible unique matches

**Time Complexity:** O(M × C × M) where M = matches, C = courts  
**Space Complexity:** O(M + N) where N = players

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm run start
```

The API server will run on `http://localhost:3001`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The UI will be available at `http://localhost:5173`

## Running Tests

### Backend Tests

```bash
cd backend
npm run test
```

Tests verify:

- No player appears twice in the same round
- All matches are unique (no duplicates)
- Rest distribution is balanced (max difference ≤ 1 for odd players)
- All possible matches are eventually scheduled

### Test Coverage

```bash
cd backend
npm run test -- --coverage
```

## API Documentation

### POST `/api/schedule`

Generate a new match schedule.

**Request Body:**

```json
{
  "players": ["Maru", "Madh", "Pri", "Shy", "Vasu", "Anish", "Suri"],
  "courts": 1,
  "matchType": "doubles"
}
```

**Response:**

```json
{
  "scheduleId": "sch_abc123",
  "rounds": [
    {
      "id": "r1",
      "matches": [
        {
          "id": "m1",
          "teamA": ["Maru", "Madh"],
          "teamB": ["Pri", "Shy"]
        }
      ],
      "resting": ["Vasu", "Anish", "Suri"],
      "completed": false
    }
  ],
  "warning": "large_n; fallback_to_greedy"
}
```

**Validation Rules:**

- Minimum 5 unique players required
- Minimum 1 court required
- matchType must be "singles" or "doubles"
- Duplicate player names are automatically deduplicated
- Empty player names are filtered out

**Status Codes:**

- `201` - Schedule created successfully
- `400` - Invalid request (validation error)
- `500` - Server error

### GET `/api/schedule/:scheduleId`

Retrieve an existing schedule.

**Response:**

```json
{
  "scheduleId": "sch_abc123",
  "rounds": [...],
  "players": ["Maru", "Madh", "Pri", "Shy", "Vasu", "Anish", "Suri"],
  "courts": 1,
  "matchType": "doubles"
}
```

**Status Codes:**

- `200` - Success
- `404` - Schedule not found
- `500` - Server error

### POST `/api/schedule/:scheduleId/round/:roundId/complete`

Toggle the completion status of a round (mark as complete or undo).

**Response:**

```json
{
  "scheduleId": "sch_abc123",
  "roundId": "r1",
  "completed": true
}
```

**Status Codes:**

- `200` - Success
- `404` - Schedule or round not found
- `500` - Server error

## Example Usage

### Using curl

#### Generate a schedule:

```bash
curl -X POST http://localhost:3001/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "players": ["A","B","C","D","E","F","G"],
    "courts": 1,
    "matchType": "doubles"
  }'
```

#### Get a schedule:

```bash
curl http://localhost:3001/api/schedule/sch_abc123
```

#### Mark a round complete:

```bash
curl -X POST http://localhost:3001/api/schedule/sch_abc123/round/r1/complete
```

## Example Schedule Output

For 7 players, 1 court, doubles:

```
Round 1
  Match 1: Maru + Madh vs Pri + Shy
  Resting: Vasu, Anish, Suri

Round 2
  Match 1: Vasu + Anish vs Maru + Pri
  Resting: Madh, Shy, Suri

Round 3
  Match 1: Shy + Suri vs Madh + Vasu
  Resting: Maru, Pri, Anish

... (continues until all unique matches are scheduled)
```

## Project Structure

```
badminton-scheduler/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server & API routes
│   │   ├── scheduler.ts      # Core scheduling algorithm
│   │   ├── store.ts          # Persistence layer
│   │   ├── types.ts          # TypeScript type definitions
│   │   └── tests/
│   │       └── scheduler.test.ts  # Jest test suite
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SchedulerForm.tsx   # Input form
│   │   │   └── ScheduleView.tsx    # Schedule display & management
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # React entry point
│   │   ├── api.ts            # Backend API client
│   │   ├── types.ts          # TypeScript types
│   │   └── styles.css        # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── README.md
```

## Design Decisions & Tradeoffs

### Algorithm Design

**Greedy with Rarity Heuristics:**

- **Why:** Maximizes match coverage while keeping complexity manageable for N ≤ 16
- **Tradeoff:** Not guaranteed optimal but provides excellent results in practice
- **Fallback:** For N > 16, uses pure greedy to avoid exponential runtime

**Rest Distribution Strategy:**

- Prioritizes players with higher rest counts when selecting matches
- Ensures fair rotation in odd-player scenarios
- Target: max rest difference ≤ 1 across all players

### Storage Design

**In-Memory + JSON File:**

- **Why:** Simple, no database setup required
- **Tradeoff:** Not suitable for production scale; perfect for demo/small groups
- **Future:** Could migrate to PostgreSQL/MongoDB for multi-user scenarios

### Frontend Architecture

**Component Structure:**

- Clean separation: Form (input) → App (state) → View (display)
- React hooks for state management (sufficient for single-page app)
- **Tradeoff:** No Redux/Context; works well for current scope

## Edge Cases Handled

1. **Duplicate Players:** Automatically deduplicated; error if < 5 remain
2. **Empty Player Names:** Filtered out during parsing
3. **More Courts Than Matches:** Extra courts ignored gracefully
4. **Large N (> 16):** Warning issued; switches to greedy-only algorithm
5. **Odd Player Count:** Rest distribution balanced via heuristics

## Testing Strategy

**Backend Tests (Jest):**

- Unit tests for scheduler algorithm
- Invariant validation (disjoint players, unique matches)
- Rest distribution balance verification
- Edge case coverage (min players, large N, etc.)

**Test Coverage Goals:**

- Scheduler logic: 100%
- API endpoints: Integration tests via supertest (expandable)
- Frontend: Basic component render tests (expandable with React Testing Library)

## Performance Considerations

**Current Limits:**

- Recommended: 5-16 players
- Tested: Up to 20 players with acceptable performance
- Large N handling: Automatic fallback to greedy-only mode

**Optimization Opportunities:**

- Memoize team/match generation for repeated schedules
- Web workers for client-side scheduling (move computation off main thread)
- Caching of common configurations

## Future Enhancements

- [ ] Multi-user support with authentication
- [ ] Real-time updates via WebSockets
- [ ] Tournament brackets for elimination rounds
- [ ] Player skill ratings for balanced team generation
- [ ] Email/SMS notifications for upcoming matches
- [ ] Progressive Web App (PWA) for offline support
- [ ] Advanced analytics (player participation stats, win/loss tracking)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for your badminton group!

## Assumptions & Notes

- Players are assumed to be always available for all rounds
- Match duration not factored into scheduling (time-agnostic)
- Court quality assumed equal (no court preference logic)
- Deterministic scheduling (same inputs → same output)
- Single session scheduling (not multi-day tournaments)

## Acknowledgments

Built with ❤️ for badminton enthusiasts who want to maximize court time and minimize scheduling headaches!

---

**Need Help?** Open an issue on GitHub or contact the maintainer.
