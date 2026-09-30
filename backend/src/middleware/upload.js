import multer from 'multer';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../schemas/documentSchemas.js';
import { sendError } from '../utils/apiResponse.js';

// Use memory storage for direct access to buffer for Gemini multimodal processing & storage upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, PNG, JPEG, DOCX.`), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES // 10MB
  },
  fileFilter
});

export const handleMulterErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`, 400);
    }
    return sendError(res, `Upload error: ${err.message}`, 400);
  } else if (err) {
    return sendError(res, err.message, 400);
  }
  next();
};
