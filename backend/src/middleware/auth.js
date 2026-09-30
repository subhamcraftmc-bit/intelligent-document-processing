import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

export const DEMO_USER = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'demo.analyst@cineforge.ai',
  full_name: 'Alex Mercer (Lead IDP Analyst)',
  role: 'admin'
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In demo mode or local testing, provide seamless fallback
      if (!isSupabaseConfigured() || req.headers['x-demo-mode'] === 'true') {
        req.user = DEMO_USER;
        return next();
      }
      return sendError(res, 'Authentication required. Missing Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];

    // If demo token or fallback mode
    if (token === 'demo-token' || token.startsWith('demo-')) {
      req.user = DEMO_USER;
      return next();
    }

    if (isSupabaseConfigured() && supabaseClient) {
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);

      if (error || !user) {
        logger.warn('Token validation failed in Supabase Auth:', error?.message);
        return sendError(res, 'Invalid or expired session token.', 401);
      }

      req.user = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: user.user_metadata?.role || 'analyst'
      };
      return next();
    } else {
      // Supabase is not configured, grant demo session
      req.user = DEMO_USER;
      return next();
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return sendError(res, 'Internal authentication error', 500);
  }
};
