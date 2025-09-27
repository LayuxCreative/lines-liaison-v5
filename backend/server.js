const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const fileRoutes = require('./routes/files');
const messageRoutes = require('./routes/messages');
const permissionGroupsRoutes = require('./routes/permission-groups');
const rolesRoutes = require('./routes/roles');
const notificationsRoutes = require('./routes/notifications');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100000, // 100k requests
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and auth endpoints in development
    if (process.env.NODE_ENV === 'development') {
      return req.path === '/api/health' || req.path === '/api/auth/me';
    }
    return false;
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Root endpoint - Server information
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Lines Liaison API Server',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      profiles: '/api/profiles',
      projects: '/api/projects',
      tasks: '/api/tasks',
      files: '/api/files'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Debug middleware for projects route
app.use('/api/projects', (req, res, next) => {
  console.log('=== PROJECTS ROUTE DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/permission-groups', permissionGroupsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      path: req.originalUrl
    }
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for: ${process.env.ALLOWED_ORIGINS}`);
});

module.exports = app;