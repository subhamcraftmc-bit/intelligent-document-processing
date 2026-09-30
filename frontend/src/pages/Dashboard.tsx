import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Search, 
  Filter, 
  Trash2, 
  ArrowUpRight, 
  FileSpreadsheet, 
  ShieldCheck,
  RefreshCw,
  FolderOpen,
  ArrowUpDown,
  ShieldAlert,
  X,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentRecord, AnalyticsOverview } from '../types';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { ExportButton } from '../components/ExportButton';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sortOption, setSortOption] = useState<'created_at_desc' | 'created_at_asc' | 'confidence_asc' | 'confidence_desc' | 'name_asc'>('created_at_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Keyboard shortcut listener (/ to focus search, U for upload, R for review)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        navigate('/upload');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        navigate('/review');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      let sortBy = 'created_at';
      let sortOrder = 'desc';

      if (sortOption === 'created_at_asc') {
        sortBy = 'created_at';
        sortOrder = 'asc';
      } else if (sortOption === 'confidence_asc') {
        sortBy = 'overall_confidence';
        sortOrder = 'asc';
      } else if (sortOption === 'confidence_desc') {
        sortBy = 'overall_confidence';
        sortOrder = 'desc';
      } else if (sortOption === 'name_asc') {
        sortBy = 'file_name';
        sortOrder = 'asc';
      }

      const [docsResp, analyticsResp] = await Promise.all([
        api.documents.list({
          page,
          limit: 10,
          status: statusFilter,
          document_class: classFilter,
          search,
          sortBy,
          sortOrder
        }),
        api.analytics.get()
      ]);

      setDocuments(docsResp.documents);
      setTotalPages(docsResp.pagination.totalPages || 1);
      setOverview(analyticsResp.overview);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to connect to document services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, classFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClassFilter('all');
    setSortOption('created_at_desc');
    setPage(1);
  };

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (classFilter !== 'all' ? 1 : 0) + (search ? 1 : 0);

  const handleDelete = async (id: string, fileName: string) => {
    if (!window.confirm(`Delete document "${fileName}" and all associated extractions?`)) {
      return;
    }

    try {
      await api.documents.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      // Refresh stats
      const analyticsResp = await api.analytics.get();
      setOverview(analyticsResp.overview);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner & Quick Upload CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-mono mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>ENTERPRISE COMMAND CENTER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Intelligent Document Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Automated multimodal classification & entity extraction powered by Gemini 2.0 Vision
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Process New Documents</span>
          </Link>
        </div>
      </div>

      {/* Review Queue Alert Banner (if pending review documents exist) */}
      {overview && overview.needs_review > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">
                {overview.needs_review} Document{overview.needs_review > 1 ? 's' : ''} Require Human Verification
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Certain entities or confidence scores fell below the automated 85% threshold.
              </p>
            </div>
          </div>

          <Link
            to="/review"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-glow-amber"
          >
            <span>Open Review Queue</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Error Alert with Retry Action */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold transition-colors shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Ingested</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {overview?.total_documents ?? '...'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
              <FolderOpen className="w-3 h-3 text-brand-400" />
              <span>Multi-Format Ingestion</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Human Review */}
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-300">Needs Review (&lt; 85%)</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">
              {overview?.needs_review ?? '...'}
            </h3>
            <p className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Awaiting Verification</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-glow-amber">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Verified Documents */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-300">Verified & Approved</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">
              {overview?.verified ?? '...'}
            </h3>
            <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Export Ready</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Average AI Confidence */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Mean Confidence</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {overview ? `${Math.round(overview.average_confidence * 100)}%` : '...'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>Gemini 2.0 Multimodal</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search, Sorting & Filter Controls */}
      <div className="space-y-3">
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="w-full lg:w-80 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents (/ to focus)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Filter Dropdowns & Status Chips */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {['all', 'needs_review', 'verified'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg capitalize transition-all ${
                    statusFilter === status
                      ? 'bg-brand-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Document Class Select */}
            <select
              value={classFilter}
              onChange={e => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Document Types</option>
              <option value="Invoice">Invoices</option>
              <option value="Receipt">Receipts</option>
              <option value="Contract">Contracts</option>
              <option value="Resume">Resumes</option>
              <option value="IdentityProof">Identity Proofs</option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-400" />
              <select
                value={sortOption}
                onChange={e => {
                  setSortOption(e.target.value as any);
                  setPage(1);
                }}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="created_at_desc">Newest Uploads</option>
                <option value="created_at_asc">Oldest Uploads</option>
                <option value="confidence_asc">Lowest Confidence (Priority)</option>
                <option value="confidence_desc">Highest Confidence</option>
                <option value="name_asc">File Name (A-Z)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadData}
              title="Refresh list"
              className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Active Filters Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 animate-fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-300">Active Filters ({activeFilterCount}):</span>
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20 text-[11px]">
                  Status: {statusFilter.replace('_', ' ')}
                  <button type="button" onClick={() => setStatusFilter('all')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}
              {classFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20 text-[11px]">
                  Type: {classFilter}
                  <button type="button" onClick={() => setClassFilter('all')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-300 border border-brand-500/20 text-[11px]">
                  Search: "{search}"
                  <button type="button" onClick={() => setSearch('')}><X className="w-3 h-3 hover:text-white" /></button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold underline shrink-0 ml-3"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">AI Confidence</th>
                <th className="py-3.5 px-4">Date Uploaded</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-800/40">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="h-3 bg-slate-800 rounded w-36" />
                          <div className="h-2 bg-slate-800/60 rounded w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded-lg w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded-full w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-3 bg-slate-800 rounded w-28" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-6 bg-slate-800 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mx-auto shadow-inner">
                        <FolderOpen className="w-6 h-6 text-brand-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-200">No documents found in this view</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {search || statusFilter !== 'all' || classFilter !== 'all'
                          ? 'No records match your active search filters. Try clearing filters or adjusting your search term.'
                          : 'Upload invoices, receipts, or contracts to begin automated multimodal entity extraction.'}
                      </p>
                      <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all btn-interactive mt-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Process New Document</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Document Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-brand-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="font-semibold text-slate-200 hover:text-brand-400 truncate block transition-colors"
                            title={doc.file_name}
                          >
                            {doc.file_name}
                          </Link>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {((doc.file_size_bytes || 0) / 1024).toFixed(1)} KB • {((doc.file_type || '').split('/').pop() || (doc.file_name || '').split('.').pop() || 'DOC').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                        {doc.document_class || 'Pending'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          doc.status === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : doc.status === 'needs_review'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {doc.status === 'verified' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {doc.status === 'needs_review' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {(doc.status || 'needs_review').replace('_', ' ')}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-4">
                      <ConfidenceBadge
                        score={doc.overall_confidence}
                        isFlagged={doc.status === 'needs_review'}
                        showTier={true}
                        size="sm"
                      />
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors btn-interactive"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        <ExportButton documentId={doc.id} fileName={doc.file_name} size="sm" variant="secondary" />

                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, doc.file_name)}
                          title="Delete document"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors btn-interactive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
