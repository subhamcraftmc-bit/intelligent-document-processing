import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { storageService } from './storageService.js';
import { logger } from '../utils/logger.js';

// In-memory data store for local fallback/demo mode
const mockStore = {
  profiles: new Map([
    ['a0000000-0000-0000-0000-000000000001', {
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'demo.analyst@cineforge.ai',
      full_name: 'Alex Mercer (Lead IDP Analyst)',
      role: 'admin',
      created_at: new Date().toISOString()
    }]
  ]),
  documents: new Map(),
  extractions: new Map(),
  fields: new Map(),
  auditLogs: []
};

// Seed realistic initial documents into mockStore for instant rich dashboard presentation
const seedInitialData = () => {
  const userId = 'a0000000-0000-0000-0000-000000000001';

  // Seed 1: Invoice needing review
  const doc1Id = 'b1111111-1111-1111-1111-111111111111';
  mockStore.documents.set(doc1Id, {
    id: doc1Id,
    user_id: userId,
    file_name: 'Apex_Cloud_INV-2026-8841.pdf',
    file_url: 'https://images.unsplash.com/photo-1554415707-9e4c09d48d53?auto=format&fit=crop&w=1200&q=80',
    storage_path: 'demo/invoice_sample.pdf',
    file_type: 'application/pdf',
    file_size_bytes: 342190,
    document_class: 'Invoice',
    status: 'needs_review',
    overall_confidence: 0.88,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
  });

  mockStore.extractions.set(doc1Id, {
    id: uuidv4(),
    document_id: doc1Id,
    extracted_data: {
      document_class: 'Invoice',
      overall_confidence: 0.88,
      summary: 'Commercial cloud engineering services invoice from Apex Cloud Solutions.',
      line_items: [
        { description: 'Cloud Infrastructure Engineering & Migration', quantity: 20, unit_price: 150.00, total: 3000.00 },
        { description: 'Enterprise Gemini Vision Model Integration', quantity: 1, unit_price: 1000.00, total: 1000.00 },
        { description: 'Premium 24/7 SLA Maintenance & Monitoring', quantity: 1, unit_price: 250.00, total: 250.00 }
      ]
    },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  });

  const doc1Fields = [
    { key: 'vendor_name', val: 'Apex Cloud Solutions LLC', conf: 0.98, flag: false },
    { key: 'invoice_number', val: 'INV-2026-8841', conf: 0.96, flag: false },
    { key: 'invoice_date', val: '2026-09-28', conf: 0.95, flag: false },
    { key: 'due_date', val: '2026-10-28', conf: 0.92, flag: false },
    { key: 'subtotal_amount', val: '$4,250.00', conf: 0.94, flag: false },
    { key: 'tax_amount', val: '$382.50', conf: 0.90, flag: false },
    { key: 'total_amount', val: '$4,632.50', conf: 0.97, flag: false },
    { key: 'payment_terms', val: 'Net 30 (Direct Wire)', conf: 0.79, flag: true } // flagged!
  ];

  doc1Fields.forEach(f => {
    const fId = uuidv4();
    mockStore.fields.set(fId, {
      id: fId,
      document_id: doc1Id,
      field_key: f.key,
      field_value: f.val,
      confidence: f.conf,
      is_flagged: f.flag,
      human_corrected: false,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    });
  });

  // Seed 2: Verified Receipt
  const doc2Id = 'b2222222-2222-2222-2222-222222222222';
  mockStore.documents.set(doc2Id, {
    id: doc2Id,
    user_id: userId,
    file_name: 'Starbucks_Receipt_1042.jpg',
    file_url: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=1200&q=80',
    storage_path: 'demo/receipt_sample.jpg',
    file_type: 'image/jpeg',
    file_size_bytes: 182400,
    document_class: 'Receipt',
    status: 'verified',
    overall_confidence: 0.97,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 7).toISOString()
  });

  mockStore.extractions.set(doc2Id, {
    id: uuidv4(),
    document_id: doc2Id,
    extracted_data: {
      document_class: 'Receipt',
      overall_confidence: 0.97,
      summary: 'Retail beverage receipt from Starbucks Store #1042.',
      line_items: [
        { description: 'Grande Caramel Macchiato', quantity: 2, unit_price: 6.25, total: 12.50 },
        { description: 'Artisan Butter Croissant', quantity: 1, unit_price: 4.50, total: 4.50 }
      ]
    },
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  });

  const doc2Fields = [
    { key: 'merchant_name', val: 'Starbucks Coffee #1042', conf: 0.99, flag: false },
    { key: 'transaction_date', val: '2026-09-29', conf: 0.96, flag: false },
    { key: 'payment_method', val: 'Visa ending in 4022', conf: 0.95, flag: false },
    { key: 'subtotal', val: '$17.00', conf: 0.97, flag: false },
    { key: 'tax_amount', val: '$1.45', conf: 0.95, flag: false },
    { key: 'total_amount', val: '$18.45', conf: 0.98, flag: false }
  ];

  doc2Fields.forEach(f => {
    const fId = uuidv4();
    mockStore.fields.set(fId, {
      id: fId,
      document_id: doc2Id,
      field_key: f.key,
      field_value: f.val,
      confidence: f.conf,
      is_flagged: f.flag,
      human_corrected: false,
      created_at: new Date(Date.now() - 3600000 * 8).toISOString()
    });
  });

  // Seed 3: Contract
  const doc3Id = 'b3333333-3333-3333-3333-333333333333';
  mockStore.documents.set(doc3Id, {
    id: doc3Id,
    user_id: userId,
    file_name: 'Nexus_MSA_Agreement_2026.pdf',
    file_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    storage_path: 'demo/contract_sample.pdf',
    file_type: 'application/pdf',
    file_size_bytes: 894312,
    document_class: 'Contract',
    status: 'needs_review',
    overall_confidence: 0.84,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  });

  mockStore.extractions.set(doc3Id, {
    id: uuidv4(),
    document_id: doc3Id,
    extracted_data: {
      document_class: 'Contract',
      overall_confidence: 0.84,
      summary: 'Master Services Agreement & NDA between CineForge AI and Nexus Data.',
      line_items: []
    },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  });

  const doc3Fields = [
    { key: 'contract_title', val: 'Master Services Agreement & NDA', conf: 0.96, flag: false },
    { key: 'party_one', val: 'CineForge AI Corporation', conf: 0.97, flag: false },
    { key: 'party_two', val: 'Nexus Data Technologies Inc.', conf: 0.95, flag: false },
    { key: 'effective_date', val: '2026-10-01', conf: 0.94, flag: false },
    { key: 'termination_clause', val: '30 days written notice for convenience', conf: 0.82, flag: true },
    { key: 'governing_law', val: 'State of California, USA', conf: 0.91, flag: false },
    { key: 'liability_cap', val: '12 months cumulative fees paid', conf: 0.77, flag: true }
  ];

  doc3Fields.forEach(f => {
    const fId = uuidv4();
    mockStore.fields.set(fId, {
      id: fId,
      document_id: doc3Id,
      field_key: f.key,
      field_value: f.val,
      confidence: f.conf,
      is_flagged: f.flag,
      human_corrected: false,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    });
  });

  // Seed Audit Logs
  mockStore.auditLogs.push(
    {
      id: uuidv4(),
      user_id: userId,
      action: 'DOCUMENT_UPLOADED',
      entity_id: doc1Id,
      details: { file_name: 'Apex_Cloud_INV-2026-8841.pdf' },
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: uuidv4(),
      user_id: userId,
      action: 'AI_PROCESSED',
      entity_id: doc1Id,
      details: { document_class: 'Invoice', confidence: 0.88, flagged_fields: 1 },
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: uuidv4(),
      user_id: userId,
      action: 'DOCUMENT_VERIFIED',
      entity_id: doc2Id,
      details: { file_name: 'Starbucks_Receipt_1042.jpg', status: 'verified' },
      created_at: new Date(Date.now() - 3600000 * 7).toISOString()
    }
  );
};

