import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import clueRoutes from './routes/clueRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import adminRoutes from './routes/adminRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io); // make io accessible to controllers

connectDB();

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

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});