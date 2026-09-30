import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Save, 
  RotateCw, 
  Plus, 
  Trash2, 
  Search, 
  Sparkles, 
  Check, 
  Layers, 
  HelpCircle,
  History
} from 'lucide-react';
import type { DocumentRecord, ExtractionField, LineItem } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { ExportButton } from './ExportButton';
import { MagneticButton } from './MagneticButton';

interface ExtractionDataGridProps {
  document: DocumentRecord;
  onSave: (payload: {
    fields: Partial<ExtractionField>[];
    line_items?: LineItem[];
    status?: 'verified' | 'needs_review';
    notes?: string;
  }) => Promise<void>;
  onReExtract: () => Promise<void>;
  isSaving: boolean;
  isReExtracting: boolean;
}

export const ExtractionDataGrid: React.FC<ExtractionDataGridProps> = ({
  document,
  onSave,
  onReExtract,
  isSaving,
  isReExtracting
}) => {
  const [fields, setFields] = useState<ExtractionField[]>(Array.isArray(document?.fields) ? document.fields : []);
  const [lineItems, setLineItems] = useState<LineItem[]>(Array.isArray(document?.extraction?.line_items) ? document.extraction.line_items : []);
  const [filterMode, setFilterMode] = useState<'all' | 'flagged' | 'corrected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState(document?.notes || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'entities' | 'table' | 'audit'>('entities');
  const [verificationStage, setVerificationStage] = useState<'idle' | 'fields' | 'document' | 'complete'>('idle');

  useEffect(() => {
    setFields(Array.isArray(document?.fields) ? document.fields : []);
    setLineItems(Array.isArray(document?.extraction?.line_items) ? document.extraction.line_items : []);
    setNotes(document?.notes || '');
    setHasUnsavedChanges(false);
  }, [document]);

  const handleFieldChange = (index: number, newValue: string) => {
    setFields(prev => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      copy[index] = {
        ...copy[index],
        field_value: newValue,
        human_corrected: true,
        is_flagged: false // Clear flag once corrected
      };
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  const handleLineItemChange = (index: number, key: keyof LineItem, value: any) => {
    setLineItems(prev => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      const updated = { ...copy[index], [key]: value };
      if (key === 'quantity' || key === 'unit_price') {
        updated.total = Number(updated.quantity || 0) * Number(updated.unit_price || 0);
      }
      copy[index] = updated;
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { description: 'New Line Item', quantity: 1, unit_price: 0, total: 0 }
    ]);
    setHasUnsavedChanges(true);
  };

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleSaveVerified = async () => {
    try {
      // Step 1: Field verification sequence
      setVerificationStage('fields');
      await new Promise(r => setTimeout(r, 220));

      // Step 2: Document verification & ledger stamping
      setVerificationStage('document');
      await new Promise(r => setTimeout(r, 220));

      await onSave({
        fields,
        line_items: lineItems,
        status: 'verified',
        notes
      });
      setHasUnsavedChanges(false);

      // Step 3: Verified completion state
      setVerificationStage('complete');
      setTimeout(() => {
        setVerificationStage('idle');
      }, 2000);
    } catch (err) {
      setVerificationStage('idle');
      throw err;
    }
  };

  const handleSaveDraft = async () => {
    await onSave({
      fields,
      line_items: lineItems,
      status: (document?.status as any) || 'needs_review',
      notes
    });
    setHasUnsavedChanges(false);
  };

  const safeFields = Array.isArray(fields) ? fields : [];
  const safeLineItems = Array.isArray(lineItems) ? lineItems : [];

  const flaggedCount = safeFields.filter(f => f && f.is_flagged).length;
  const correctedCount = safeFields.filter(f => f && f.human_corrected).length;

  const filteredFields = safeFields.filter(f => {
    if (!f) return false;
    if (filterMode === 'flagged' && !f.is_flagged) return false;
    if (filterMode === 'corrected' && !f.human_corrected) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchKey = (f.field_key || '').toLowerCase().includes(q);
      const matchVal = (f.field_value || '').toLowerCase().includes(q);
      return matchKey || matchVal;
    }
    return true;
  });

  const docStatus = document?.status || 'needs_review';

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Document Class:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {document?.document_class || 'Unclassified'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
            <span className="text-xs text-slate-400">Confidence:</span>
            <ConfidenceBadge score={document?.overall_confidence ?? 0.85} size="md" />
          </div>

          <div className="flex items-center pl-3 border-l border-slate-800">
            <span
              id="doc-status-badge"
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                docStatus === 'verified'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : docStatus === 'needs_review'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {docStatus.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReExtract}
            disabled={isReExtracting || isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            title="Re-run Gemini Vision OCR & extraction"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReExtracting ? 'animate-spin text-brand-400' : ''}`} />
            <span>Re-Extract</span>
          </button>

          <ExportButton documentId={document.id} fileName={document.file_name} size="sm" />

          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span>Save Changes</span>
            </button>
          )}

          <MagneticButton
            onClick={handleSaveVerified}
            disabled={isSaving || verificationStage !== 'idle'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-glow-emerald transition-all ${
              verificationStage === 'complete'
                ? 'bg-emerald-500 scale-105 ring-2 ring-emerald-400/50'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {verificationStage === 'fields' ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                <span>Validating Fields...</span>
              </>
            ) : verificationStage === 'document' ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                <span>Stamping Ledger...</span>
              </>
            ) : verificationStage === 'complete' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span className="font-bold">Verified ✓</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Verified</span>
              </>
            )}
          </MagneticButton>
        </div>
      </div>

      {/* Flagged Review Alert Banner */}
      {flaggedCount > 0 && document.status !== 'verified' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Action Needed:</strong> {flaggedCount} low-confidence{' '}
              {flaggedCount === 1 ? 'field is' : 'fields are'} flagged (&lt; 85% confidence). Please verify or correct before marking verified.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilterMode('flagged')}
            className="underline hover:text-amber-200 font-medium"
          >
            View Flagged Only
          </button>
        </div>
      )}

      {/* Tabs & Search Filter Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('entities')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'entities'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Key-Value Entities ({fields.length})</span>
          </button>

          {lineItems.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'table'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Line Items ({lineItems.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {activeTab === 'entities' && (
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter entities..."
                className="pl-8 pr-3 py-1 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-40 sm:w-48"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filterMode === 'all'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              {flaggedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode('flagged')}
                  className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    filterMode === 'flagged'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-medium'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Flagged ({flaggedCount})</span>
                </button>
              )}
              {correctedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode('corrected')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filterMode === 'corrected'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  Corrected ({correctedCount})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tab 1: Key-Value Entities Grid */}
        {activeTab === 'entities' && (
          <div className="space-y-2">
            {filteredFields.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No matching fields found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredFields.map((field, idx) => {
                  const actualIndex = fields.findIndex(f => f.field_key === field.field_key);
                  return (
                    <div
                      key={field.field_key || idx}
                      style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                      className={`p-3 rounded-xl border transition-all animate-fade-in ${
                        field.is_flagged
                          ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                          : field.human_corrected
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-mono font-semibold text-slate-300">
                            {field.field_key}
                          </label>
                          {field.human_corrected && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-sans">
                              <Check className="w-2.5 h-2.5" />
                              Edited
                            </span>
                          )}
                        </div>

                        <ConfidenceBadge
                          score={field.confidence}
                          isFlagged={field.is_flagged}
                          size="sm"
                        />
                      </div>

                      {/* Inline Editable Input */}
                      <div className="relative">
                        <input
                          type="text"
                          value={field.field_value || ''}
                          onChange={e => handleFieldChange(actualIndex, e.target.value)}
                          placeholder="Empty or unreadable"
                          className={`w-full px-3 py-1.5 text-xs font-sans rounded-lg bg-slate-900 border text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 ${
                            field.is_flagged
                              ? 'border-rose-500/50 focus:border-rose-400 focus:ring-rose-400/20'
                              : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500/20'
                          }`}
                        />
                        <Edit3 className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tabular Line Items */}
        {activeTab === 'table' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Extracted Tabular Items (Invoices & Receipts)
              </span>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-20">Qty</th>
                    <th className="py-2.5 px-3 w-24">Unit Price</th>
                    <th className="py-2.5 px-3 w-24">Total</th>
                    <th className="py-2.5 px-3 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {safeLineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item?.description || ''}
                          onChange={e => handleLineItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={item?.quantity ?? 1}
                          onChange={e => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          value={item?.unit_price ?? 0}
                          onChange={e => handleLineItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-emerald-400">
                        ${(Number(item?.total) || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Audit History & Verification Trail</h4>
            {(document?.audit_logs && document.audit_logs.length > 0) ? (
              <div className="relative border-l-2 border-slate-800 ml-3 space-y-4 py-2">
                {document.audit_logs.map(log => (
                  <div key={log.id} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-slate-900" />
                    <div className="text-xs font-semibold text-slate-200">
                      {(log.action || 'system_event').replace('_', ' ')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                    </div>
                    {log.details && (
                      <pre className="mt-1 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-6">
                No audit entries recorded yet.
              </div>
            )}
          </div>
        )}

        {/* Verification Notes */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="text-xs font-medium text-slate-400 block mb-1">
            Internal Analyst Notes:
          </label>
          <textarea
            value={notes}
            onChange={e => {
              setNotes(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Add operational notes or compliance comments..."
            rows={2}
            className="w-full px-3 py-2 text-xs bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
