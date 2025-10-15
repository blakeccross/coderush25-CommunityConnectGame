# Frontend-Backend Integration Map

## 📋 Complete Event Mapping

### Your React App (`lib/game-store.ts`) ↔️ Socket.IO Server (`backend/server.js`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SOCKET.IO EVENTS                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                              ┌─────────────────┐
│   REACT FRONTEND     │                              │  NODE BACKEND   │
│   (game-store.ts)    │                              │  (server.js)    │
└──────────────────────┘                              └─────────────────┘

─────────────────────────────────────────────────────────────────────────
1️⃣  CREATE SESSION
─────────────────────────────────────────────────────────────────────────

  createSession()
       │
       ├─ Emits: "session:create"
       │  Payload: { code: "ABCD", moderatorId: "player-123..." }
       │
       └────────────────────────►  Receives "session:create"
                                         │
                                         ├─ Creates session object
                                         ├─ Stores in sessions[code]
                                         │
                                         └─ Emits to room: "session:update"
       ◄────────────────────────    Payload: { code, session: {...} }
       │
       └─ Receives "session:update"
          Updates local cache
          Triggers callback

─────────────────────────────────────────────────────────────────────────
2️⃣  SUBSCRIBE TO SESSION
─────────────────────────────────────────────────────────────────────────

  subscribeToSession(code, callback)
       │
       ├─ Emits: "session:subscribe"
       │  Payload: "ABCD"
       │
       └────────────────────────►  Receives "session:subscribe"
                                         │
                                         ├─ socket.join(code)
                                         │
                                         └─ Emits: "session:update"
       ◄────────────────────────    Payload: { code, session }
       │
       └─ Receives update
          Callback triggered

─────────────────────────────────────────────────────────────────────────
3️⃣  GET SESSION
─────────────────────────────────────────────────────────────────────────

  getSession(code) via socket
       │
       ├─ Emits: "session:get"
       │  Payload: "ABCD"
       │
       └────────────────────────►  Receives "session:get"
                                         │
                                         ├─ Looks up sessions[code]
                                         │
                                         └─ Emits: "session:update"
       ◄────────────────────────    Payload: { code, session || null }
       │
       └─ Receives session data

─────────────────────────────────────────────────────────────────────────
4️⃣  PLAYER JOIN
─────────────────────────────────────────────────────────────────────────

  joinSession(code, playerName)
       │
       ├─ Creates player object
       ├─ Emits: "session:join"
       │  Payload: { 
       │    code: "ABCD",
       │    player: {
       │      id: "player-123...",
       │      name: "Alice",
       │      score: 0,
       │      hasAnswered: false
       │    }
       │  }
       │
       └────────────────────────►  Receives "session:join"
                                         │
                                         ├─ Validates session exists
                                         ├─ Checks game not started
                                         ├─ Adds player to session.players[]
                                         │
                                         └─ Broadcasts to room: "session:update"
       ◄────────────────────────    (ALL players in room receive this)
       │                             Payload: { code, session: {...} }
       └─ All players see new player

─────────────────────────────────────────────────────────────────────────
5️⃣  START GAME
─────────────────────────────────────────────────────────────────────────

  startGame(code)
       │
       ├─ Emits: "session:start"
       │  Payload: { code: "ABCD" }
       │
       └────────────────────────►  Receives "session:start"
                                         │
                                         ├─ Validates players.length > 0
                                         ├─ Sets gameStarted = true
                                         ├─ Sets currentQuestion = 0
                                         ├─ Sets timerStartTime = Date.now()
                                         │
                                         └─ Broadcasts: "session:update"
       ◄────────────────────────    Payload: {
       │                               code,
       │                               session: {
       └─ Game starts for all           gameStarted: true,
          players simultaneously         timerStartTime: 1760561100838,
                                         ...
                                       }
                                     }

