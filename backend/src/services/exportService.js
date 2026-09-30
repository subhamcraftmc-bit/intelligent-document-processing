/**
 * Service to export document extractions to CSV or JSON formats
 */
export const exportService = {
  /**
   * Escape CSV values properly
   */
  escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  },

  /**
   * Generate clean multi-table CSV export for a document
   */
  generateCsv(doc) {
    const lines = [];

    // 1. Header Information
    lines.push('--- DOCUMENT METADATA ---');
    lines.push(['Property', 'Value'].map(this.escapeCsv).join(','));
    lines.push(['Document ID', doc.id].map(this.escapeCsv).join(','));
    lines.push(['File Name', doc.file_name].map(this.escapeCsv).join(','));
    lines.push(['Document Class', doc.document_class || 'Unclassified'].map(this.escapeCsv).join(','));
    lines.push(['Processing Status', doc.status].map(this.escapeCsv).join(','));
    lines.push(['Overall Confidence', `${Math.round((doc.overall_confidence || 0) * 100)}%`].map(this.escapeCsv).join(','));
    lines.push(['Created At', doc.created_at].map(this.escapeCsv).join(','));
    lines.push(['Updated At', doc.updated_at].map(this.escapeCsv).join(','));
    lines.push('');

    // 2. Extracted Key-Value Fields
    lines.push('--- EXTRACTED ENTITIES ---');
    lines.push(['Field Key', 'Extracted Value', 'Confidence Score', 'Flagged (<85%)', 'Human Corrected'].map(this.escapeCsv).join(','));
    
    if (doc.fields && doc.fields.length > 0) {
      doc.fields.forEach(f => {
        lines.push([
          f.field_key,
          f.field_value ?? 'N/A',
          `${Math.round((f.confidence ?? 0) * 100)}%`,
          f.is_flagged ? 'YES' : 'NO',
          f.human_corrected ? 'YES' : 'NO'
        ].map(this.escapeCsv).join(','));
      });
    } else {
      lines.push(['No fields extracted', '', '', '', ''].map(this.escapeCsv).join(','));
    }
    lines.push('');

    // 3. Tabular Line Items
    lines.push('--- LINE ITEMS / TABULAR DATA ---');
    lines.push(['Item #', 'Description', 'Quantity', 'Unit Price', 'Line Total'].map(this.escapeCsv).join(','));
    
    const lineItems = doc.extraction?.line_items || [];
    if (lineItems.length > 0) {
      lineItems.forEach((item, index) => {
        lines.push([
          index + 1,
          item.description || '',
          item.quantity ?? '',
          item.unit_price ? `$${Number(item.unit_price).toFixed(2)}` : '',
          item.total ? `$${Number(item.total).toFixed(2)}` : ''
        ].map(this.escapeCsv).join(','));
      });
    } else {
      lines.push(['No line items found', '', '', '', ''].map(this.escapeCsv).join(','));
    }

    return lines.join('\r\n');
  },

  /**
   * Generate clean JSON export
   */
  generateJson(doc) {
    return JSON.stringify({
      id: doc.id,
      file_name: doc.file_name,
      document_class: doc.document_class,
      status: doc.status,
      overall_confidence: doc.overall_confidence,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      fields: doc.fields?.map(f => ({
        key: f.field_key,
        value: f.field_value,
        confidence: f.confidence,
        is_flagged: f.is_flagged,
        human_corrected: f.human_corrected
      })) || [],
      line_items: doc.extraction?.line_items || [],
      summary: doc.extraction?.summary || ''
    }, null, 2);
  }
};
