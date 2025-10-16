/* Socket.IO game server with AWS Bedrock integration */
const http = require("http");
const { Server } = require("socket.io");
const {
  generateQuestions,
  generateQuestionsFromDocument,
} = require("./bedrock-helper");

const PORT = Number(process.env.PORT || process.env.SOCKET_PORT || 4000);

/** @type {Record<string, any>} */
const sessions = {};

const PLAYER_AVATARS = ["🦊", "🐼", "🐸", "🐯", "🦄", "🐵", "🐶", "🐱"];

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
        questions: [], // Will be populated by Bedrock
      };
    }
    io.to(code).emit("session:update", { code, session: sessions[code] });
  });

  // NEW: Generate questions from a prompt
  socket.on(
    "session:generate-questions",
    async ({ code, prompt, questionCount }) => {
      try {
        const session = sessions[code];
        if (!session) {
          socket.emit("session:error", {
            code,
            error: "Session not found",
          });
          return;
        }

        if (session.gameStarted) {
          socket.emit("session:error", {
            code,
            error: "Cannot generate questions after game has started",
          });
          return;
        }

        // Notify that generation is in progress
        socket.emit("session:generating", { code });

        // Generate questions using Bedrock
        const questions = await generateQuestions(prompt, questionCount || 5);

        // Store questions in session
        session.questions = questions;

        // Broadcast update to all clients in the session
        io.to(code).emit("session:update", { code, session });
        socket.emit("session:questions-generated", {
          code,
          success: true,
          count: questions.length,
        });
      } catch (error) {
        console.error("Error in session:generate-questions:", error);
        socket.emit("session:error", {
          code,
          error: error.message,
        });
      }
    }
  );

  // NEW: Generate questions from document content
  socket.on(
    "session:generate-from-document",
    async ({ code, documentContent, questionCount }) => {
      try {
        const session = sessions[code];
        if (!session) {
          socket.emit("session:error", {
            code,
            error: "Session not found",
          });
          return;
        }

        if (session.gameStarted) {
          socket.emit("session:error", {
            code,
            error: "Cannot generate questions after game has started",
          });
          return;
        }

        // Notify that generation is in progress
        socket.emit("session:generating", { code });

        // Generate questions from document using Bedrock
        const questions = await generateQuestionsFromDocument(
          documentContent,
          questionCount || 5
        );

        // Store questions in session
        session.questions = questions;

        // Broadcast update to all clients in the session
        io.to(code).emit("session:update", { code, session });
        socket.emit("session:questions-generated", {
          code,
          success: true,
          count: questions.length,
        });
      } catch (error) {
        console.error("Error in session:generate-from-document:", error);
        socket.emit("session:error", {
          code,
          error: error.message,
        });
      }
    }
  );

  socket.on("session:join", ({ code, player }) => {
    const session = sessions[code];
    if (!session || session.gameStarted) return;
    const newPlayer = player || {
      id: generatePlayerId(),
      name: "Player",
      score: 0,
      hasAnswered: false,
    };
    if (!session.players.find((p) => p.id === newPlayer.id)) {
      session.players.push({
        ...newPlayer,
        score: newPlayer.score || 0,
        hasAnswered: false,
      });
    }
    io.to(code).emit("session:update", { code, session });
  });

  socket.on("session:start", ({ code }) => {
    const session = sessions[code];
    if (!session || session.players.length === 0) return;

    // Check if questions have been generated
    if (!session.questions || session.questions.length === 0) {
      socket.emit("session:error", {
        code,
        error: "No questions available. Please generate questions first.",
      });
      return;
    }

    // Assign random avatars to players without one
    session.players.forEach((p) => {
      if (!p.avatar) {
        const random =
          PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];
        p.avatar = random;
      }
    });
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

    // Scoring logic using generated questions
    const currentQuestion = session.questions[session.currentQuestion];
    if (currentQuestion && answerIndex === currentQuestion.correctAnswer) {
      const timeBonus = Math.max(
        0,
        300 - Math.floor((player.answerTime || 0) / 100)
      );
      player.score = (player.score || 0) + timeBonus;
    }
    io.to(code).emit("session:update", { code, session });
  });

  socket.on("session:next", ({ code }) => {
    const session = sessions[code];
    if (!session) return;
    session.players.forEach((p) => {
      p.hasAnswered = false;
      p.lastAnswer = undefined;
      p.answerTime = undefined;
    });
    session.currentQuestion += 1;
    session.timerStartTime = Date.now();

    // Use generated questions length
    const total = session.questions ? session.questions.length : 0;
    if (total && session.currentQuestion >= total) {
      session.gameEnded = true;
    }
    io.to(code).emit("session:update", { code, session });
  });

  socket.on("session:set-avatar", ({ code, playerId, avatar }) => {
    const session = sessions[code];
    if (!session || session.gameStarted) return;
    if (!PLAYER_AVATARS.includes(avatar)) return;
    const player = session.players.find((p) => p.id === playerId);
    if (!player) return;
    player.avatar = avatar;
    io.to(code).emit("session:update", { code, session });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[socket.io] listening on :${PORT}`);
});
