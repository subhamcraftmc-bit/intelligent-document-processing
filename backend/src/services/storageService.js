import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const storageService = {
  /**
   * Upload file to Supabase Storage or local fallback directory
   */
  async uploadFile(userId, fileId, originalName, buffer, mimeType) {
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${fileId}-${sanitizedName}`;

    if (isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from('documents')
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (uploadError) {
          logger.error('Supabase storage upload error:', uploadError);
          throw uploadError;
        }

        // Generate signed URL valid for 24 hours (86400 seconds)
        const { data: signedData, error: signError } = await supabaseAdmin.storage
          .from('documents')
          .createSignedUrl(storagePath, 86400);

        if (signError) {
          logger.error('Failed to generate signed URL:', signError);
        }

        return {
          storagePath,
          fileUrl: signedData?.signedUrl || `/api/documents/files/${fileId}-${sanitizedName}`,
          isSupabase: true
        };
      } catch (err) {
        logger.warn('Falling back to local disk storage due to Supabase error:', err.message);
      }
    }

    // Local Disk Fallback
    const localFileName = `${fileId}-${sanitizedName}`;
    const localFilePath = path.join(UPLOADS_DIR, localFileName);
    fs.writeFileSync(localFilePath, buffer);

    return {
      storagePath: localFileName,
      fileUrl: `/api/documents/files/${localFileName}`,
      isSupabase: false
    };
  },

  /**
   * Generate fresh signed URL for document
   */
  async getSignedUrl(storagePath) {
    if (isSupabaseConfigured() && supabaseAdmin && storagePath && !storagePath.startsWith('local_')) {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from('documents')
          .createSignedUrl(storagePath, 86400);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (e) {
        logger.warn('Error refreshing signed URL from Supabase:', e.message);
      }
    }

    // Local file fallback
    const fileName = path.basename(storagePath);
    return `/api/documents/files/${fileName}`;
  },

  /**
   * Delete file from storage
   */
  async deleteFile(storagePath) {
    if (isSupabaseConfigured() && supabaseAdmin && storagePath && !storagePath.startsWith('local_')) {
      try {
        await supabaseAdmin.storage.from('documents').remove([storagePath]);
      } catch (err) {
        logger.error('Error deleting from Supabase storage:', err);
      }
    }

    const localFileName = path.basename(storagePath);
    const localFilePath = path.join(UPLOADS_DIR, localFileName);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        logger.error('Error deleting local file:', err);
      }
    }
  },

  /**
   * Retrieve local file stream or buffer
   */
  getLocalFilePath(fileName) {
    const sanitized = path.basename(fileName);
    const filePath = path.join(UPLOADS_DIR, sanitized);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }
};
