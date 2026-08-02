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
import axios from 'axios';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);

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

let lastWakeupTime = 0;

const mlHealthHandler = async (req, res) => {
  const serviceId = process.env.ML_SERVICE_ID;
  const deployKey = process.env.RENDER_DEPLOY_KEY;
  const action = req.query.action;

  if (action === 'wakeup') {
    lastWakeupTime = Date.now();
    console.log(`[ML_WAKEUP] Trigger requested. Service ID: ${serviceId || 'MISSING'}, Deploy Key: ${deployKey ? '***' + deployKey.slice(-4) : 'MISSING'}`);
    
    if (serviceId && deployKey) {
      axios.post(`https://api.render.com/deploy/${serviceId}?key=${deployKey}`)
        .then(response => {
          console.log('[ML_WAKEUP] Render deploy webhook triggered successfully. Status:', response.status);
        })
        .catch(err => {
          console.error('[ML_WAKEUP] Render deploy webhook failed:', err.response?.data || err.message);
        });
    } else {
      console.warn('[ML_WAKEUP] Cannot trigger Render deploy: serviceId or deployKey is missing in environment.');
    }
    return res.json({ status: 'orange', message: 'Waking up...' });
  }

  // Default: check health of ML microservice
  const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  let isAlive = false;
  try {
    await axios.get(`${mlUrl}/`, { timeout: 2000 });
    isAlive = true;
  } catch (err) {
    if (err.response) {
      isAlive = true;
    }
  }

  const timeSinceWakeup = Date.now() - lastWakeupTime;
  const isWakingWindow = timeSinceWakeup < 180000;
  
  // Local simulation check: if running locally or using placeholder keys, 
  // simulate that the ML service successfully boots up after 20 seconds.
  const isLocal = !deployKey || deployKey === 'abc123xyz456789';
  const shouldSimulateGreen = isLocal && lastWakeupTime > 0 && timeSinceWakeup > 20000 && timeSinceWakeup < 180000;

  console.log(`[ML_HEALTH] Checking health. Responsive: ${isAlive}, Waking up window active: ${isWakingWindow}, Simulated Green: ${shouldSimulateGreen}`);

  if (isAlive || shouldSimulateGreen) {
    return res.json({ status: 'green', message: `ML service active${shouldSimulateGreen ? ' (Simulated)' : ''}.` });
  }

  // If not alive, check if wake-up was triggered recently (within 3 minutes)
  if (isWakingWindow) {
    return res.json({ status: 'orange', message: 'ML service is waking up...' });
  }

  return res.json({ status: 'red', message: 'ML service is offline.' });
};

app.get('/ml-health', mlHealthHandler);
app.get('/api/ml-health', mlHealthHandler);

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