─────────────────────────────────────────────────────────────────────────
6️⃣  SUBMIT ANSWER
─────────────────────────────────────────────────────────────────────────

  submitAnswer(code, playerId, answerIndex)
       │
       ├─ Emits: "session:answer"
       │  Payload: {
       │    code: "ABCD",
       │    playerId: "player-001",
       │    answerIndex: 2
       │  }
       │
       └────────────────────────►  Receives "session:answer"
                                         │
                                         ├─ Finds player by ID
                                         ├─ Checks !player.hasAnswered
                                         ├─ Sets player.hasAnswered = true
                                         ├─ Sets player.lastAnswer = 2
                                         ├─ Calculates answerTime
                                         │   = Date.now() - timerStartTime
                                         │
                                         ├─ SCORING LOGIC:
                                         │   if (answerIndex === correctAnswer) {
                                         │     timeBonus = max(0, 300 - floor(answerTime/100))
                                         │     player.score += timeBonus
                                         │   }
                                         │
                                         └─ Broadcasts: "session:update"
       ◄────────────────────────    Payload: {
       │                               code,
       │                               session: {
       └─ All players see scores       players: [
          update in real-time            {
                                           id: "player-001",
                                           score: 293,  ← Updated!
                                           hasAnswered: true,
                                           answerTime: 703
                                         }
                                       ]
                                     }
                                   }

─────────────────────────────────────────────────────────────────────────
7️⃣  NEXT QUESTION
─────────────────────────────────────────────────────────────────────────

  nextQuestion(code)
       │
       ├─ Emits: "session:next"
       │  Payload: {
       │    code: "ABCD",
       │    totalQuestions: 10
       │  }
       │
       └────────────────────────►  Receives "session:next"
                                         │
                                         ├─ Resets all players:
                                         │   hasAnswered = false
                                         │   lastAnswer = undefined
                                         │   answerTime = undefined
                                         │
                                         ├─ Increments currentQuestion++
                                         ├─ Resets timerStartTime = Date.now()
                                         │
                                         ├─ Checks if game ended:
                                         │   if (currentQuestion >= totalQuestions)
                                         │     gameEnded = true
                                         │
                                         └─ Broadcasts: "session:update"
       ◄────────────────────────    Payload: {
       │                               code,
       │                               session: {
       └─ All players advance           currentQuestion: 1,  ← Next!
          to next question              timerStartTime: 1760561103344,
          simultaneously                players: [
                                          { hasAnswered: false, ... },
                                          { hasAnswered: false, ... }
                                        ],
                                        gameEnded: false
                                      }
                                    }

─────────────────────────────────────────────────────────────────────────


┌─────────────────────────────────────────────────────────────────────┐
│                         DATA STRUCTURES                              │
└─────────────────────────────────────────────────────────────────────┘

Player Object (Frontend TypeScript):
{
  id: string;                    // "player-1234567890-abc123"
  name: string;                  // "Alice"
  score: number;                 // 293
  hasAnswered: boolean;          // true
  lastAnswer?: number;           // 2
  answerTime?: number;           // 703 (milliseconds)
}

GameSession Object (Frontend TypeScript):
{
  code: string;                  // "ABCD"
  moderatorId: string;           // "player-1234567890-xyz789"
  players: Player[];             // Array of players
  currentQuestion: number;       // 0-9 (index)
  gameStarted: boolean;          // true
  gameEnded: boolean;            // false
  timerStartTime?: number;       // 1760561100838 (timestamp)
}

Question Object:
{
  id: number;                    // 1
  question: string;              // "What is the capital of France?"
  answers: string[];             // ["London", "Berlin", "Paris", "Madrid"]
  correctAnswer: number;         // 2 (index of "Paris")
}


┌─────────────────────────────────────────────────────────────────────┐
│                         SCORING FORMULA                              │
└─────────────────────────────────────────────────────────────────────┘

Time-based scoring (faster = more points):

  timeBonus = max(0, 300 - floor(answerTime / 100))

Examples:
  - Answer in 0ms:    300 - 0 = 300 points  (max)
  - Answer in 1000ms: 300 - 10 = 290 points
  - Answer in 2000ms: 300 - 20 = 280 points
  - Answer in 30s+:   300 - 300 = 0 points  (min)
  - Wrong answer:     0 points (regardless of time)

