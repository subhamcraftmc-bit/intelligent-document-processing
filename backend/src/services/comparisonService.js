import { geminiService } from './geminiService.js';
import { ai, isGeminiConfigured } from '../config/gemini.js';
import { logger } from '../utils/logger.js';

/**
 * Map variations of field names to a canonical comparison key
 * to intelligently align fields across different extraction runs/providers.
 */
const CANONICAL_FIELD_MAP = {
  // Merchant / Vendor
  merchant: 'merchant_name',
  merchant_name: 'merchant_name',
  vendor: 'merchant_name',
  vendor_name: 'merchant_name',
  store: 'merchant_name',
  seller: 'merchant_name',
  supplier: 'merchant_name',

  // Date
  date: 'transaction_date',
  transaction_date: 'transaction_date',
  invoice_date: 'transaction_date',
  receipt_date: 'transaction_date',
  issue_date: 'transaction_date',
  billing_date: 'transaction_date',

  // Due Date
  due_date: 'due_date',
  payment_due: 'due_date',
  payment_due_date: 'due_date',

  // Total
  total: 'total_amount',
  total_amount: 'total_amount',
  grand_total: 'total_amount',
  amount: 'total_amount',
  amount_due: 'total_amount',
  final_amount: 'total_amount',

  // Subtotal
  subtotal: 'subtotal_amount',
  subtotal_amount: 'subtotal_amount',
  net_amount: 'subtotal_amount',

  // Tax
  tax: 'tax_amount',
  tax_amount: 'tax_amount',
  vat: 'tax_amount',
  gst: 'tax_amount',
  sales_tax: 'tax_amount',

  // Payment
  payment_method: 'payment_method',
  payment_type: 'payment_method',
  payment_terms: 'payment_terms',

  // Invoice specifics
  invoice_number: 'invoice_number',
  invoice_no: 'invoice_number',
  inv_number: 'invoice_number',
  bill_number: 'invoice_number',

  // Contracts
  contract_title: 'contract_title',
  title: 'contract_title',
  party_one: 'party_one',
  party_1: 'party_one',
  party_two: 'party_two',
  party_2: 'party_two',
  effective_date: 'effective_date',
  expiry_date: 'expiry_date',
  termination_clause: 'termination_clause',
  governing_law: 'governing_law',
  liability_cap: 'liability_cap'
};

const getCanonicalKey = (rawKey) => {
  if (!rawKey) return '';
  const clean = rawKey.toString().trim().toLowerCase().replace(/[\s\-_]+/g, '_');
  return CANONICAL_FIELD_MAP[clean] || clean;
};

