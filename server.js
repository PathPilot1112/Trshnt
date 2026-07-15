import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import clueRoutes from './routes/clueRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import adminRoutes from './routes/adminRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import { seedDatabase } from './utils/seed.js';
import Team from './models/Team.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io); // make io accessible to controllers

connectDB().then(() => {
  seedDatabase();
});

app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});


// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/clues', clueRoutes);

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

const broadcastLiveSnapshots = async () => {
  try {
    const teams = await Team.find()
      .select("name score currentClueIndex status location timerStartedAt timerAccumulatedMs timerRunning")
      .lean();

    const withElapsed = teams.map((team) => {
      const base = team.timerAccumulatedMs || 0;
      const elapsedMs =
        team.timerRunning && team.timerStartedAt
          ? base + (Date.now() - new Date(team.timerStartedAt).getTime())
          : base;

      return {
        teamId: team._id,
        name: team.name,
        score: team.score,
        status: team.status,
        currentClueIndex: team.currentClueIndex,
        elapsedMs,
        timerRunning: team.timerRunning,
        timerStartedAt: team.timerStartedAt,
        timerAccumulatedMs: team.timerAccumulatedMs || 0,
        location: team.location,
      };
    });

    const leaderboard = [...withElapsed].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.currentClueIndex !== a.currentClueIndex) return b.currentClueIndex - a.currentClueIndex;
      return a.elapsedMs - b.elapsedMs;
    });

    io.emit('leaderboard:snapshot', leaderboard);
    io.emit('teams:snapshot', withElapsed);
  } catch (err) {
    console.error('Live snapshot broadcast failed:', err.message);
  }
};

setInterval(broadcastLiveSnapshots, 1000);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
