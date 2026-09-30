import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { documentService } from '../services/documentService.js';
import { storageService } from '../services/storageService.js';
import { geminiService } from '../services/geminiService.js';
import { exportService } from '../services/exportService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const documentController = {
  /**
   * List documents with filtering, search, and pagination
   */
  async getDocuments(req, res) {
    try {
      const { page, limit, status, document_class, search, sortBy, sortOrder } = req.query;
      const result = await documentService.listDocuments({
        userId: req.user.id,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        status,
        documentClass: document_class,
        search,
        sortBy,
        sortOrder
      });

      return sendSuccess(res, result, 'Documents retrieved successfully');
    } catch (err) {
      logger.error('Error in getDocuments controller:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * Handle single or multi-file document upload & trigger Gemini extraction
   */
  async uploadDocument(req, res) {
    try {
      const files = req.files || (req.file ? [req.file] : []);
      if (!files || files.length === 0) {
        return sendError(res, 'No files were uploaded. Please attach a PDF, PNG, JPEG, or DOCX document.', 400);
      }

      const userId = req.user.id;
      const uploadedDocs = [];

      for (const file of files) {
        const fileId = uuidv4();
        
        // 1. Upload to Supabase Storage or local storage
        const { storagePath, fileUrl } = await storageService.uploadFile(
          userId,
          fileId,
          file.originalname,
          file.buffer,
          file.mimetype
        );

        // 2. Insert pending document in Database
        const docRecord = await documentService.createDocument({
          userId,
          fileName: file.originalname,
          fileUrl,
          storagePath,
          fileType: file.mimetype,
          fileSizeBytes: file.size
        });

        // 3. Multimodal Extraction via Gemini 2.0 Flash
        try {
          const extractionResult = await geminiService.extractDocumentData(
            file.buffer,
            file.mimetype,
            file.originalname
          );

          // 4. Save extracted data & fields
          const completedDoc = await documentService.saveExtraction(
            docRecord.id,
            userId,
            extractionResult
          );

          uploadedDocs.push(completedDoc);
        } catch (aiErr) {
          logger.error(`AI Extraction failed for ${file.originalname}:`, aiErr);
          
          // Mark document as failed
          await documentService.updateDocumentFields(docRecord.id, userId, {
            status: 'failed',
            notes: `AI Extraction error: ${aiErr.message}`
          });

          uploadedDocs.push(await documentService.getDocumentById(docRecord.id, userId));
        }
      }

      const message = uploadedDocs.length === 1
        ? `Document '${uploadedDocs[0].file_name}' processed successfully.`
        : `${uploadedDocs.length} documents processed successfully.`;

      return sendSuccess(res, {
        documents: uploadedDocs,
        total: uploadedDocs.length
      }, message, 201);
    } catch (err) {
      logger.error('Upload controller error:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * Get single document by ID
   */
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      const doc = await documentService.getDocumentById(id, req.user.id);

      if (!doc) {
        return sendError(res, 'Document not found or you do not have permission to view it.', 404);
      }

      return sendSuccess(res, doc, 'Document details retrieved');
    } catch (err) {
      logger.error('Error in getDocumentById controller:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * Re-trigger Gemini extraction for a document
   */
  async extractDocument(req, res) {
    try {
      const { id } = req.params;
      const doc = await documentService.getDocumentById(id, req.user.id);

      if (!doc) {
        return sendError(res, 'Document not found', 404);
      }

      let buffer = null;
      let mimeType = doc.file_type;

      // Try reading local file if available
      if (doc.storage_path) {
        const localPath = storageService.getLocalFilePath(doc.storage_path);
        if (localPath && fs.existsSync(localPath)) {
          buffer = fs.readFileSync(localPath);
        }
      }

      // If buffer not available locally, fetch from signed URL
      if (!buffer && doc.file_url) {
        try {
          const resp = await fetch(doc.file_url);
          const arrayBuf = await resp.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
        } catch (e) {
          logger.warn('Could not fetch buffer from file_url for re-extract:', e.message);
        }
      }

      // Fallback buffer if none retrieved
      if (!buffer) {
        buffer = Buffer.from(doc.file_name, 'utf-8');
      }

      const extractionResult = await geminiService.extractDocumentData(buffer, mimeType, doc.file_name);
      const updatedDoc = await documentService.saveExtraction(id, req.user.id, extractionResult);

      return sendSuccess(res, updatedDoc, 'Document re-extracted successfully');
    } catch (err) {
      logger.error('Error re-extracting document:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * Update fields (human correction) and mark as verified
   */
  async updateDocumentFields(req, res) {
    try {
      const { id } = req.params;
      const { fields, line_items, status, notes } = req.body;

      const updatedDoc = await documentService.updateDocumentFields(id, req.user.id, {
        fields,
        line_items,
        status: status || 'verified',
        notes
      });

      if (!updatedDoc) {
        return sendError(res, 'Document not found or access denied', 404);
      }

      return sendSuccess(res, updatedDoc, 'Document fields successfully updated');
    } catch (err) {
      logger.error('Error updating document fields:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * Export document structured data as CSV or JSON
   */
  async exportDocument(req, res) {
    try {
      const { id } = req.params;
      const format = (req.query.format || 'csv').toLowerCase();
      const doc = await documentService.getDocumentById(id, req.user.id);

      if (!doc) {
        return sendError(res, 'Document not found', 404);
      }

      // Log export action
      await documentService.logAudit({
        userId: req.user.id,
        action: 'DATA_EXPORTED',
        entityId: id,
        details: { format, file_name: doc.file_name }
      });

      const baseName = doc.file_name.replace(/\.[^/.]+$/, '');

      if (format === 'json') {
        const jsonContent = exportService.generateJson(doc);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${baseName}_extracted.json"`);
        return res.send(jsonContent);
      }

      // Default CSV
      const csvContent = exportService.generateCsv(doc);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_extracted.csv"`);
      return res.send(csvContent);
    } catch (err) {
      logger.error('Error exporting document:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * Delete Document
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const success = await documentService.deleteDocument(id, req.user.id);

      if (!success) {
        return sendError(res, 'Document not found or could not be deleted', 404);
      }

      return sendSuccess(res, null, 'Document deleted successfully');
    } catch (err) {
      logger.error('Error deleting document:', err);
      return sendError(res, err.message, 500);
    }
  },

  /**
   * Serve local file for previews when running offline or local fallback
   */
  async serveLocalFile(req, res) {
    try {
      const { filename } = req.params;
      const filePath = storageService.getLocalFilePath(filename);

      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
      }

      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

      res.setHeader('Content-Type', contentType);
      return fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      logger.error('Error serving local file:', err);
      return res.status(500).send('Error serving file');
    }
  }
};