const formatKeyLabel = (key) => {
  if (!key) return '';
  return key
    .toString()
    .replace(/[_\-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Parse numeric/currency values to assist with delta calculations
 */
const parseNumericValue = (val) => {
  if (val === null || val === undefined) return null;
  const str = String(val).replace(/,/g, '').trim();
  const match = str.match(/[-+]?\$?[₹€£]?\s*([0-9]+(?:\.[0-9]+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return isNaN(num) ? null : num;
  }
  return null;
};

/**
 * Format numeric currency delta with signs and percentage
 */
const calculateDelta = (valA, valB) => {
  const numA = parseNumericValue(valA);
  const numB = parseNumericValue(valB);

  if (numA !== null && numB !== null) {
    const diff = numB - numA;
    const isCurrency = String(valA).includes('₹') || String(valB).includes('₹') ||
                       String(valA).includes('$') || String(valB).includes('$');
    const symbol = String(valB).includes('₹') || String(valA).includes('₹') ? '₹' :
                   String(valB).includes('$') || String(valA).includes('$') ? '$' : '';

    const percent = numA !== 0 ? ((diff / numA) * 100).toFixed(1) : null;
    const sign = diff > 0 ? '+' : '';
    const diffFormatted = `${sign}${symbol}${Math.abs(diff).toFixed(2).replace(/\.00$/, '')}`;

    if (percent !== null) {
      return `${diffFormatted} (${sign}${percent}%)`;
    }
    return diffFormatted;
  }

  return null;
};

export const comparisonService = {
  /**
   * Compare two document records and generate a structured diff model
   */
  async compareDocuments(docA, docB, options = {}) {
    logger.info(`Starting comparison between Doc A: ${docA.file_name} (${docA.id}) and Doc B: ${docB.file_name} (${docB.id})`);

    const fieldsA = Array.isArray(docA.fields) ? docA.fields : [];
    const fieldsB = Array.isArray(docB.fields) ? docB.fields : [];

    // Map fields by canonical key
    const mapA = new Map();
    fieldsA.forEach(f => {
      const canon = getCanonicalKey(f.field_key);
      mapA.set(canon, f);
    });

    const mapB = new Map();
    fieldsB.forEach(f => {
      const canon = getCanonicalKey(f.field_key);
      mapB.set(canon, f);
    });

    const allKeys = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));
    const fieldDiffs = [];

    let changedCount = 0;
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    for (const key of allKeys) {
      const itemA = mapA.get(key);
      const itemB = mapB.get(key);

      const label = formatKeyLabel(itemB?.field_key || itemA?.field_key || key);
      const valA = itemA?.field_value !== undefined ? itemA.field_value : null;
      const valB = itemB?.field_value !== undefined ? itemB.field_value : null;
      const confA = itemA?.confidence ?? null;
      const confB = itemB?.confidence ?? null;

      let status = 'UNCHANGED';
      let delta = null;

      if (itemA && !itemB) {
        status = 'REMOVED';
        removedCount++;
      } else if (!itemA && itemB) {
        status = 'ADDED';
        addedCount++;
      } else {
        // Both present - check value equivalence
        const cleanA = String(valA || '').trim();
        const cleanB = String(valB || '').trim();

        if (cleanA === cleanB) {
          status = 'UNCHANGED';
          unchangedCount++;
        } else {
          status = 'CHANGED';
          changedCount++;
          delta = calculateDelta(cleanA, cleanB);
        }
      }

      fieldDiffs.push({
        canonicalKey: key,
        rawKeyA: itemA?.field_key || null,
        rawKeyB: itemB?.field_key || null,
        label,
        valueA: valA,
        valueB: valB,
        confidenceA: confA,
        confidenceB: confB,
        status,
        delta
      });
    }

    // Sort: CHANGED first, then ADDED, REMOVED, UNCHANGED
    const statusPriority = { CHANGED: 0, ADDED: 1, REMOVED: 2, UNCHANGED: 3 };
    fieldDiffs.sort((a, b) => (statusPriority[a.status] ?? 4) - (statusPriority[b.status] ?? 4));

    // Compare Line Items if available
    const lineItemsA = docA.extraction?.line_items || [];
    const lineItemsB = docB.extraction?.line_items || [];
    const lineItemDiffs = this.compareLineItems(lineItemsA, lineItemsB);

    lineItemDiffs.forEach(li => {
      if (li.status === 'CHANGED') changedCount++;
      else if (li.status === 'ADDED') addedCount++;
      else if (li.status === 'REMOVED') removedCount++;
      else if (li.status === 'UNCHANGED') unchangedCount++;
    });

    const totalChanges = changedCount + addedCount + removedCount;
    const totalEntities = fieldDiffs.length + lineItemDiffs.length;
    const matchScore = totalEntities > 0
      ? Math.round((unchangedCount / totalEntities) * 100)
      : 100;

    // Generate accurate natural-language summary strictly from actual diff data
    let summaryText = this.generateDeterministicSummary({
      totalChanges,
      changedCount,
      addedCount,
      removedCount,
      unchangedCount,
      fieldDiffs,
      lineItemDiffs,
      docA,
      docB
    });

    // If Gemini is configured and requested, attempt concise AI synthesis
    if (isGeminiConfigured() && ai && options.useAiSummary) {
      try {
        const aiSummary = await this.generateGeminiDiffSummary(fieldDiffs, lineItemDiffs, summaryText);
        if (aiSummary) {
          summaryText = aiSummary;
        }
      } catch (err) {
        logger.warn('AI diff summary generation skipped or failed, using deterministic summary:', err.message);
      }
    }

    return {
      docA: {
        id: docA.id,
        file_name: docA.file_name,
        file_url: docA.file_url,
        file_type: docA.file_type,
        document_class: docA.document_class,
        overall_confidence: docA.overall_confidence,
        status: docA.status,
        created_at: docA.created_at
      },
      docB: {
        id: docB.id,
        file_name: docB.file_name,
        file_url: docB.file_url,
        file_type: docB.file_type,
        document_class: docB.document_class,
        overall_confidence: docB.overall_confidence,
        status: docB.status,
        created_at: docB.created_at
      },
      metrics: {
        totalChanges,
        changed: changedCount,
        changedCount,
        added: addedCount,
        addedCount,
        removed: removedCount,
        removedCount,
        unchanged: unchangedCount,
        unchangedCount,
        totalEntities,
        matchScore
      },
      fieldDiffs,
      lineItemDiffs,
      summary: summaryText,
      summaryText,
      comparedAt: new Date().toISOString()
    };
  },

  /**
   * Compare line item arrays by description / index
   */
  compareLineItems(itemsA, itemsB) {
    const diffs = [];
    const maxLen = Math.max(itemsA.length, itemsB.length);

    for (let i = 0; i < maxLen; i++) {
      const a = itemsA[i];
      const b = itemsB[i];

      const totA = a ? (a.total ?? a.total_price) : null;
      const totB = b ? (b.total ?? b.total_price) : null;

      if (a && !b) {
        diffs.push({
          index: i + 1,
          descriptionA: a.description,
          descriptionB: null,
          quantityA: a.quantity,
          quantityB: null,
          unitPriceA: a.unit_price,
          unitPriceB: null,
          totalA: totA,
          totalB: null,
          status: 'REMOVED'
        });
      } else if (!a && b) {
        diffs.push({
          index: i + 1,
          descriptionA: null,
          descriptionB: b.description,
          quantityA: null,
          quantityB: b.quantity,
          unitPriceA: null,
          unitPriceB: b.unit_price,
          totalA: null,
          totalB: totB,
          status: 'ADDED'
        });
      } else {
        const descMatch = String(a.description || '').trim().toLowerCase() === String(b.description || '').trim().toLowerCase();
        const priceMatch = (a.unit_price === undefined && b.unit_price === undefined) || Number(a.unit_price) === Number(b.unit_price);
        const qtyMatch = (a.quantity === undefined && b.quantity === undefined) || Number(a.quantity) === Number(b.quantity);
        const totalMatch = (totA === undefined && totB === undefined) || (totA !== null && totB !== null && Number(totA) === Number(totB));

        const isUnchanged = descMatch && priceMatch && qtyMatch && totalMatch;

        diffs.push({
          index: i + 1,
          descriptionA: a.description,
          descriptionB: b.description,
          quantityA: a.quantity,
          quantityB: b.quantity,
          unitPriceA: a.unit_price,
          unitPriceB: b.unit_price,
          totalA: totA,
          totalB: totB,
          deltaTotal: !isUnchanged && totA !== null && totB !== null ? (Number(totB) - Number(totA)).toFixed(2) : null,
          status: isUnchanged ? 'UNCHANGED' : 'CHANGED'
        });
      }
    }

    return diffs;
  },

  /**
   * Generate an accurate natural language summary strictly from actual diff metrics
   */
  generateDeterministicSummary({ totalChanges, changedCount, addedCount, removedCount, unchangedCount, fieldDiffs, lineItemDiffs }) {
    if (totalChanges === 0) {
      return `Documents are identical across all ${unchangedCount} extracted entities and line items. No discrepancies detected.`;
    }

    const sentences = [];
    sentences.push(`${totalChanges} total ${totalChanges === 1 ? 'change' : 'changes'} detected (${changedCount} changed, ${addedCount} added, ${removedCount} removed, ${unchangedCount} unchanged).`);

    // Key changed fields
    const changedFields = fieldDiffs.filter(f => f.status === 'CHANGED');
    if (changedFields.length > 0) {
      const topChanged = changedFields.slice(0, 3).map(f => {
        if (f.delta) {
          return `${f.label} updated from ${f.valueA || 'empty'} to ${f.valueB || 'empty'} [${f.delta}]`;
        }
        return `${f.label} changed from "${f.valueA || 'empty'}" to "${f.valueB || 'empty'}"`;
      });
      sentences.push(`Key entity updates: ${topChanged.join('; ')}.`);
    }

    // Added/Removed fields
    const addedFields = fieldDiffs.filter(f => f.status === 'ADDED').map(f => f.label);
    if (addedFields.length > 0) {
      sentences.push(`New fields in updated version: ${addedFields.join(', ')}.`);
    }

    const removedFields = fieldDiffs.filter(f => f.status === 'REMOVED').map(f => f.label);
    if (removedFields.length > 0) {
      sentences.push(`Fields omitted from updated version: ${removedFields.join(', ')}.`);
    }

    // Line items summary
    const changedLineItems = lineItemDiffs.filter(l => l.status === 'CHANGED');
    if (changedLineItems.length > 0) {
      sentences.push(`${changedLineItems.length} line ${changedLineItems.length === 1 ? 'item has' : 'items have'} adjusted rates or quantities.`);
    }

    return sentences.join(' ');
  },

  /**
   * Call Gemini to create a high-level executive natural language summary of diff
   */
  async generateGeminiDiffSummary(fieldDiffs, lineItemDiffs, fallbackSummary) {
    const compactDiff = {
      changed: fieldDiffs.filter(f => f.status === 'CHANGED').map(f => ({ field: f.label, original: f.valueA, updated: f.valueB, delta: f.delta })),
      added: fieldDiffs.filter(f => f.status === 'ADDED').map(f => ({ field: f.label, value: f.valueB })),
      removed: fieldDiffs.filter(f => f.status === 'REMOVED').map(f => ({ field: f.label, previous: f.valueA })),
      line_item_changes: lineItemDiffs.filter(l => l.status !== 'UNCHANGED').map(l => ({ item: l.descriptionB || l.descriptionA, status: l.status, delta: l.deltaTotal }))
    };

    const prompt = `You are an expert document auditor. Based STRICTLY on the following JSON diff of two documents, write a concise 2-sentence executive summary explaining what was modified, added, or removed. Do not invent any values.\n\nDiff Data:\n${JSON.stringify(compactDiff, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 150
      }
    });

    const text = response.text?.trim();
    return text || fallbackSummary;
  },

  /**
   * Generate CSV format for export
   */
  generateComparisonCsv(diffResult) {
    const headers = ['Category', 'Entity / Item', 'Status', 'Original Value (Doc A)', 'Updated Value (Doc B)', 'Delta / Difference'];
    const rows = [headers.join(',')];

    // Field diffs
    diffResult.fieldDiffs.forEach(f => {
      const category = 'Field';
      const label = `"${(f.label || '').replace(/"/g, '""')}"`;
      const status = f.status;
      const valA = `"${String(f.valueA || '').replace(/"/g, '""')}"`;
      const valB = `"${String(f.valueB || '').replace(/"/g, '""')}"`;
      const delta = `"${String(f.delta || '').replace(/"/g, '""')}"`;
      rows.push([category, label, status, valA, valB, delta].join(','));
    });

    // Line item diffs
    diffResult.lineItemDiffs.forEach(li => {
      const category = 'Line Item';
      const label = `"${(li.descriptionB || li.descriptionA || `Item #${li.index}`).replace(/"/g, '""')}"`;
      const status = li.status;
      const valA = `"${li.totalA !== undefined && li.totalA !== null ? `Qty ${li.quantityA || 1} @ ${li.unitPriceA || 0} = Total ${li.totalA}` : ''}"`;
      const valB = `"${li.totalB !== undefined && li.totalB !== null ? `Qty ${li.quantityB || 1} @ ${li.unitPriceB || 0} = Total ${li.totalB}` : ''}"`;
      const delta = `"${li.deltaTotal ? `Delta: ${li.deltaTotal}` : ''}"`;
      rows.push([category, label, status, valA, valB, delta].join(','));
    });

    return rows.join('\r\n');
  }
};
