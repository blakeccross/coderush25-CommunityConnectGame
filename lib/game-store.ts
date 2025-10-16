// Game state management using localStorage and events for cross-tab communication

export type Player = {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  lastAnswer?: number;
  answerTime?: number;
  avatar?: string; // emoji or url for the player's avatar
};

export type PrayerRequest = {
  id: string;
  playerId: string;
  playerName: string;
  request: string;
  isAnonymous: boolean;
  timestamp: number;
};

export type Question = {
  id: number;
  question: string;
  answers: string[];
  correctAnswer: number;
};

export type GameSession = {
  code: string;
  moderatorId: string;
  players: Player[];
  currentQuestion: number;
  gameStarted: boolean;
  gameEnded: boolean;
  timerStartTime?: number;
  brand?: string;
  sessionType?: string;
  questions?: Question[];
  gameMode?: "ice-breaker" | "session-trivia" | "prayer-request";
  prayerRequests?: PrayerRequest[];
};

export type GameState = "lobby" | "playing" | "question-end" | "game-end";

// Sample questions
export const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    answers: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    answers: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: "What is the largest ocean on Earth?",
    answers: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctAnswer: 3,
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    answers: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
    correctAnswer: 2,
  },
  {
    id: 5,
    question: "What is the smallest prime number?",
    answers: ["0", "1", "2", "3"],
    correctAnswer: 2,
  },
  {
    id: 6,
    question: "Which element has the chemical symbol 'O'?",
    answers: ["Gold", "Oxygen", "Silver", "Iron"],
    correctAnswer: 1,
  },
  {
    id: 7,
    question: "How many continents are there?",
    answers: ["5", "6", "7", "8"],
    correctAnswer: 2,
  },
  {
    id: 8,
    question: "What is the fastest land animal?",
    answers: ["Lion", "Cheetah", "Leopard", "Tiger"],
    correctAnswer: 1,
  },
  {
    id: 9,
    question: "Which country is home to the kangaroo?",
    answers: ["New Zealand", "Australia", "South Africa", "Brazil"],
    correctAnswer: 1,
  },
  {
    id: 10,
    question: "What is the largest mammal in the world?",
    answers: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: 1,
  },
];

// Eight selectable avatar options (emojis keep UX simple without assets)
export const PLAYER_AVATARS: string[] = ["🦊", "🐼", "🐸", "🐯", "🦄", "🐵", "🐶", "🐱"];

const STORAGE_KEY = "trivia-sessions";
const USE_SOCKET = typeof window !== "undefined" && (process.env.NEXT_PUBLIC_USE_SOCKET === "1" || process.env.NEXT_PUBLIC_USE_SOCKET === "true");
const SOCKET_URL = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000" : "";

let socket: any = null;
function ensureSocket() {
  if (!USE_SOCKET || typeof window === "undefined") return null;
  if (socket) return socket;
  try {
    // Lazy import to avoid SSR issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const io = require("socket.io-client");
    // Allow polling fallback to avoid 502s behind some proxies
    socket = io(SOCKET_URL, { transports: ["websocket", "polling"], autoConnect: true });
    return socket;
  } catch {
    return null;
  }
}

// Get all sessions from localStorage
export function getAllSessions(): Record<string, GameSession> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

// Save all sessions to localStorage
function saveSessions(sessions: Record<string, GameSession>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  // Dispatch custom event for cross-tab communication
  window.dispatchEvent(new CustomEvent("game-update", { detail: sessions }));
}

// Generate random 4-letter code
export function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new session
export function createSession(brand?: string, sessionType?: string, gameMode?: "ice-breaker" | "session-trivia" | "prayer-request"): string {
  const code = generateCode();
  const sessions = getAllSessions();

  sessions[code] = {
    code,
    moderatorId: generatePlayerId(),
    players: [],
    currentQuestion: 0,
    gameStarted: false,
    gameEnded: false,
    brand,
    sessionType,
    gameMode,
    questions: gameMode === "session-trivia" ? [...QUESTIONS] : undefined, // Initialize with default questions only for trivia
    prayerRequests: gameMode === "prayer-request" ? [] : undefined,
  };

  saveSessions(sessions);

  // Mirror to server if enabled
  const s = ensureSocket();
  if (s) {
    s.emit("session:create", { code, moderatorId: sessions[code].moderatorId, brand, sessionType, gameMode });
  }
  return code;
}

// Generate unique player ID
export function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get session by code
export function getSession(code: string): GameSession | null {
  const sessions = getAllSessions();
  return sessions[code] || null;
}

// Get questions for a session
export function getSessionQuestions(code: string): Question[] {
  const session = getSession(code);
  return session?.questions || QUESTIONS;
}

// Update questions for a session
export function updateSessionQuestions(code: string, questions: Question[]): boolean {
  const sessions = getAllSessions();
  const session = sessions[code];

  if (!session || session.gameStarted) return false;

  session.questions = questions;
  saveSessions(sessions);

  const s = ensureSocket();
  if (s) {
    s.emit("session:update-questions", { code, questions });
  }
  return true;
}

// Join a session
export function joinSession(code: string, playerName: string): Player | null {
  const sessions = getAllSessions();
  let session = sessions[code];

  if (!session) {
    if (USE_SOCKET) {
      sessions[code] = {
        code,
        moderatorId: "",
        players: [],
        currentQuestion: 0,
        gameStarted: false,
        gameEnded: false,
      };
      session = sessions[code];
    } else {
      return null;
    }
  }
  if (session.gameStarted) return null;

  const player: Player = {
    id: generatePlayerId(),
    name: playerName,
    score: 0,
    hasAnswered: false,
    avatar: undefined,
  };

  session.players.push(player);
  saveSessions(sessions);

  const s = ensureSocket();
  if (s) {
    s.emit("session:join", { code, player });
  }

  return player;
}

