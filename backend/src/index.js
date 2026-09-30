import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { isSupabaseConfigured } from './config/supabase.js';
import { isGeminiConfigured } from './config/gemini.js';
import { sendSuccess, sendError } from './utils/apiResponse.js';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow frontend dev server and standard origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-mode']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logger
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`);
  next();
});

// Health & System Status Endpoint
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      supabase: isSupabaseConfigured() ? 'connected' : 'in-memory-fallback',
      gemini_vision: isGeminiConfigured() ? 'active (gemini-2.0-flash)' : 'intelligent-simulation-active'
    }
  }, 'IDP System API is operating smoothly');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Handler
app.use((req, res) => {
  return sendError(res, `Endpoint ${req.method} ${req.originalUrl} not found`, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', err);
  const status = err.status || 500;
  return sendError(res, err.message || 'Internal server error', status);
});

// Start Server
app.listen(config.port, () => {
  logger.info(`====================================================`);
  logger.info(`🚀 CineForge IDP Server running on port ${config.port}`);
  logger.info(`📡 API Base URL: http://localhost:${config.port}/api`);
  logger.info(`✨ Gemini 2.0 Vision Status: ${isGeminiConfigured() ? 'Configured' : 'Demo Fallback Ready'}`);
  logger.info(`🗄️ Supabase Status: ${isSupabaseConfigured() ? 'Configured' : 'In-Memory Store Active'}`);
  logger.info(`====================================================`);
});
