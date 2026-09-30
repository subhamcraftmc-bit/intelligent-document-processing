import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const FieldUpdateSchema = z.object({
  field_key: z.string().min(1, 'field_key is required'),
  field_value: z.string().nullable(),
  human_corrected: z.boolean().default(true)
});

export const BatchFieldUpdateSchema = z.object({
  fields: z.array(
    z.object({
      id: z.string().optional(),
      field_key: z.string().min(1),
      field_value: z.string().nullable(),
      human_corrected: z.boolean().default(true),
      confidence: z.number().optional()
    })
  ).optional(),
  line_items: z.array(
    z.object({
      description: z.string().optional(),
      quantity: z.number().optional(),
      unit_price: z.number().optional(),
      total: z.number().optional()
    })
  ).optional(),
  status: z.enum(['processing', 'needs_review', 'verified', 'failed']).optional(),
  notes: z.string().optional()
});

export const DocumentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['processing', 'needs_review', 'verified', 'failed', 'all']).optional(),
  document_class: z.enum(['Invoice', 'Receipt', 'Contract', 'Resume', 'IdentityProof', 'all']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'file_name', 'overall_confidence', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const AuthRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  full_name: z.string().optional()
});

export const AuthLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});
