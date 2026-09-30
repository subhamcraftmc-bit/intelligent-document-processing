import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { isSupabaseConfigured } from './config/supabase.js';
import { isGeminiConfigured } from './config/gemini.js';
import { sendSuccess, sendError } from './utils/apiResponse.js';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import extractRoutes from './routes/extractRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

// Explicit allowed CORS origins
const allowedOrigins = [
  'https://intelligent-document-processing-three.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

if (config.clientUrl) {
  const cleanClient = config.clientUrl.trim().replace(/\/+$/, '');
  if (!allowedOrigins.includes(cleanClient)) {
    allowedOrigins.push(cleanClient);
  }
}

// CORS Middleware with dynamic origin validation
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, Postman, health monitors)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.some(allowed => origin === allowed);
    const isVercelPreview = origin.endsWith('.vercel.app');
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');

    if (isExplicitlyAllowed || isVercelPreview || isLocalhost || config.nodeEnv !== 'production') {
      return callback(null, true);
    }

    logger.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error(`Origin ${origin} is not permitted by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-mode', 'Accept', 'Origin']
}));

// Body Parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request Logger
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Health & System Status Endpoints (mounted at both /health and /api/health)
const healthHandler = (req, res) => {
  return sendSuccess(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
    services: {
      supabase: isSupabaseConfigured() ? 'connected' : 'in-memory-fallback',
      gemini_vision: isGeminiConfigured() ? 'active (gemini-2.0-flash)' : 'intelligent-simulation-active'
    }
  }, 'IDP System API is operating smoothly', 200);
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/extract', extractRoutes);
app.use('/extract', extractRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root greeting & status endpoint
app.get('/', (req, res) => {
  return sendSuccess(res, {
    app: 'Intelligent Document Processing API',
    status: 'online',
    version: '1.0.0',
    docs: {
      health: '/health',
      auth: '/api/auth',
      documents: '/api/documents',
      extract: '/api/extract',
      analytics: '/api/analytics'
    }
  }, 'CineForge IDP Backend is running', 200);
});

// 404 Handler - Returns clean structured JSON
app.use((req, res) => {
  return sendError(res, `Endpoint ${req.method} ${req.originalUrl} not found`, 404);
});

// Global Error Handler - Returns clean structured JSON
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', err);
  const status = err.status || (err.message?.includes('CORS') ? 403 : 500);
  return sendError(res, err.message || 'Internal server error', status);
});

// Start Server
app.listen(config.port, () => {
  logger.info(`====================================================`);
  logger.info(`🚀 CineForge IDP Server running on port ${config.port}`);
  logger.info(`📡 API Base URL: http://localhost:${config.port}/api`);
  logger.info(`🏥 Health Check: http://localhost:${config.port}/health`);
  logger.info(`🔍 Direct Extract: http://localhost:${config.port}/api/extract`);
  logger.info(`✨ Gemini 2.0 Vision Status: ${isGeminiConfigured() ? 'Configured' : 'Demo Fallback Ready'}`);
  logger.info(`🗄️ Supabase Status: ${isSupabaseConfigured() ? 'Configured' : 'In-Memory Store Active'}`);
  logger.info(`====================================================`);
});
