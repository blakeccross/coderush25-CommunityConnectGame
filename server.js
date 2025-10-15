/* Simple Socket.IO game server to mirror client game-store behavior */
const http = require("http");
const { Server } = require("socket.io");

const PORT = Number(process.env.PORT || process.env.SOCKET_PORT || 4000);

/** @type {Record<string, any>} */
const sessions = {};

// Questions copied to compute correctness and scoring on server
const QUESTIONS = [
  { id: 1, question: "What is the capital of France?", answers: ["London", "Berlin", "Paris", "Madrid"], correctAnswer: 2 },
  { id: 2, question: "Which planet is known as the Red Planet?", answers: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: 1 },
  { id: 3, question: "What is the largest ocean on Earth?", answers: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3 },
  { id: 4, question: "Who painted the Mona Lisa?", answers: ["Van Gogh", "Picasso", "Da Vinci", "Monet"], correctAnswer: 2 },
  { id: 5, question: "What is the smallest prime number?", answers: ["0", "1", "2", "3"], correctAnswer: 2 },
  { id: 6, question: "Which element has the chemical symbol 'O'?", answers: ["Gold", "Oxygen", "Silver", "Iron"], correctAnswer: 1 },
  { id: 7, question: "How many continents are there?", answers: ["5", "6", "7", "8"], correctAnswer: 2 },
  { id: 8, question: "What is the fastest land animal?", answers: ["Lion", "Cheetah", "Leopard", "Tiger"], correctAnswer: 1 },
  { id: 9, question: "Which country is home to the kangaroo?", answers: ["New Zealand", "Australia", "South Africa", "Brazil"], correctAnswer: 1 },
  { id: 10, question: "What is the largest mammal in the world?", answers: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"], correctAnswer: 1 },
];

function generatePlayerId() {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("session:subscribe", (code) => {
    socket.join(code);
    const session = sessions[code] || null;
    socket.emit("session:update", { code, session });
  });

  socket.on("session:get", (code) => {
    const session = sessions[code] || null;
    socket.emit("session:update", { code, session });
  });

  socket.on("session:create", ({ code, moderatorId }) => {
    if (!code) return;
    if (!sessions[code]) {
      sessions[code] = {
        code,
        moderatorId: moderatorId || generatePlayerId(),
        players: [],
        currentQuestion: 0,
        gameStarted: false,
        gameEnded: false,
        timerStartTime: undefined,
      };
    }
    io.to(code).emit("session:update", { code, session: sessions[code] });
  });

  socket.on("session:join", ({ code, player }) => {
    const session = sessions[code];
    if (!session || session.gameStarted) return;
    const newPlayer = player || { id: generatePlayerId(), name: "Player", score: 0, hasAnswered: false };
    if (!session.players.find((p) => p.id === newPlayer.id)) {
      session.players.push({ ...newPlayer, score: newPlayer.score || 0, hasAnswered: false });
    }
    io.to(code).emit("session:update", { code, session });
  });

  socket.on("session:start", ({ code }) => {
    const session = sessions[code];
    if (!session || session.players.length === 0) return;
    session.gameStarted = true;
    session.currentQuestion = 0;
    session.timerStartTime = Date.now();
    io.to(code).emit("session:update", { code, session });
  });

  socket.on("session:answer", ({ code, playerId, answerIndex }) => {
    const session = sessions[code];
    if (!session) return;
    const player = session.players.find((p) => p.id === playerId);
    if (!player || player.hasAnswered) return;
    player.hasAnswered = true;
    player.lastAnswer = answerIndex;
    player.answerTime = Date.now() - (session.timerStartTime || Date.now());
    // Scoring logic to match client
    const currentQuestion = QUESTIONS[session.currentQuestion];
    if (currentQuestion && answerIndex === currentQuestion.correctAnswer) {
      const timeBonus = Math.max(0, 300 - Math.floor((player.answerTime || 0) / 100));
      player.score = (player.score || 0) + timeBonus;
    }
    io.to(code).emit("session:update", { code, session });
  });

  socket.on("session:next", ({ code, totalQuestions }) => {
    const session = sessions[code];
    if (!session) return;
    session.players.forEach((p) => {
      p.hasAnswered = false;
      p.lastAnswer = undefined;
      p.answerTime = undefined;
    });
    session.currentQuestion += 1;
    session.timerStartTime = Date.now();
    const total = Array.isArray(QUESTIONS) ? QUESTIONS.length : typeof totalQuestions === "number" ? totalQuestions : 0;
    if (total && session.currentQuestion >= total) {
      session.gameEnded = true;
    }
    io.to(code).emit("session:update", { code, session });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[socket.io] listening on :${PORT}`);
});
