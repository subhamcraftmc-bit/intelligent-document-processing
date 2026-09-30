import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { DEMO_DOCUMENTS } from '../services/demoData';
import type { DocumentRecord, ExtractionField, LineItem, DocumentStatus } from '../types';
import { DocumentViewer } from '../components/DocumentViewer';
import { ExtractionDataGrid } from '../components/ExtractionDataGrid';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const doc = await api.documents.getById(id);
      setDocument(doc || DEMO_DOCUMENTS.find(d => d.id === id) || DEMO_DOCUMENTS[0]);
    } catch (err: any) {
      console.error('Failed to load document details, checking fallback:', err);
      const fallback = DEMO_DOCUMENTS.find(d => d.id === id) || DEMO_DOCUMENTS[0];
      if (fallback) {
        setDocument(fallback);
      } else {
        setToastMessage({ type: 'error', text: err.message || 'Error loading document' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [id]);

  const handleSaveFields = async (payload: {
    fields: Partial<ExtractionField>[];
    line_items?: LineItem[];
    status?: DocumentStatus;
    notes?: string;
  }) => {
    if (!id) return;
    try {
      setIsSaving(true);
      const updatedDoc = await api.documents.updateFields(id, payload);
      setDocument(updatedDoc);
      setToastMessage({
        type: 'success',
        text: payload.status === 'verified'
          ? 'Document verified and marked as approved!'
          : 'Changes saved successfully.'
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update fields:', err);
      setToastMessage({ type: 'error', text: err.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReExtract = async () => {
    if (!id) return;
    try {
      setIsReExtracting(true);
      const updatedDoc = await api.documents.reExtract(id);
      setDocument(updatedDoc);
      setToastMessage({ type: 'success', text: 'Document re-extracted with Gemini 2.0 Flash!' });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error('Re-extraction failed:', err);
      setToastMessage({ type: 'error', text: err.message || 'Re-extraction failed.' });
    } finally {
      setIsReExtracting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        <p className="text-xs text-slate-400">Loading document extraction workspace...</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-white">Document Not Found</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          The requested document may have been deleted or you do not have permission to access it.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 sm:p-6 space-y-4">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
                {document?.file_name || 'Document Workspace'}
              </h1>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                ID: {document?.id ? document.id.slice(0, 8) : 'unknown'}...
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Uploaded on {document?.created_at ? new Date(document.created_at).toLocaleString() : 'Recent'}
            </p>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}
      </div>

      {/* Split-View Workspace: Left = DocumentViewer, Right = ExtractionDataGrid */}
      <ErrorBoundary
        fallbackTitle="Workspace Rendering Issue"
        fallbackDescription="A visual glitch occurred while displaying this document preview or data table. Your edits and records are safe."
      >
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
          {/* Left Column: Original Document PDF / Image Viewer */}
          <div className="h-full min-h-[400px]">
            <DocumentViewer
              fileUrl={document.file_url}
              fileType={document.file_type}
              fileName={document.file_name}
            />
          </div>

          {/* Right Column: Editable Extraction Data Grid */}
          <div className="h-full min-h-[400px]">
            <ExtractionDataGrid
              document={document}
              onSave={handleSaveFields}
              onReExtract={handleReExtract}
              isSaving={isSaving}
              isReExtracting={isReExtracting}
            />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
