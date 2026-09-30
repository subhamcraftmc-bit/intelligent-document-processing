import { documentService } from '../services/documentService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const analyticsController = {
  /**
   * Get IDP System Analytics & Dashboard Metrics
   */
  async getAnalytics(req, res) {
    try {
      const data = await documentService.getAnalytics(req.user.id);
      return sendSuccess(res, data, 'Analytics data retrieved successfully');
    } catch (err) {
      logger.error('Error in getAnalytics controller:', err);
      return sendError(res, err.message, 500);
    }
  }
};
