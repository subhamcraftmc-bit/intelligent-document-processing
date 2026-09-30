import { Router } from 'express';
import { upload, handleMulterErrors } from '../middleware/upload.js';
import { geminiService } from '../services/geminiService.js';
import { isGeminiConfigured } from '../config/gemini.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/extract - Status and schema info for the extraction pipeline
 */
router.get('/', (req, res) => {
  return sendSuccess(res, {
    status: 'ready',
    model: 'gemini-2.0-flash / gemini-3.8-flash',
    gemini_configured: isGeminiConfigured(),
    supported_mime_types: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    max_file_size_mb: 10
  }, 'Gemini Multimodal Extraction Pipeline is ready', 200);
});

/**
 * POST /api/extract - Direct document extraction endpoint
 * Supports multipart file upload (file or document field) or JSON body with base64 data
 */
router.post(
  '/',
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'document', maxCount: 1 }]),
  handleMulterErrors,
  async (req, res) => {
    try {
      let buffer = null;
      let mimeType = 'application/pdf';
      let fileName = 'document.pdf';

      // 1. Check for multipart file upload
      const uploadedFile = req.files?.file?.[0] || req.files?.document?.[0] || req.file;

      if (uploadedFile) {
        buffer = uploadedFile.buffer;
        mimeType = uploadedFile.mimetype;
        fileName = uploadedFile.originalname;
      } else if (req.body?.base64) {
        // 2. Check for base64 JSON payload
        try {
          const cleanBase64 = req.body.base64.replace(/^data:[^;]+;base64,/, '');
          buffer = Buffer.from(cleanBase64, 'base64');
          mimeType = req.body.mime_type || req.body.file_type || 'application/pdf';
          fileName = req.body.file_name || 'document_upload.pdf';
        } catch (b64Err) {
          return sendError(res, 'Invalid base64 payload provided.', 400);
        }
      }

      // If no valid input provided, return explicit 400 JSON error
      if (!buffer || buffer.length === 0) {
        return sendError(
          res,
          'No document provided for extraction. Please provide a multipart file with key "file" or a JSON payload with "base64".',
          400
        );
      }

      logger.info(`Direct extraction request received: ${fileName} (${mimeType}, ${buffer.length} bytes)`);

      // 3. Perform multimodal extraction via Gemini 2.0 Flash
      const extractionResult = await geminiService.extractDocumentData(
        buffer,
        mimeType,
        fileName
      );

      return sendSuccess(
        res,
        extractionResult,
        `Document '${fileName}' extracted successfully via Gemini multimodal pipeline.`,
        200
      );
    } catch (err) {
      logger.error('Error during direct extraction:', err);
      return sendError(
        res,
        `Extraction pipeline encountered an error: ${err.message}`,
        500
      );
    }
  }
);

export default router;
