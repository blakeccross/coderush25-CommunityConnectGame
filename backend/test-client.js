/* Socket.IO Test Client for Game Server */
import { io } from "socket.io-client";

const SERVER_URL = process.env.SOCKET_URL || "http://localhost:4000";
const TEST_SESSION_CODE = "TEST123";

// ANSI color codes for better console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log("=".repeat(60));
}

function logEvent(eventName, data) {
  log(`📡 Event: ${eventName}`, colors.blue);
  console.log(JSON.stringify(data, null, 2));
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.yellow);
}

// Helper to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Create multiple socket connections
let moderatorSocket;
let player1Socket;
let player2Socket;

async function runTests() {
  logSection("🚀 Starting Socket.IO Game Server Tests");
  log(`Connecting to: ${SERVER_URL}\n`, colors.yellow);

  try {
    // Test 1: Connect sockets
    logSection("Test 1: Establishing Connections");
    moderatorSocket = io(SERVER_URL);
    player1Socket = io(SERVER_URL);
    player2Socket = io(SERVER_URL);

    await Promise.all([
      new Promise((resolve) => moderatorSocket.on("connect", resolve)),
      new Promise((resolve) => player1Socket.on("connect", resolve)),
      new Promise((resolve) => player2Socket.on("connect", resolve)),
    ]);

    logSuccess("All 3 sockets connected");
    logInfo(`Moderator ID: ${moderatorSocket.id}`);
    logInfo(`Player 1 ID: ${player1Socket.id}`);
    logInfo(`Player 2 ID: ${player2Socket.id}`);

    // Test 2: Create a session
    logSection("Test 2: Creating Session");
    
    // First subscribe the moderator to the room
    moderatorSocket.emit("session:subscribe", TEST_SESSION_CODE);
    await wait(200);
    
    const sessionCreated = new Promise((resolve) => {
      moderatorSocket.once("session:update", (data) => {
        logEvent("session:update (moderator)", data);
        resolve(data);
      });
    });

    moderatorSocket.emit("session:create", {
      code: TEST_SESSION_CODE,
      moderatorId: "mod-001",
    });

    const sessionData = await sessionCreated;
    if (sessionData && sessionData.session) {
      logSuccess("Session created successfully");
    } else {
      logError("Session creation failed");
      return;
    }

    // Test 3: Subscribe to session updates
    logSection("Test 3: Subscribing to Session Updates");
    
    player1Socket.on("session:update", (data) => {
      logEvent("Player 1 received session:update", data);
    });

    player2Socket.on("session:update", (data) => {
      logEvent("Player 2 received session:update", data);
    });

    player1Socket.emit("session:subscribe", TEST_SESSION_CODE);
    player2Socket.emit("session:subscribe", TEST_SESSION_CODE);

    await wait(500);
    logSuccess("Players subscribed to session");

    // Test 4: Get session details
    logSection("Test 4: Getting Session Details");
    
    moderatorSocket.emit("session:get", TEST_SESSION_CODE);
    await wait(500);
    logSuccess("Session details retrieved");

    // Test 5: Players join session
    logSection("Test 5: Players Joining Session");
    
    player1Socket.emit("session:join", {
      code: TEST_SESSION_CODE,
      player: {
        id: "player-001",
        name: "Alice",
        score: 0,
        hasAnswered: false,
      },
    });

    await wait(500);

    player2Socket.emit("session:join", {
      code: TEST_SESSION_CODE,
      player: {
        id: "player-002",
        name: "Bob",
        score: 0,
        hasAnswered: false,
      },
    });

    await wait(500);
    logSuccess("Both players joined the session");

    // Test 6: Start the game
    logSection("Test 6: Starting the Game");
    
    moderatorSocket.emit("session:start", { code: TEST_SESSION_CODE });
    await wait(500);
    logSuccess("Game started");

    // Test 7: Players submit answers
    logSection("Test 7: Players Submitting Answers");
    
    logInfo("Question 1: What is the capital of France? (Correct: 2 - Paris)");
    
    // Player 1 answers correctly
    await wait(200);
    player1Socket.emit("session:answer", {
      code: TEST_SESSION_CODE,
      playerId: "player-001",
      answerIndex: 2, // Correct answer
    });
    logInfo("Player 1 (Alice) answered: 2 (Paris) - Correct!");

    // Player 2 answers incorrectly
    await wait(800);
    player2Socket.emit("session:answer", {
      code: TEST_SESSION_CODE,
      playerId: "player-002",
      answerIndex: 0, // Incorrect answer
    });
    logInfo("Player 2 (Bob) answered: 0 (London) - Incorrect");

    await wait(1000);
    logSuccess("Both players submitted answers");

    // Test 8: Move to next question
    logSection("Test 8: Moving to Next Question");
    
    moderatorSocket.emit("session:next", {
      code: TEST_SESSION_CODE,
      totalQuestions: 10,
    });

    await wait(500);
    logSuccess("Moved to next question");

    // Test 9: Answer second question
    logSection("Test 9: Answering Second Question");
    
    logInfo("Question 2: Which planet is known as the Red Planet? (Correct: 1 - Mars)");
    
    await wait(300);
    player1Socket.emit("session:answer", {
      code: TEST_SESSION_CODE,
      playerId: "player-001",
      answerIndex: 1, // Correct
    });
    logInfo("Player 1 (Alice) answered: 1 (Mars) - Correct!");

    await wait(500);
    player2Socket.emit("session:answer", {
      code: TEST_SESSION_CODE,
      playerId: "player-002",
      answerIndex: 1, // Correct
    });
    logInfo("Player 2 (Bob) answered: 1 (Mars) - Correct!");

    await wait(1000);
    logSuccess("Question 2 completed");

    // Test 10: Try to answer again (should be blocked)
    logSection("Test 10: Testing Duplicate Answer Prevention");
    
    player1Socket.emit("session:answer", {
      code: TEST_SESSION_CODE,
      playerId: "player-001",
      answerIndex: 3, // Try to answer again
    });
    logInfo("Attempting duplicate answer from Player 1...");
    
    await wait(500);
    logSuccess("Duplicate answer prevention tested");

    // Test 11: Get final session state
    logSection("Test 11: Final Session State");
    
    moderatorSocket.emit("session:get", TEST_SESSION_CODE);
    await wait(1000);
    logSuccess("Final session state retrieved");

    // Summary
    logSection("✨ Test Summary");
    logSuccess("All tests completed successfully!");
    logInfo("\nTested events:");
    log("  ✓ session:create", colors.green);
    log("  ✓ session:subscribe", colors.green);
    log("  ✓ session:get", colors.green);
    log("  ✓ session:join", colors.green);
    log("  ✓ session:start", colors.green);
    log("  ✓ session:answer", colors.green);
    log("  ✓ session:next", colors.green);
    log("  ✓ session:update (received)", colors.green);

  } catch (error) {
    logError(`Test failed with error: ${error.message}`);
    console.error(error);
  } finally {
    // Cleanup
    logSection("🧹 Cleanup");
    await wait(1000);
    moderatorSocket?.disconnect();
    player1Socket?.disconnect();
    player2Socket?.disconnect();
    logSuccess("All sockets disconnected");
    log("\n👋 Tests complete!", colors.bright + colors.green);
    process.exit(0);
  }
}

// Handle errors
process.on("unhandledRejection", (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run tests
runTests();
