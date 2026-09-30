/**
 * Schema definition passed to Gemini API generateContent responseSchema
 * matching prompt specification.
 */
export const geminiExtractionSchema = {
  type: "OBJECT",
  properties: {
    document_class: {
      type: "STRING",
      description: "Classification of document: Invoice, Receipt, Contract, Resume, or IdentityProof"
    },
    overall_confidence: {
      type: "NUMBER",
      description: "Average confidence score between 0.0 and 1.0"
    },
    summary: {
      type: "STRING",
      description: "A 1-2 sentence executive summary of the document contents"
    },
    fields: {
      type: "ARRAY",
      description: "Key-value entities extracted from the document",
      items: {
        type: "OBJECT",
        properties: {
          key: {
            type: "STRING",
            description: "Standardized entity key name (e.g. 'vendor_name', 'invoice_date', 'total_amount', 'tax_amount')"
          },
          value: {
            type: "STRING",
            description: "Extracted value as string. If unreadable or missing, return null or empty string"
          },
          confidence: {
            type: "NUMBER",
            description: "Confidence score for this specific field between 0.0 and 1.0"
          }
        },
        required: ["key", "value", "confidence"]
      }
    },
    line_items: {
      type: "ARRAY",
      description: "Tabular line items or detailed entries (for invoices, receipts, statement line items)",
      items: {
        type: "OBJECT",
        properties: {
          description: { type: "STRING", description: "Item description or service rendered" },
          quantity: { type: "NUMBER", description: "Numerical quantity or hours" },
          unit_price: { type: "NUMBER", description: "Unit price or rate" },
          total: { type: "NUMBER", description: "Line total amount" }
        },
        required: ["description", "quantity", "unit_price", "total"]
      }
    }
  },
  required: ["document_class", "overall_confidence", "fields"]
};
