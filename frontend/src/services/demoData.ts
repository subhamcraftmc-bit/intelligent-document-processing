import type { DocumentRecord, AnalyticsData, User } from '../types';

export const DEMO_USER: User = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'demo.analyst@cineforge.ai',
  full_name: 'Alex Mercer (Lead IDP Analyst)',
  role: 'admin'
};

export const DEMO_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    user_id: DEMO_USER.id,
    file_name: 'Apex_Cloud_INV-2026-8841.pdf',
    file_url: 'https://images.unsplash.com/photo-1554415707-9e4c09d48d53?auto=format&fit=crop&w=1200&q=80',
    file_type: 'application/pdf',
    file_size_bytes: 342190,
    document_class: 'Invoice',
    status: 'needs_review',
    overall_confidence: 0.88,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    extraction: {
      document_class: 'Invoice',
      overall_confidence: 0.88,
      summary: 'Commercial cloud engineering services invoice from Apex Cloud Solutions LLC.',
      line_items: [
        { description: 'Cloud Infrastructure Engineering & Migration', quantity: 20, unit_price: 150.00, total: 3000.00 },
        { description: 'Enterprise Gemini Vision Model Integration', quantity: 1, unit_price: 1000.00, total: 1000.00 },
        { description: 'Premium 24/7 SLA Maintenance & Monitoring', quantity: 1, unit_price: 250.00, total: 250.00 }
      ]
    },
    fields: [
      { id: 'f1', document_id: 'b1111111-1111-1111-1111-111111111111', field_key: 'vendor_name', field_value: 'Apex Cloud Solutions LLC', confidence: 0.98, is_flagged: false, human_corrected: false },
      { id: 'f2', document_id: 'b1111111-1111-1111-1111-111111111111', field_key: 'invoice_number', field_value: 'INV-2026-8841', confidence: 0.96, is_flagged: false, human_corrected: false },
      { id: 'f3', document_id: 'b1111111-1111-1111-1111-111111111111', field_key: 'invoice_date', field_value: '2026-09-28', confidence: 0.95, is_flagged: false, human_corrected: false },
      { id: 'f4', document_id: 'b1111111-1111-1111-1111-111111111111', field_key: 'due_date', field_value: '2026-10-28', confidence: 0.92, is_flagged: false, human_corrected: false },
      { id: 'f5', document_id: 'b1111111-1111-1111-1111-111111111111', field_key: 'subtotal_amount', field_value: '$4,250.00', confidence: 0.94, is_flagged: false, human_corrected: false },
      { id: 'f6', document_id: 'b1111111-1111-1111-1111-111111111111', field_key: 'tax_amount', field_value: '$382.50', confidence: 0.90, is_flagged: false, human_corrected: false },
      { id: 'f7', document_id: 'b1111111-1111-1111-1111-111111111111', field_key: 'total_amount', field_value: '$4,632.50', confidence: 0.97, is_flagged: false, human_corrected: false },
      { id: 'f8', document_id: 'b1111111-1111-1111-1111-111111111111', field_key: 'payment_terms', field_value: 'Net 30 Days (Direct Wire)', confidence: 0.79, is_flagged: true, human_corrected: false }
    ],
    audit_logs: [
      { id: 'a1', action: 'document_uploaded', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'a2', action: 'gemini_multimodal_extracted', created_at: new Date(Date.now() - 3600000 * 2).toISOString() }
    ]
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    user_id: DEMO_USER.id,
    file_name: 'Starbucks_Receipt_1042.jpg',
    file_url: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=1200&q=80',
    file_type: 'image/jpeg',
    file_size_bytes: 182400,
    document_class: 'Receipt',
    status: 'verified',
    overall_confidence: 0.97,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    extraction: {
      document_class: 'Receipt',
      overall_confidence: 0.97,
      summary: 'Point-of-sale receipt for cafeteria expenses.',
      line_items: [
        { description: 'Grande Caramel Macchiato', quantity: 2, unit_price: 6.25, total: 12.50 },
        { description: 'Artisan Butter Croissant', quantity: 1, unit_price: 4.50, total: 4.50 }
      ]
    },
    fields: [
      { id: 'r1', document_id: 'b2222222-2222-2222-2222-222222222222', field_key: 'merchant_name', field_value: 'Starbucks Coffee #1042', confidence: 0.99, is_flagged: false, human_corrected: false },
      { id: 'r2', document_id: 'b2222222-2222-2222-2222-222222222222', field_key: 'transaction_date', field_value: '2026-09-29', confidence: 0.95, is_flagged: false, human_corrected: false },
      { id: 'r3', document_id: 'b2222222-2222-2222-2222-222222222222', field_key: 'payment_method', field_value: 'Visa ending in 4022', confidence: 0.93, is_flagged: false, human_corrected: false },
      { id: 'r4', document_id: 'b2222222-2222-2222-2222-222222222222', field_key: 'total_amount', field_value: '$18.45', confidence: 0.97, is_flagged: false, human_corrected: false },
      { id: 'r5', document_id: 'b2222222-2222-2222-2222-222222222222', field_key: 'tax_amount', field_value: '$1.45', confidence: 0.90, is_flagged: false, human_corrected: false }
    ],
    audit_logs: [
      { id: 'a3', action: 'document_uploaded', created_at: new Date(Date.now() - 3600000 * 8).toISOString() },
      { id: 'a4', action: 'human_verified', created_at: new Date(Date.now() - 3600000 * 7).toISOString() }
    ]
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    user_id: DEMO_USER.id,
    file_name: 'Master_Services_Agreement_2026.pdf',
    file_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    file_type: 'application/pdf',
    file_size_bytes: 890100,
    document_class: 'Contract',
    status: 'verified',
    overall_confidence: 0.94,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 23).toISOString(),
    extraction: {
      document_class: 'Contract',
      overall_confidence: 0.94,
      summary: 'Master Services Agreement establishing terms of cloud infrastructure & AI delivery.',
      line_items: []
    },
    fields: [
      { id: 'c1', document_id: 'b3333333-3333-3333-3333-333333333333', field_key: 'contract_title', field_value: 'Master Services Agreement & NDA', confidence: 0.96, is_flagged: false, human_corrected: false },
      { id: 'c2', document_id: 'b3333333-3333-3333-3333-333333333333', field_key: 'party_one', field_value: 'CineForge AI Corporation', confidence: 0.97, is_flagged: false, human_corrected: false },
      { id: 'c3', document_id: 'b3333333-3333-3333-3333-333333333333', field_key: 'party_two', field_value: 'Nexus Data Technologies Inc.', confidence: 0.95, is_flagged: false, human_corrected: false },
      { id: 'c4', document_id: 'b3333333-3333-3333-3333-333333333333', field_key: 'effective_date', field_value: '2026-10-01', confidence: 0.94, is_flagged: false, human_corrected: false },
      { id: 'c5', document_id: 'b3333333-3333-3333-3333-333333333333', field_key: 'governing_law', field_value: 'State of California, USA', confidence: 0.91, is_flagged: false, human_corrected: false }
    ],
    audit_logs: [
      { id: 'a5', action: 'document_uploaded', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: 'a6', action: 'verified_automated', created_at: new Date(Date.now() - 3600000 * 23).toISOString() }
    ]
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    user_id: DEMO_USER.id,
    file_name: 'Store_Receipt_Original_v1.pdf',
    file_url: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=1200&q=80',
    file_type: 'application/pdf',
    file_size_bytes: 145200,
    document_class: 'Receipt',
    status: 'verified',
    overall_confidence: 0.96,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    extraction: {
      document_class: 'Receipt',
      overall_confidence: 0.96,
      summary: 'Original purchase receipt from ABC Store (Version 1.0).',
      line_items: [
        { description: 'Fresh Whole Milk', quantity: 1, unit_price: 60.00, total: 60.00 },
        { description: 'Organic Sourdough Bread', quantity: 1, unit_price: 140.00, total: 140.00 }
      ]
    },
    fields: [
      { id: 'sc1', document_id: 'b4444444-4444-4444-4444-444444444444', field_key: 'merchant_name', field_value: 'ABC Store', confidence: 0.99, is_flagged: false, human_corrected: false },
      { id: 'sc2', document_id: 'b4444444-4444-4444-4444-444444444444', field_key: 'transaction_date', field_value: '12/08/26', confidence: 0.97, is_flagged: false, human_corrected: false },
      { id: 'sc3', document_id: 'b4444444-4444-4444-4444-444444444444', field_key: 'subtotal_amount', field_value: '₹1,150', confidence: 0.95, is_flagged: false, human_corrected: false },
      { id: 'sc4', document_id: 'b4444444-4444-4444-4444-444444444444', field_key: 'tax_amount', field_value: '₹100', confidence: 0.94, is_flagged: false, human_corrected: false },
      { id: 'sc5', document_id: 'b4444444-4444-4444-4444-444444444444', field_key: 'total_amount', field_value: '₹1,250', confidence: 0.98, is_flagged: false, human_corrected: false },
      { id: 'sc6', document_id: 'b4444444-4444-4444-4444-444444444444', field_key: 'payment_method', field_value: 'Cash', confidence: 0.92, is_flagged: false, human_corrected: false },
      { id: 'sc7', document_id: 'b4444444-4444-4444-4444-444444444444', field_key: 'discount_code', field_value: 'SUMMER10', confidence: 0.88, is_flagged: false, human_corrected: false }
    ],
    audit_logs: [
      { id: 'a7', action: 'document_uploaded', created_at: new Date(Date.now() - 3600000 * 48).toISOString() }
    ]
  },
  {
    id: 'b5555555-5555-5555-5555-555555555555',
    user_id: DEMO_USER.id,
    file_name: 'Store_Receipt_Updated_v2.pdf',
    file_url: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=1200&q=80',
    file_type: 'application/pdf',
    file_size_bytes: 149800,
    document_class: 'Receipt',
    status: 'verified',
    overall_confidence: 0.98,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    extraction: {
      document_class: 'Receipt',
      overall_confidence: 0.98,
      summary: 'Updated revised purchase receipt from ABC Store with revised tax & total (Version 2.0).',
      line_items: [
        { description: 'Fresh Whole Milk', quantity: 1, unit_price: 70.00, total: 70.00 },
        { description: 'Organic Sourdough Bread', quantity: 1, unit_price: 140.00, total: 140.00 },
        { description: 'Sparkling Spring Water', quantity: 1, unit_price: 50.00, total: 50.00 }
      ]
    },
    fields: [
      { id: 'sc8', document_id: 'b5555555-5555-5555-5555-555555555555', field_key: 'merchant_name', field_value: 'ABC Store', confidence: 0.99, is_flagged: false, human_corrected: false },
      { id: 'sc9', document_id: 'b5555555-5555-5555-5555-555555555555', field_key: 'transaction_date', field_value: '12/08/26', confidence: 0.97, is_flagged: false, human_corrected: false },
      { id: 'sc10', document_id: 'b5555555-5555-5555-5555-555555555555', field_key: 'subtotal_amount', field_value: '₹1,330', confidence: 0.96, is_flagged: false, human_corrected: false },
      { id: 'sc11', document_id: 'b5555555-5555-5555-5555-555555555555', field_key: 'tax_amount', field_value: '₹120', confidence: 0.95, is_flagged: false, human_corrected: false },
      { id: 'sc12', document_id: 'b5555555-5555-5555-5555-555555555555', field_key: 'total_amount', field_value: '₹1,450', confidence: 0.99, is_flagged: false, human_corrected: false },
      { id: 'sc13', document_id: 'b5555555-5555-5555-5555-555555555555', field_key: 'payment_method', field_value: 'UPI', confidence: 0.94, is_flagged: false, human_corrected: false },
      { id: 'sc14', document_id: 'b5555555-5555-5555-5555-555555555555', field_key: 'loyalty_points_earned', field_value: '145 pts', confidence: 0.91, is_flagged: false, human_corrected: false }
    ],
    audit_logs: [
      { id: 'a8', action: 'document_uploaded', created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
      { id: 'a9', action: 'human_verified', created_at: new Date(Date.now() - 3600000 * 11).toISOString() }
    ]
  }
];

export const DEMO_ANALYTICS: AnalyticsData = {
  overview: {
    total_documents: 142,
    needs_review: 6,
    verified: 133,
    processing: 2,
    failed: 1,
    average_confidence: 0.94,
    automation_rate: 93.6
  },
  distribution_by_class: {
    Invoice: 74,
    Receipt: 38,
    Contract: 18,
    Resume: 8,
    IdentityProof: 4
  },
  recent_activity: [
    { id: 'act1', action: 'Document uploaded: Apex_Cloud_INV-2026-8841.pdf', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'act2', action: 'Gemini 2.0 Flash extracted 8 entities (confidence: 88%)', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'act3', action: 'Field flagged for review: payment_terms (confidence 79%)', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'act4', action: 'Human verification completed: Starbucks_Receipt_1042.jpg', created_at: new Date(Date.now() - 3600000 * 7).toISOString() }
  ]
};
