import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Filter, 
  ArrowUpDown, 
  Clock, 
  FileText, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw,
  ExternalLink,
  Check,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentRecord } from '../types';
import { ConfidenceRing } from '../components/ConfidenceRing';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { useToast } from '../context/ToastContext';

export const ReviewCenter: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'lowest_conf' | 'oldest' | 'newest'>('lowest_conf');
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  const loadReviewQueue = async () => {
    try {
      setLoading(true);
      setError(null);

      let sortBy = 'overall_confidence';
      let sortOrder = 'asc';

      if (sortOption === 'oldest') {
        sortBy = 'created_at';
        sortOrder = 'asc';
      } else if (sortOption === 'newest') {
        sortBy = 'created_at';
        sortOrder = 'desc';
      }

      // Query documents needing review
      const resp = await api.documents.list({
        status: 'needs_review',
        sortBy,
        sortOrder,
        limit: 50
      });

      setDocuments(resp.documents || []);
    } catch (err: any) {
      console.error('Failed to load review center documents:', err);
      setError(err.message || 'Unable to retrieve review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewQueue();
  }, [sortOption]);

  const handleQuickApprove = async (docId: string, fileName: string) => {
    try {
      setProcessingActionId(docId);
      await api.documents.updateFields(docId, {
        status: 'verified',
        notes: 'Directly verified from Smart Review Center.'
      });
      toast.success(`Document "${fileName}" marked as Verified & Approved.`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      toast.error(`Approval failed: ${err.message}`);
    } finally {
      setProcessingActionId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-indigo-950/40 p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl backdrop-blur-md">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>HUMAN-IN-THE-LOOP VERIFICATION</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Review Center & Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Triage low-confidence documents (&lt; 85%) and flagged entity ambiguities. Review side-by-side, verify anomalies, and ensure 100% extraction fidelity.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto bg-slate-900/80 p-4 rounded-2xl border border-slate-800 gap-2 shrink-0">
          <span className="text-xs text-amber-400 font-medium">Pending Human Action</span>
          <span className="text-3xl font-extrabold text-white font-mono">
            {loading ? '...' : documents.length}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {documents.length === 1 ? '1 document in queue' : `${documents.length} documents in queue`}
          </span>
        </div>
      </div>

      {/* Queue Toolbar: Sorting & Refresh */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ArrowUpDown className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-slate-200">Sort Queue By:</span>
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-brand-500"
          >
            <option value="lowest_conf">Lowest Confidence First (Priority)</option>
            <option value="oldest">Oldest Pending First</option>
            <option value="newest">Newest Ingestion First</option>
          </select>
        </div>

        <button
          type="button"
          onClick={loadReviewQueue}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Review Queue Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse space-y-4">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-8 bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-glow-emerald">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Review Queue is Clear!</h3>
            <p className="text-xs text-slate-400 mt-1">
              All ingested documents have met confidence validation thresholds (&gt;= 85%) or have been approved by human reviewers.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/upload"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all"
            >
              Upload Documents
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map(doc => {
            const isActing = processingActionId === doc.id;
            const flaggedCount = doc.fields ? doc.fields.filter(f => f.is_flagged).length : 0;
            const flaggedKeys = doc.fields ? doc.fields.filter(f => f.is_flagged).map(f => f.field_key).slice(0, 3) : [];

            return (
              <div
                key={doc.id}
                className="bg-slate-900/60 rounded-2xl border border-slate-800 hover:border-amber-500/40 p-5 flex flex-col justify-between transition-all duration-200 backdrop-blur-md shadow-lg group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        {doc.document_class || 'Document'}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white mt-1 group-hover:text-amber-300 transition-colors truncate max-w-xs sm:max-w-sm">
                        {doc.file_name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Uploaded {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>

                    <ConfidenceRing score={doc.overall_confidence} size={48} showLabel={false} />
                  </div>

                  {/* Flagged Fields Indicator */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{flaggedCount > 0 ? `${flaggedCount} field(s) require verification` : 'Overall score below 85% threshold'}</span>
                      </span>
                      <ConfidenceBadge score={doc.overall_confidence} size="sm" />
                    </div>

                    {flaggedKeys.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {flaggedKeys.map(key => (
                          <span
                            key={key}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            {key.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {flaggedCount > 3 && (
                          <span className="text-[10px] text-slate-500 self-center font-mono">
                            +{flaggedCount - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => handleQuickApprove(doc.id, doc.file_name)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors disabled:opacity-40"
                    title="Quick Approve as Verified"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Quick Verify</span>
                  </button>

                  <Link
                    to={`/documents/${doc.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-glow-brand transition-all"
                  >
                    <span>Inspect & Correct</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