seedInitialData();

export const documentService = {
  /**
   * Insert new document record
   */
  async createDocument({ userId, fileName, fileUrl, storagePath, fileType, fileSizeBytes }) {
    const id = uuidv4();
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('documents')
          .insert({
            id,
            user_id: userId,
            file_name: fileName,
            file_url: fileUrl,
            storage_path: storagePath,
            file_type: fileType,
            file_size_bytes: fileSizeBytes,
            status: 'processing',
            created_at: now,
            updated_at: now
          })
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
            logger.warn('Supabase table public.documents not found in cloud database yet. Falling back to local data store. Please run supabase/migrations/001_initial_schema.sql in your Supabase SQL editor.');
          } else {
            logger.error('Error inserting document to Supabase:', error);
            throw error;
          }
        } else {
          await this.logAudit({
            userId,
            action: 'DOCUMENT_UPLOADED',
            entityId: id,
            details: { fileName, fileType, fileSizeBytes }
          });

          return data;
        }
      } catch (err) {
        if (!err.message?.includes('schema cache')) {
          logger.warn('Supabase DB error, using resilient store:', err.message);
        }
      }
    }

    // Mock store
    const doc = {
      id,
      user_id: userId,
      file_name: fileName,
      file_url: fileUrl,
      storage_path: storagePath,
      file_type: fileType,
      file_size_bytes: fileSizeBytes,
      document_class: null,
      status: 'processing',
      overall_confidence: null,
      created_at: now,
      updated_at: now
    };

    mockStore.documents.set(id, doc);
    this.logAudit({
      userId,
      action: 'DOCUMENT_UPLOADED',
      entityId: id,
      details: { fileName, fileType, fileSizeBytes }
    });

    return doc;
  },

  /**
   * Save Gemini Extraction Results to Database
   */
  async saveExtraction(documentId, userId, extractionResult) {
    const now = new Date().toISOString();
    const { document_class, overall_confidence, status, fields, line_items, summary } = extractionResult;

    if (isSupabaseConfigured() && supabaseAdmin) {
      // 1. Update documents table
      const { error: docUpdateError } = await supabaseAdmin
        .from('documents')
        .update({
          document_class,
          overall_confidence,
          status,
          updated_at: now
        })
        .eq('id', documentId);

      if (docUpdateError) {
        logger.error('Error updating document status in Supabase:', docUpdateError);
      }

      // 2. Upsert document_extractions
      const { error: extractError } = await supabaseAdmin
        .from('document_extractions')
        .upsert({
          document_id: documentId,
          extracted_data: {
            document_class,
            overall_confidence,
            summary,
            line_items
          },
          updated_at: now
        }, { onConflict: 'document_id' });

      if (extractError) {
        logger.error('Error saving document extractions:', extractError);
      }

      // 3. Delete existing extraction_fields and insert new granular fields
      await supabaseAdmin.from('extraction_fields').delete().eq('document_id', documentId);

      const fieldRows = fields.map(f => ({
        id: uuidv4(),
        document_id: documentId,
        field_key: f.field_key,
        field_value: f.field_value,
        confidence: f.confidence,
        is_flagged: f.is_flagged,
        human_corrected: false,
        created_at: now
      }));

      if (fieldRows.length > 0) {
        const { error: fieldsError } = await supabaseAdmin
          .from('extraction_fields')
          .insert(fieldRows);

        if (fieldsError) {
          logger.error('Error inserting extraction fields:', fieldsError);
        }
      }

      await this.logAudit({
        userId,
        action: 'AI_PROCESSED',
        entityId: documentId,
        details: {
          document_class,
          overall_confidence,
          flagged_fields_count: fields.filter(f => f.is_flagged).length,
          total_fields: fields.length
        }
      });

      if (docUpdateError && (docUpdateError.code === 'PGRST205' || docUpdateError.message?.includes('schema cache'))) {
        logger.warn('Supabase documents table not found. Updating local store instead.');
      } else {
        return await this.getDocumentById(documentId, userId);
      }
    }

    // Mock Store update
    const doc = mockStore.documents.get(documentId);
    if (doc) {
      doc.document_class = document_class;
      doc.overall_confidence = overall_confidence;
      doc.status = status;
      doc.updated_at = now;
      mockStore.documents.set(documentId, doc);
    }

    mockStore.extractions.set(documentId, {
      id: uuidv4(),
      document_id: documentId,
      extracted_data: {
        document_class,
        overall_confidence,
        summary,
        line_items
      },
      created_at: now
    });

    // Remove old fields for this doc
    for (const [key, val] of mockStore.fields.entries()) {
      if (val.document_id === documentId) {
        mockStore.fields.delete(key);
      }
    }

    fields.forEach(f => {
      const fId = uuidv4();
      mockStore.fields.set(fId, {
        id: fId,
        document_id: documentId,
        field_key: f.field_key,
        field_value: f.field_value,
        confidence: f.confidence,
        is_flagged: f.is_flagged,
        human_corrected: false,
        created_at: now
      });
    });

    this.logAudit({
      userId,
      action: 'AI_PROCESSED',
      entityId: documentId,
      details: {
        document_class,
        overall_confidence,
        flagged_fields_count: fields.filter(f => f.is_flagged).length,
        total_fields: fields.length
      }
    });

    return this.getDocumentById(documentId, userId);
  },

  /**
   * List user's documents with pagination and filtering
   */
  async listDocuments({ userId, page = 1, limit = 10, status, documentClass, search, sortBy = 'created_at', sortOrder = 'desc' }) {
    if (isSupabaseConfigured() && supabaseAdmin) {
      let query = supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (documentClass && documentClass !== 'all') {
        query = query.eq('document_class', documentClass);
      }
      if (search) {
        query = query.ilike('file_name', `%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          // Fall through to mock store query
        } else {
          logger.error('Error fetching documents from Supabase:', error);
          throw error;
        }
      } else {
        return {
          documents: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        };
      }
    }

    // Mock store query
    let docs = Array.from(mockStore.documents.values());
    if (userId) {
      docs = docs.filter(d => d.user_id === userId);
    }

    if (status && status !== 'all') {
      docs = docs.filter(d => d.status === status);
    }
    if (documentClass && documentClass !== 'all') {
      docs = docs.filter(d => d.document_class === documentClass);
    }
    if (search) {
      const term = search.toLowerCase();
      docs = docs.filter(d => d.file_name.toLowerCase().includes(term));
    }

    docs.sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = docs.length;
    const startIndex = (page - 1) * limit;
    const paginatedDocs = docs.slice(startIndex, startIndex + limit);

    return {
      documents: paginatedDocs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Fetch single document with extracted data, fields, and audit trail
   */
  async getDocumentById(documentId, userId) {
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: doc, error: docError } = await supabaseAdmin
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (docError) {
        if (docError.code === 'PGRST205' || docError.message?.includes('schema cache')) {
          // Fall through to mock store
        } else {
          return null;
        }
      } else if (!doc) {
        return null;
      } else {

      // Refresh signed URL
      if (doc.storage_path) {
        doc.file_url = await storageService.getSignedUrl(doc.storage_path);
      }

      // Fetch extraction
      const { data: extraction } = await supabaseAdmin
        .from('document_extractions')
        .select('*')
        .eq('document_id', documentId)
        .single();

      // Fetch fields
      const { data: fields } = await supabaseAdmin
        .from('extraction_fields')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      // Fetch audit logs
      const { data: auditLogs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('entity_id', documentId)
        .order('created_at', { ascending: false });

        return {
          ...doc,
          extraction: extraction?.extracted_data || null,
          fields: fields || [],
          audit_logs: auditLogs || []
        };
      }
    }

    // Mock store retrieval
    const doc = mockStore.documents.get(documentId);
    if (!doc || doc.user_id !== userId) {
      return null;
    }

    const extraction = mockStore.extractions.get(documentId);
    const fields = Array.from(mockStore.fields.values())
      .filter(f => f.document_id === documentId);
    const auditLogs = mockStore.auditLogs
      .filter(a => a.entity_id === documentId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      ...doc,
      extraction: extraction?.extracted_data || null,
      fields,
      audit_logs: auditLogs
    };
  },

  /**
   * Human Corrections: Update fields and mark status as verified
   */
  async updateDocumentFields(documentId, userId, { fields = [], line_items, status, notes }) {
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && supabaseAdmin && !mockStore.documents.has(documentId)) {
      // 1. Update individual fields
      for (const field of fields) {
        const updatePayload = {
          field_value: field.field_value,
          human_corrected: true,
          is_flagged: false, // cleared on manual correction
          updated_at: now
        };

        if (field.id) {
          await supabaseAdmin
            .from('extraction_fields')
            .update(updatePayload)
            .eq('id', field.id)
            .eq('document_id', documentId);
        } else if (field.field_key) {
          await supabaseAdmin
            .from('extraction_fields')
            .update(updatePayload)
            .eq('field_key', field.field_key)
            .eq('document_id', documentId);
        }
      }

      // 2. Update line items in extractions if provided
      if (line_items) {
        const { data: currentExtraction } = await supabaseAdmin
          .from('document_extractions')
          .select('extracted_data')
          .eq('document_id', documentId)
          .single();

        if (currentExtraction) {
          const updatedExtractedData = {
            ...currentExtraction.extracted_data,
            line_items
          };
          await supabaseAdmin
            .from('document_extractions')
            .update({ extracted_data: updatedExtractedData, updated_at: now })
            .eq('document_id', documentId);
        }
      }

      // 3. Update document status
      const docUpdates = { updated_at: now };
      if (status) docUpdates.status = status;
      if (notes !== undefined) docUpdates.notes = notes;

      await supabaseAdmin
        .from('documents')
        .update(docUpdates)
        .eq('id', documentId);

      await this.logAudit({
        userId,
        action: status === 'verified' ? 'DOCUMENT_VERIFIED' : 'FIELD_CORRECTED',
        entityId: documentId,
        details: { fields_count: fields.length, status, notes }
      });

      return await this.getDocumentById(documentId, userId);
    }

    // Mock store updates
    const doc = mockStore.documents.get(documentId);
    if (!doc || doc.user_id !== userId) {
      return null;
    }

    if (status) doc.status = status;
    if (notes !== undefined) doc.notes = notes;
    doc.updated_at = now;
    mockStore.documents.set(documentId, doc);

    // Update fields
    fields.forEach(f => {
      let matched = null;
      if (f.id && mockStore.fields.has(f.id)) {
        matched = mockStore.fields.get(f.id);
      } else {
        matched = Array.from(mockStore.fields.values()).find(
          item => item.document_id === documentId && item.field_key === f.field_key
        );
      }

      if (matched) {
        matched.field_value = f.field_value;
        matched.human_corrected = true;
        matched.is_flagged = false;
        matched.updated_at = now;
        mockStore.fields.set(matched.id, matched);
      }
    });

    // Update line items in extraction
    if (line_items && mockStore.extractions.has(documentId)) {
      const ext = mockStore.extractions.get(documentId);
      ext.extracted_data.line_items = line_items;
      mockStore.extractions.set(documentId, ext);
    }

    this.logAudit({
      userId,
      action: status === 'verified' ? 'DOCUMENT_VERIFIED' : 'FIELD_CORRECTED',
      entityId: documentId,
      details: { fields_count: fields.length, status, notes }
    });

    return this.getDocumentById(documentId, userId);
  },

  /**
   * Delete Document
   */
  async deleteDocument(documentId, userId) {
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data: doc } = await supabaseAdmin
        .from('documents')
        .select('storage_path')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (doc?.storage_path) {
        await storageService.deleteFile(doc.storage_path);
      }

      await supabaseAdmin.from('documents').delete().eq('id', documentId);
      return true;
    }

    const doc = mockStore.documents.get(documentId);
    if (doc && doc.user_id === userId) {
      if (doc.storage_path) {
        storageService.deleteFile(doc.storage_path);
      }
      mockStore.documents.delete(documentId);
      mockStore.extractions.delete(documentId);
      for (const [k, v] of mockStore.fields.entries()) {
        if (v.document_id === documentId) mockStore.fields.delete(k);
      }
      return true;
    }
    return false;
  },

  /**
   * Log Audit Action
   */
  async logAudit({ userId, action, entityId, details }) {
    const entry = {
      id: uuidv4(),
      user_id: userId,
      action,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabaseAdmin) {
      await supabaseAdmin.from('audit_logs').insert(entry);
    } else {
      mockStore.auditLogs.unshift(entry);
    }
  },

  /**
   * Metrics and Analytics for Dashboard & Analytics Page
   */
  async getAnalytics(userId) {
    let docs = [];
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('id, document_class, status, overall_confidence, created_at')
        .eq('user_id', userId);

      if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
        docs = Array.from(mockStore.documents.values()).filter(d => d.user_id === userId);
      } else {
        docs = data || [];
      }
    } else {
      docs = Array.from(mockStore.documents.values()).filter(d => d.user_id === userId);
    }

    const total = docs.length;
    const needsReview = docs.filter(d => d.status === 'needs_review').length;
    const verified = docs.filter(d => d.status === 'verified').length;
    const processing = docs.filter(d => d.status === 'processing').length;
    const failed = docs.filter(d => d.status === 'failed').length;

    const confidences = docs.filter(d => typeof d.overall_confidence === 'number').map(d => d.overall_confidence);
    const avgConfidence = confidences.length > 0
      ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100) / 100
      : 0.92;

    const byClass = {
      Invoice: docs.filter(d => d.document_class === 'Invoice').length,
      Receipt: docs.filter(d => d.document_class === 'Receipt').length,
      Contract: docs.filter(d => d.document_class === 'Contract').length,
      Resume: docs.filter(d => d.document_class === 'Resume').length,
      IdentityProof: docs.filter(d => d.document_class === 'IdentityProof').length
    };

    // Calculate recent activity
    const recentActivity = isSupabaseConfigured() && supabaseAdmin
      ? (await supabaseAdmin.from('audit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)).data || []
      : mockStore.auditLogs.filter(a => a.user_id === userId).slice(0, 10);

    return {
      overview: {
        total_documents: total,
        needs_review: needsReview,
        verified: verified,
        processing: processing,
        failed: failed,
        average_confidence: avgConfidence,
        automation_rate: total > 0 ? Math.round((verified / total) * 100) : 0
      },
      distribution_by_class: byClass,
      recent_activity: recentActivity
    };
  }
};
