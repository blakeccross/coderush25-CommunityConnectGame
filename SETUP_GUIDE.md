# 🎮 Full Stack Setup Guide

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
# In project root
npm install
# or
pnpm install
```

---

### 2. Configure Environment Variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
SOCKET_PORT=4000
SOCKET_CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`.env.local` in root):
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_USE_SOCKET=1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

### 3. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

Expected output:
```
[socket.io] listening on :4000
```

**Terminal 2 - Frontend:**
```bash
# In project root
npm run dev
# or
pnpm dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

---

### 4. Test the Integration

**Option A: Use the Application**
1. Open http://localhost:3000
2. Create a new game session
3. Open another browser/tab
4. Join the session with the code
5. Test real-time multiplayer!

**Option B: Use Test Client**
```bash
cd backend
npm test
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Your Application                       │
└──────────────────────────────────────────────────────────┘

┌─────────────────────┐                  ┌─────────────────┐
│   Next.js Frontend  │                  │  Node.js Server │
│   Port: 3000        │◄────Socket.IO───►│   Port: 4000    │
│                     │                  │                 │
│  • React Components │                  │  • Socket.IO    │
│  • game-store.ts    │                  │  • server.js    │
│  • UI/UX            │                  │  • Game Logic   │
└─────────────────────┘                  └─────────────────┘
```

---

## How It Works

### Without Socket.IO (NEXT_PUBLIC_USE_SOCKET=0)
- Game state stored in `localStorage`
- Only works in single browser
- No real-time multiplayer
- Good for development/testing

### With Socket.IO (NEXT_PUBLIC_USE_SOCKET=1)
- Game state synchronized via Socket.IO server
- Real-time multiplayer across devices
- Cross-browser/device support
- Production-ready

---

## Socket.IO Events Flow

### Creating a Game Session
```
Frontend                    Backend
   │                           │
   ├─ session:create ─────────►│
   │  { code, moderatorId }    │
   │                           ├─ Create session
   │                           ├─ Store in memory
   │◄──── session:update ──────┤
   │  { code, session }        │
```

### Player Joining
```
Frontend                    Backend
   │                           │
   ├─ session:subscribe ──────►│
   │  "ABCD"                   ├─ Join room "ABCD"
   │                           │
   ├─ session:join ───────────►│
   │  { code, player }         ├─ Add player
   │                           ├─ Broadcast to room
   │◄──── session:update ──────┤
   │  (to all in room)         │
```

### Answering Questions
```
Frontend                    Backend
   │                           │
   ├─ session:answer ─────────►│
   │  { code, playerId,        ├─ Calculate score
   │    answerIndex }          ├─ Update player
   │                           ├─ Broadcast to room
   │◄──── session:update ──────┤
   │  (updated scores)         │
```

---

## Troubleshooting

### Frontend can't connect to backend

**Check:**
1. Is backend running? (`node server.js` in backend/)
2. Are environment variables set correctly?
3. Is port 4000 available? (check with `lsof -i :4000`)
4. Check browser console for errors

**Solution:**
```bash
# Kill process on port 4000 if stuck
lsof -i :4000
kill -9 <PID>

# Restart backend
cd backend
node server.js
```

### Socket.IO not connecting

**Check browser console:**
```javascript
// Should see in console:
Socket.IO connection established
```

**Verify environment:**
```bash
# Check .env.local exists and has:
cat .env.local
# NEXT_PUBLIC_USE_SOCKET=1
# NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### CORS errors

**Update backend/.env:**
```
SOCKET_CORS_ORIGIN=http://localhost:3000
```

**Or in server.js:**
```javascript
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all (dev only)
    methods: ["GET", "POST"],
  },
});
```

### Sessions lost on server restart

**This is expected!** Sessions are stored in memory.

**Solutions:**
- For production: Add Redis or database
- For development: It's fine, just create new sessions

---

## Testing Checklist

- [ ] Backend starts on port 4000
- [ ] Frontend starts on port 3000
- [ ] Browser can access http://localhost:3000
- [ ] Socket.IO connects (check browser console)
- [ ] Can create a game session
- [ ] Can join session from another tab/browser
- [ ] Real-time updates work (see other players join)
- [ ] Can start game and see questions
- [ ] Answers are recorded and scored correctly
- [ ] Timer works
- [ ] Can navigate through questions
- [ ] Final scores display correctly

---

## Production Deployment

### Backend (Socket.IO Server)

**Deploy to:**
- Railway
- Render
- Fly.io
- AWS/Google Cloud/Azure

**Environment:**
```bash
SOCKET_PORT=4000
SOCKET_CORS_ORIGIN=https://yourdomain.com
```

### Frontend (Next.js)

**Deploy to:**
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify

**Environment:**
```bash
NEXT_PUBLIC_USE_SOCKET=1
NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
```

---

## Development Commands

```bash
# Start backend
cd backend && node server.js

# Start backend with auto-reload (install nodemon first)
cd backend && nodemon server.js

# Test backend
cd backend && npm test

# Start frontend
npm run dev

# Build frontend for production
npm run build

# Start production frontend
npm start
```

---

**You're all set! Your backend is ready to serve your React frontend.** 🚀
