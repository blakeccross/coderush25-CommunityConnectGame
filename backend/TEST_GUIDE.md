# Testing Guide for Socket.IO Game Server

This guide explains how to test your Socket.IO game server using the included test client.

## Quick Start

### 1. Start the Server

In one terminal:
```bash
cd backend
node server.js
```

You should see:
```
[socket.io] listening on :4000
```

### 2. Run the Test Client

In another terminal:
```bash
cd backend
npm test
# or
node test-client.js
```

## What the Test Client Does

The test client simulates a complete game session with:

1. **3 Socket Connections**: Moderator + 2 Players
2. **Session Creation**: Creates a test session with code "TEST123"
3. **Player Subscription**: Players subscribe to session updates
4. **Player Joining**: Two players join the session (Alice and Bob)
5. **Game Start**: Moderator starts the game
6. **Answer Submission**: Players answer questions with different timing
7. **Question Navigation**: Moves through multiple questions
8. **Scoring**: Tests the scoring logic based on speed and correctness
9. **Edge Cases**: Tests duplicate answer prevention

## Test Output

You'll see colorful console output showing:
- 📡 Events being emitted and received
- ✅ Successful operations
- ❌ Any errors
- ℹ️  Information about what's happening

## All Tested Events

- ✓ `session:create` - Create a new game session
- ✓ `session:subscribe` - Subscribe to session updates
- ✓ `session:get` - Get current session state
- ✓ `session:join` - Player joins a session
- ✓ `session:start` - Start the game
- ✓ `session:answer` - Submit an answer
- ✓ `session:next` - Move to next question
- ✓ `session:update` - Receive session updates (broadcast)

## Customizing Tests

### Change Server URL
```bash
SOCKET_URL=http://localhost:3000 npm test
```

### Modify Test Session Code
Edit `test-client.js` and change:
```javascript
const TEST_SESSION_CODE = "TEST123";
```

### Add More Players
In `test-client.js`, create additional socket connections:
```javascript
const player3Socket = io(SERVER_URL);
```

### Test Different Scenarios
You can modify the test script to:
- Test with more questions
- Simulate network delays
- Test edge cases (invalid session codes, etc.)
- Test player disconnections

## Debugging

### Enable Socket.IO Debug Logs
```bash
DEBUG=socket.io* npm test
```

### Common Issues

**Connection Refused**
- Make sure the server is running on port 4000
- Check if another process is using the port

**Session Not Found**
- The server stores sessions in memory
- Sessions are lost when the server restarts
- Create a session before testing other operations

## Alternative Testing Tools

### 1. Socket.IO Admin UI
Install the admin UI for a web-based testing interface:
```bash
npm install @socket.io/admin-ui
```

### 2. Postman WebSocket Feature
- New Request → WebSocket
- Connect to: `ws://localhost:4000/socket.io/?EIO=4&transport=websocket`
- Note: This is more complex than using the test client

### 3. Browser Console
Open your browser's developer console and use:
```javascript
const socket = io('http://localhost:4000');
socket.emit('session:create', { code: 'TEST', moderatorId: 'mod1' });
socket.on('session:update', (data) => console.log(data));
```

## Next Steps

- Modify `test-client.js` to test your specific scenarios
- Add more comprehensive error handling tests
- Create integration tests with your frontend
- Add automated testing with a test framework (Jest, Mocha, etc.)

---

**Happy Testing! 🚀**