// Set or change a player's avatar
export function setPlayerAvatar(code: string, playerId: string, avatar: string): boolean {
  const sessions = getAllSessions();
  const session = sessions[code];

  if (!session || session.gameStarted) return false;
  if (!PLAYER_AVATARS.includes(avatar)) return false;

  const player = session.players.find((p) => p.id === playerId);
  if (!player) return false;

  player.avatar = avatar;
  saveSessions(sessions);

  const s = ensureSocket();
  if (s) {
    s.emit("session:set-avatar", { code, playerId, avatar });
  }
  return true;
}

// Start the game
export function startGame(code: string): boolean {
  const sessions = getAllSessions();
  const session = sessions[code];

  if (!session || session.players.length === 0) return false;

  // Assign random avatars to players who haven't chosen one
  session.players.forEach((p) => {
    if (!p.avatar) {
      const random = PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];
      p.avatar = random;
    }
  });

  session.gameStarted = true;
  session.currentQuestion = 0;
  session.timerStartTime = Date.now();

  saveSessions(sessions);

  const s = ensureSocket();
  if (s) {
    s.emit("session:start", { code });
  }
  return true;
}

// Submit answer
export function submitAnswer(code: string, playerId: string, answerIndex: number): boolean {
  const sessions = getAllSessions();
  const session = sessions[code];

  if (!session) return false;

  const player = session.players.find((p) => p.id === playerId);
  if (!player || player.hasAnswered) return false;

  player.hasAnswered = true;
  player.lastAnswer = answerIndex;
  player.answerTime = Date.now() - (session.timerStartTime || Date.now());

  // Calculate score based on time (max 300 points)
  const sessionQuestions = session.questions || QUESTIONS;
  const currentQuestion = sessionQuestions[session.currentQuestion];
  if (answerIndex === currentQuestion.correctAnswer) {
    const timeBonus = Math.max(0, 300 - Math.floor(player.answerTime / 100));
    player.score += timeBonus;
  }

  saveSessions(sessions);

  const s = ensureSocket();
  if (s) {
    s.emit("session:answer", { code, playerId, answerIndex });
  }
  return true;
}

// Move to next question
export function nextQuestion(code: string): boolean {
  const sessions = getAllSessions();
  const session = sessions[code];

  if (!session) return false;

  // Reset player answered status
  session.players.forEach((player) => {
    player.hasAnswered = false;
    player.lastAnswer = undefined;
    player.answerTime = undefined;
  });

  session.currentQuestion++;
  session.timerStartTime = Date.now();

  const sessionQuestions = session.questions || QUESTIONS;
  if (session.currentQuestion >= sessionQuestions.length) {
    session.gameEnded = true;
  }

  saveSessions(sessions);

  const s = ensureSocket();
  if (s) {
    s.emit("session:next", { code, totalQuestions: sessionQuestions.length });
  }
  return true;
}

// Submit a prayer request
export function submitPrayerRequest(code: string, playerId: string, playerName: string, request: string, isAnonymous: boolean): boolean {
  const sessions = getAllSessions();
  const session = sessions[code];

  if (!session || session.gameMode !== "prayer-request") return false;

  const player = session.players.find((p) => p.id === playerId);
  if (!player || player.hasAnswered) return false;

  const prayerRequest: PrayerRequest = {
    id: `prayer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    playerName,
    request,
    isAnonymous,
    timestamp: Date.now(),
  };

  if (!session.prayerRequests) {
    session.prayerRequests = [];
  }

  session.prayerRequests.push(prayerRequest);
  player.hasAnswered = true;

  saveSessions(sessions);

  const s = ensureSocket();
  if (s) {
    s.emit("session:prayer-request", { code, prayerRequest });
  }

  return true;
}

// Get all prayer requests for a session
export function getPrayerRequests(code: string): PrayerRequest[] {
  const session = getSession(code);
  return session?.prayerRequests || [];
}

// End the game session
export function endGame(code: string): boolean {
  const sessions = getAllSessions();
  const session = sessions[code];

  if (!session) return false;

  session.gameEnded = true;

  saveSessions(sessions);

  const s = ensureSocket();
  if (s) {
    s.emit("session:end", { code });
  }
  return true;
}

// Subscribe to session updates
export function subscribeToSession(code: string, callback: (session: GameSession | null) => void) {
  const handler = () => {
    const session = getSession(code);
    callback(session);
  };

  // Local updates
  window.addEventListener("game-update", handler);

  // Socket updates
  const s = ensureSocket();
  let socketHandlersAttached = false;
  if (s) {
    const onUpdate = (payload: { code: string; session: GameSession | null }) => {
      if (!payload || payload.code !== code) return;
      // Reconcile local cache with server state
      if (payload.session) {
        const sessions = getAllSessions();
        sessions[code] = payload.session;
        saveSessions(sessions);
      }
      callback(payload.session);
    };
    s.on("session:update", onUpdate);
    s.emit("session:subscribe", code);
    s.emit("session:get", code);
    socketHandlersAttached = true;
  }

  // Poll as a fallback regardless
  const interval = setInterval(handler, 1000);

  return () => {
    window.removeEventListener("game-update", handler);
    clearInterval(interval);
    if (s && socketHandlersAttached) {
      s.off("session:update");
    }
  };
}
