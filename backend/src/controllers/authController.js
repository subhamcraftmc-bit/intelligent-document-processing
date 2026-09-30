import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import { DEMO_USER } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const authController = {
  /**
   * User Registration
   */
  async register(req, res) {
    try {
      const { email, password, full_name } = req.body;

      if (isSupabaseConfigured() && supabaseClient) {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: full_name || email.split('@')[0] }
          }
        });

        if (error) {
          logger.warn('Supabase registration error:', error.message);
          return sendError(res, error.message, 400);
        }

        return sendSuccess(res, {
          user: data.user,
          session: data.session
        }, 'Registration successful. Please verify your email or sign in.', 201);
      }

      // Demo fallback response
      logger.info(`Demo mode: registered user ${email}`);
      return sendSuccess(res, {
        user: {
          id: DEMO_USER.id,
          email,
          full_name: full_name || email.split('@')[0],
          role: 'analyst'
        },
        token: 'demo-token'
      }, 'Registration successful (Demo Mode enabled)', 201);
    } catch (err) {
      logger.error('Registration exception:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * User Login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (isSupabaseConfigured() && supabaseClient) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          logger.warn('Supabase login failure:', error.message);
          return sendError(res, error.message, 401);
        }

        return sendSuccess(res, {
          user: data.user,
          session: data.session,
          token: data.session?.access_token
        }, 'Login successful');
      }

      // Demo fallback response
      logger.info(`Demo mode: logged in user ${email}`);
      return sendSuccess(res, {
        user: {
          ...DEMO_USER,
          email
        },
        token: 'demo-token'
      }, 'Login successful (Demo Mode)');
    } catch (err) {
      logger.error('Login exception:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * Get Current Authenticated User Profile
   */
  async getMe(req, res) {
    return sendSuccess(res, { user: req.user }, 'User profile retrieved');
  }
};
