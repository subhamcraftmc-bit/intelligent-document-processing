import { Router } from 'express';
import { documentController } from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { upload, handleMulterErrors } from '../middleware/upload.js';
import { validateQuery } from '../middleware/validate.js';
import { DocumentQuerySchema } from '../schemas/documentSchemas.js';

const router = Router();

// Local file preview route (serves uploaded preview images/PDFs if stored locally)
router.get('/files/:filename', documentController.serveLocalFile);

// All document management routes require authentication
router.get('/', requireAuth, validateQuery(DocumentQuerySchema), documentController.getDocuments);
router.post('/upload', requireAuth, upload.fields([{ name: 'files', maxCount: 10 }, { name: 'file', maxCount: 10 }]), handleMulterErrors, documentController.uploadDocument);

// Document Comparison routes (must precede /:id)
router.post('/compare', requireAuth, documentController.compareDocuments);
router.get('/compare/export', requireAuth, documentController.exportComparison);

router.get('/:id', requireAuth, documentController.getDocumentById);
router.post('/:id/extract', requireAuth, documentController.extractDocument);
router.put('/:id/fields', requireAuth, documentController.updateDocumentFields);
router.get('/:id/export', requireAuth, documentController.exportDocument);
router.delete('/:id', requireAuth, documentController.deleteDocument);

export default router;
