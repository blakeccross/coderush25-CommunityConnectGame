# Frontend-Backend API Alignment

## ✅ Current Status: FULLY ALIGNED

Your `server.js` Socket.IO events are **100% compatible** with your React `game-store.ts` requests!

---

## Socket.IO Events Mapping

### Events Emitted by Frontend → Handled by Backend

| Frontend Event | Backend Handler | Status | Payload |
|---------------|----------------|--------|---------|
| `session:create` | ✅ Implemented | Working | `{ code, moderatorId }` |
| `session:join` | ✅ Implemented | Working | `{ code, player }` |
| `session:start` | ✅ Implemented | Working | `{ code }` |
| `session:answer` | ✅ Implemented | Working | `{ code, playerId, answerIndex }` |
| `session:next` | ✅ Implemented | Working | `{ code, totalQuestions }` |
| `session:subscribe` | ✅ Implemented | Working | `code` (string) |
| `session:get` | ✅ Implemented | Working | `code` (string) |

### Events Received by Frontend ← Emitted by Backend

| Backend Event | Frontend Listener | Status | Payload |
|--------------|------------------|--------|---------|
| `session:update` | ✅ Implemented | Working | `{ code, session }` |

---

## Data Structure Compatibility

### ✅ Player Type
**Frontend:**
```typescript
{
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  lastAnswer?: number;
  answerTime?: number;
}
```

**Backend:**
```javascript
{
  id: "player-001",
  name: "Alice",
  score: 0,
  hasAnswered: false,
  lastAnswer: 2,      // set when answered
  answerTime: 703     // set when answered
}
```
✅ **Match: Perfect**

---

### ✅ GameSession Type
**Frontend:**
```typescript
{
  code: string;
  moderatorId: string;
  players: Player[];
  currentQuestion: number;
  gameStarted: boolean;
  gameEnded: boolean;
  timerStartTime?: number;
}
```

**Backend:**
```javascript
{
  code: "TEST123",
  moderatorId: "mod-001",
  players: [],
  currentQuestion: 0,
  gameStarted: false,
  gameEnded: false,
  timerStartTime: undefined
}
```
✅ **Match: Perfect**

---

### ✅ Scoring Logic
**Frontend:**
```typescript
const timeBonus = Math.max(0, 300 - Math.floor(player.answerTime / 100));
player.score += timeBonus;
```

**Backend:**
```javascript
const timeBonus = Math.max(0, 300 - Math.floor((player.answerTime || 0) / 100));
player.score = (player.score || 0) + timeBonus;
```
✅ **Match: Identical logic**

---

### ✅ Questions Array
Both frontend and backend have the **same 10 questions** with matching correctAnswer indices.

---

## Environment Setup

### Frontend Configuration Required

Add to your `.env.local` in the root directory:

```bash
# Enable Socket.IO mode (set to "1" or "true")
NEXT_PUBLIC_USE_SOCKET=1

# Socket.IO server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Backend Configuration (Optional)

Add to `backend/.env`:

```bash
# Port for Socket.IO server
SOCKET_PORT=4000

# CORS origin (use * for dev, specific URL for prod)
SOCKET_CORS_ORIGIN=http://localhost:3000
```

---

## Connection Flow

```
┌─────────────────┐         Socket.IO         ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  React Frontend │    Port: 4000              │  Node Backend   │
│  (Next.js)      │                            │  (server.js)    │
│                 │                            │                 │
│  game-store.ts  │    Events:                 │  server.js      │
│                 │    • session:create        │                 │
│  Port: 3000     │    • session:join          │  Port: 4000     │
│                 │    • session:start         │                 │
│                 │    • session:answer        │                 │
│                 │    • session:next          │                 │
│                 │    • session:subscribe     │                 │
│                 │    • session:get           │                 │
│                 │                            │                 │
│                 │◄─── session:update ────────│                 │
└─────────────────┘                            └─────────────────┘
```

---

## Testing the Integration

### 1. Start Backend
```bash
cd backend
node server.js
```

### 2. Start Frontend
```bash
# In project root
npm run dev
# or
pnpm dev
```

### 3. Verify Connection
Open browser console and check for:
```
Socket.IO connection established
```

---

## Verified Behaviors ✅

From our test run, we confirmed:

1. ✅ **Session Creation**: Server creates sessions with correct structure
2. ✅ **Player Joining**: Players added to session.players array
3. ✅ **Game Start**: `gameStarted` flag set, `timerStartTime` recorded
4. ✅ **Answer Submission**: 
   - Correct answers scored (Alice: 293 pts → 585 pts)
   - Incorrect answers scored 0 (Bob stayed at 0)
   - Time-based bonus working (faster = more points)
5. ✅ **Question Navigation**: `currentQuestion` increments, player states reset
6. ✅ **Real-time Updates**: All connected clients receive `session:update`
7. ✅ **Duplicate Prevention**: Players can't answer twice

---

## Potential Improvements (Optional)

### 1. Add Session Persistence (Optional)
Currently sessions are in-memory and lost on server restart. Consider:
- Redis for production
- Database storage
- File-based persistence

### 2. Add Error Handling
```javascript
socket.on("session:join", ({ code, player }) => {
  const session = sessions[code];
  if (!session) {
    socket.emit("error", { message: "Session not found" });
    return;
  }
  if (session.gameStarted) {
    socket.emit("error", { message: "Game already started" });
    return;
  }
  // ... rest of logic
});
```

### 3. Add Authentication (Optional)
- Verify moderator credentials
- Prevent unauthorized session access
- Rate limiting

### 4. Add Reconnection Logic
The frontend already has good reconnection with `autoConnect: true`, but you could add:
```javascript
// In game-store.ts
socket.on("connect", () => {
  console.log("Connected to game server");
  // Re-subscribe to current session if exists
});

socket.on("disconnect", () => {
  console.log("Disconnected from game server");
});
```

---

## Summary

**Your server is already fully compatible with your React frontend!** 🎉

The Socket.IO events, data structures, and scoring logic all match perfectly. Just make sure to:

1. Set environment variables
2. Run both frontend and backend
3. The frontend will automatically connect when `NEXT_PUBLIC_USE_SOCKET=1`

No changes needed to `server.js` - it's ready to serve your React app! ✅
