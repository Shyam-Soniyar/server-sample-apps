const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logging function
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  const logFile = path.join(logsDir, 'app.log');
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage.trim());
};

// Request logging middleware
app.use((req, res, next) => {
  logToFile(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Redis connection (optional - works without Redis too)
let redis = null;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const connectRedis = async () => {
  try {
    const Redis = require('ioredis');
    redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });

    redis.on('connect', () => {
      logToFile('Connected to Redis successfully');
    });

    redis.on('error', (err) => {
      logToFile(`Redis connection error: ${err.message}`);
      redis = null;
    });
  } catch (error) {
    logToFile(`Redis not available: ${error.message}`);
    redis = null;
  }
};

// Try to connect to Redis
connectRedis();

// ==================== ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: redis ? 'connected' : 'not connected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sample Node.js API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      info: 'GET /info',
      users: 'GET /users',
      createUser: 'POST /users',
      counter: 'GET /counter',
      incrementCounter: 'POST /counter/increment',
      logs: 'GET /logs'
    }
  });
});

// Server info endpoint
app.get('/info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    },
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// In-memory users storage (for demo without database)
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

// Get all users
app.get('/users', (req, res) => {
  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// Create a new user
app.post('/users', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email
  };

  users.push(newUser);
  logToFile(`New user created: ${name} (${email})`);

  res.status(201).json({
    success: true,
    data: newUser
  });
});

// Get a specific user
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// Counter endpoint (demonstrates Redis usage)
app.get('/counter', async (req, res) => {
  let count = 0;

  if (redis) {
    try {
      count = await redis.get('api_counter') || 0;
    } catch (error) {
      logToFile(`Redis error: ${error.message}`);
    }
  }

  res.json({
    success: true,
    counter: parseInt(count),
    storage: redis ? 'redis' : 'memory'
  });
});

// Increment counter
app.post('/counter/increment', async (req, res) => {
  let count = 0;

  if (redis) {
    try {
      count = await redis.incr('api_counter');
      logToFile(`Counter incremented to ${count} (Redis)`);
    } catch (error) {
      logToFile(`Redis error: ${error.message}`);
    }
  } else {
    count = 'Redis not available';
  }

  res.json({
    success: true,
    counter: count,
    storage: redis ? 'redis' : 'not available'
  });
});

// View recent logs
app.get('/logs', (req, res) => {
  const logFile = path.join(logsDir, 'app.log');

  try {
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      const lines = logs.split('\n').filter(line => line.trim());
      const recentLogs = lines.slice(-50); // Last 50 lines

      res.json({
        success: true,
        count: recentLogs.length,
        logs: recentLogs
      });
    } else {
      res.json({
        success: true,
        count: 0,
        logs: []
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to read logs'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logToFile(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  logToFile(`Server started on port ${PORT}`);
  console.log(`
  ========================================
   Sample Node.js API Server
  ========================================
   Status:  Running
   Port:    ${PORT}
   Health:  http://localhost:${PORT}/health
  ========================================

  TASK: Create a Dockerfile for this app!

  Requirements:
  - Use node:18-alpine as base image
  - Set WORKDIR to /app
  - Copy package*.json first
  - Run npm install
  - Copy all source files
  - Expose port ${PORT}
  - Use CMD to start the server
  ========================================
  `);
});
