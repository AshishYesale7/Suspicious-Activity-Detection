<content>import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sendNotification } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ['websocket', 'polling']
});

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'Ashish',
  password: '1234'
};

app.use(express.json());

// Authentication endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit('connection_status', { connected: true });

  socket.on('analyze_frame', async (data) => {
    try {
      // For testing, generate mock detection with activity type
      const activityTypes = ['LOITERING', 'THEFT', 'VIOLENCE', 'TRESPASSING', 'VANDALISM', 'SUSPICIOUS_OBJECT'];
      const mockResult = {
        isSuspicious: Math.random() > 0.7,
        confidence: Math.random(),
        timestamp: Date.now(),
        activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        location: 'Main Entrance'
      };

      if (mockResult.isSuspicious) {
        await sendNotification(mockResult);
      }

      socket.emit('detection_result', mockResult);
    } catch (error) {
      console.error('Error analyzing frame:', error);
      socket.emit('error', { message: 'Analysis failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});</content>